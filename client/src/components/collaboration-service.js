// firebaseYProvider.ts
import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'
import { doc as fsDoc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { ref as rRef, set as dbSet, onValue, onDisconnect } from 'firebase/database'
import { db } from '../firebase'
const uint8ArrayToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Helper function to convert Base64 to Uint8Array
const base64ToUint8Array = (base64) => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export class FirebaseYProvider {
  ydoc: Y.Doc
  awareness: Awareness
  roomId: string

  constructor(roomId: string) {
    this.roomId = roomId
    this.ydoc = new Y.Doc()
    this.awareness = new Awareness(this.ydoc)
    this.startSync()
    this.startAwareness()
  }

  async startSync() {
    const docRef = fsDoc(db, 'collab', this.roomId)
    const snap = await getDoc(docRef)
    if (snap.exists()) {
      const data = snap.data()
      if (data?.content) {
        Y.applyUpdate(this.ydoc, base64ToUint8Array(data.content), 'init')
      }
    } else {
      await setDoc(docRef, {
        content: uint8ArrayToBase64(Y.encodeStateAsUpdate(this.ydoc)),
        lastUpdated: new Date().toISOString(),
      })
    }

    onSnapshot(docRef, (snap) => {
      const data = snap.data()
      if (data?.content) {
        Y.applyUpdate(this.ydoc, base64ToUint8Array(data.content), 'remote')
      }
    })

    this.ydoc.on('update', (upd, origin) => {
      if (origin !== 'remote' && origin !== 'init') {
        setDoc(docRef, {
          content: uint8ArrayToBase64(upd),
          lastUpdated: new Date().toISOString(),
        }, { merge: true }).catch(console.error)
      }
    })
  }

  startAwareness() {
    const userId = this.ydoc.clientID.toString()
    const localRef = rRef(db, `awareness/${this.roomId}/${userId}`)
    const roomRef = rRef(db, `awareness/${this.roomId}`)

    const send = () => {
      const s = this.awareness.getLocalState()
      if (s) {
        dbSet(localRef, { ...s, ts: Date.now() })
      }
    }

    this.awareness.on('update', send)
    send()

    onDisconnect(localRef).remove()
    onValue(roomRef, (snap) => {
      const data = snap.val() || {}
      const states = new Map()
      Object.entries(data).forEach(([_, entry]: any) => {
        if (entry.clientID !== this.ydoc.clientID) {
          states.set(entry.clientID, entry)
        }
      })
      this.awareness.setAwarenessStates(states)
    })
  }
}
