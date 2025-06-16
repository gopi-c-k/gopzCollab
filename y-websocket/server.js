import dotenv from 'dotenv'
dotenv.config()

import { setupWSConnection } from '@y/websocket-server/utils'
import { WebSocketServer } from 'ws'
import http from 'http'


const port = parseInt(process.env.PORT) || 1234;
const server = http.createServer((req, res) => {
  res.writeHead(200)
  res.end('WebSocket server running\n')
})

const wss = new WebSocketServer({ server })
wss.on('connection', setupWSConnection)

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server running at 0.0.0.0:${port}`)
})
