const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const PORT = 8080;

// Middleware
app.use(cors());
app.use(express.json());

// HTTP szerver létrehozása
const server = http.createServer(app);

// Websocket szerver létrehozása
const wss = new WebSocket.Server({ server });

// Websocket események kezelése
wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    console.log(`Received: ${message}`);
    const parsedMessage = JSON.parse(message);

    if (parsedMessage.type === 'deleteMessage') {
      // Üzenet törlése az összes kliensnél
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(parsedMessage));
        }
      });
    } else {
      // Normál üzenet továbbítása
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Példa API végpont
app.get('/api/data', (req, res) => {
  res.json({ message: 'Hello from Node.js server!' });
});

// Szerver indítása
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
