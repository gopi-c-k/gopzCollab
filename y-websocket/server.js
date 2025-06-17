import dotenv from 'dotenv'
dotenv.config()

import { setupWSConnection, docs } from '@y/websocket-server/utils'
import { WebSocketServer } from 'ws'
import http from 'http'
import * as Y from 'yjs'

const port = parseInt(process.env.PORT) || 1234
const server = http.createServer((req, res) => {
    res.writeHead(200)
    res.end('WebSocket server running\n')
})

const wss = new WebSocketServer({ server });
const roomUsersMap = new Map();

wss.on('connection', (conn, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`)
    const room = url.pathname.slice(1) || 'default-room'
    const params = url.searchParams
    const field = params.get('field') || 'default';
    setupWSConnection(conn, req, { docName: room })
    const ydoc = docs.get(room);
    if (!roomUsersMap.has(room)) {
        roomUsersMap.set(room, new Set());
    }
    roomUsersMap.get(room).add(conn);

    if (ydoc) {
        const getContent = () => {
            try {
                try {
                    const xmlFragment = ydoc.getXmlFragment(field)
                    const xmlContent = xmlFragment.toString()
                    if (xmlContent) return { type: 'xml', content: xmlContent }
                } catch { }
                try {
                    const ytext = ydoc.getText(field)
                    const textContent = ytext.toString()
                    if (textContent) return { type: 'text', content: textContent }
                } catch { }
                const availableTypes = Array.from(ydoc.share.keys())
                return {
                    type: 'unknown',
                    availableTypes,
                    message: 'Content not found in specified field, checking all types...'
                }
            } catch (err) {
                return { type: 'error', message: err.message }
            }
        }
        conn.on('close', async () => {
            const roomUsers = roomUsersMap.get(room);
            if (roomUsers) {
                roomUsers.delete(conn);
                if (roomUsers.size === 0) {
                    roomUsersMap.delete(room); // optional cleanup
                    const finalContent = getContent();
                  //  console.log(`🛑 All users left room "${room}", field "${field}". Final content:`, finalContent);
                    saveContent(room, field, finalContent);
                }
            }
        })
    }
})

server.listen(port, '0.0.0.0', () => {
    console.log(`✅ Server running at 0.0.0.0:${port}`)
})

// Example save function
async function saveContent(room, field, content) {
    console.log(`Saving content for room ${room}, field ${field}:`, content.content);
    // Implement your database saving logic here
}