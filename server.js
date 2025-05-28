const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');

const server = http.createServer((req, res) => {
  const file = req.url === '/' ? '/index.html' : req.url;
  fs.readFile(__dirname + file, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }
    res.writeHead(200);
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server });
let clients = [];

wss.on('connection', (ws) => {
  clients.push(ws);
  ws.on('message', (message) => {
    const msgString = message.toString();
    console.log(msgString);
    clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msgString);
      }
    });
  });
  ws.on('close', () => {
    clients = clients.filter(c => c !== ws);
  });
});

server.listen(8080, () => {
  console.log('Server läuft auf http://localhost:8080');
});
