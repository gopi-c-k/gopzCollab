import dotenv from 'dotenv';
dotenv.config();

import { setupWSConnection, docs } from '@y/websocket-server/utils';
import { WebSocketServer } from 'ws';
import http from 'http';
import axios from 'axios';

const port = parseInt(process.env.PORT) || 1234;
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('WebSocket server running\n');
});

const wss = new WebSocketServer({ server });
const roomUsersMap = new Map();

wss.on('connection', (conn, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const room = url.pathname.slice(1) || 'default-room';
  const params = url.searchParams;
  const field = params.get('field') || 'default';

  console.log(`New connection: room=${room}, field=${field}`);

  setupWSConnection(conn, req, { docName: room });

  const ydoc = docs.get(room);

  if (!roomUsersMap.has(room)) {
    roomUsersMap.set(room, new Set());
  }

  roomUsersMap.get(room).add(conn);

  if (ydoc) {
    const getContent = () => {
      try {
        const xmlFragment = ydoc.getXmlFragment(field);
        const xmlContent = xmlFragment.toString();
        if (xmlContent) return { type: 'xml', content: xmlContent };
      } catch { }

      try {
        const ytext = ydoc.getText(field);
        const textContent = ytext.toString();
        if (textContent) return { type: 'text', content: textContent };
      } catch { }

      const availableTypes = Array.from(ydoc.share.keys());
      return {
        type: 'unknown',
        availableTypes,
        message: 'Could not extract content from document',
      };
    };

    conn.on('close', async () => {
      const roomUsers = roomUsersMap.get(room);

      if (roomUsers) {
        roomUsers.delete(conn);

        if (roomUsers.size === 0) {
          roomUsersMap.delete(room);
          const finalContent = getContent();
          if (roomUsers.size === 0) {
            const ymap = docs.get(room)?.getMap('canvasState');
            if (ymap) {
              await saveYMapJSONToBackend(room, ymap);
            }
          }

          if (finalContent?.content) {
            try {
              const response = await axios.patch(
                `${process.env.BACKEND_URL}/room/content/update`,
                {
                  sessionId: room,
                  content: finalContent.content,
                }, {
                headers: {
                  'Authorization': `Bearer ${process.env.SECRET_KEY}`
                }
              }
              );
              console.log(`✅ Final content saved for room ${room}:`, response.data);
            } catch (error) {
              console.error(`❌ Failed to save content for room ${room}:`, error.message);
            }
            try {
              const response = await axios.post(
                `${process.env.BACKEND_URL}/session/end/${room}`, {},
                {
                  headers: {
                    'Authorization': `Bearer ${process.env.SECRET_KEY}`
                  }
                }
              );

              console.log("Session activity save and dead", response.data);
            } catch (error) {
              console.error(`❌ Failed to dead the session ${room}:`, error.message);
            }
          } else {
            console.log(`ℹ️ No content to save for room ${room}.`);
          }
        }
      }
    });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ WebSocket Server running at http://0.0.0.0:${port}`);
});

function exportYMapAsJSON(yobjectmap) {
  const result = {};

  yobjectmap.forEach((value, key) => {
    if (key.startsWith('id-')) {
      result[key] = value;
    }
  });

  return result;
}
async function saveYMapJSONToBackend(room, ymap) {
  if (ymap) {
    const jsonObj = exportYMapAsJSON(ymap);
    if (Object.keys(jsonObj).length > 0) {
      const jsonString = JSON.stringify(jsonObj);
      try {
        const response = await axios.patch(
          `${process.env.BACKEND_URL}/room/content/update`,
          {
            sessionId: room,
            content: jsonString,
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.SECRET_KEY}`
            }
          }
        );

        console.log(`✅ YMap JSON saved for room ${room}`, response.data);
      } catch (error) {
        console.error(`❌ Error saving YMap JSON for room ${room}:`, error.message);
      }

      try {
        const response = await axios.post(
          `${process.env.BACKEND_URL}/session/end/${room}`, {},
          {
            headers: {
              'Authorization': `Bearer ${process.env.SECRET_KEY}`
            }
          }
        );

        console.log("Session activity save and dead", response.data);
      } catch (error) {
        console.error(`❌ Failed to dead the session ${room}:`, error.message);
      }
    }
  }
}

