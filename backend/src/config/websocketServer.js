const WebSocket = require('ws');

class WebSocketServer {
  constructor(server, port) {
    // If server is provided, attach to it; otherwise create standalone server
    if (server) {
      this.wss = new WebSocket.Server({ 
        server: server,
        path: '/ws'
      });
    } else {
      this.wss = new WebSocket.Server({ 
        port: port,
        path: '/ws'
      });
    }
    this.clients = new Map(); // Map of userId -> Set of WebSocket connections
    
    this.wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection attempt');
      
      // Extract user ID from query params or auth token
      try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const userId = url.searchParams.get('userId');
        
        if (userId) {
          if (!this.clients.has(userId)) {
            this.clients.set(userId, new Set());
          }
          this.clients.get(userId).add(ws);
          
          // Store userId on the connection
          ws.userId = userId;
        } else {
          console.warn('WebSocket connection without userId parameter');
        }
      } catch (err) {
        console.error('Error parsing WebSocket connection URL:', err.message);
      }
      
      ws.on('close', () => {
        if (ws.userId && this.clients.has(ws.userId)) {
          this.clients.get(ws.userId).delete(ws);
          if (this.clients.get(ws.userId).size === 0) {
            this.clients.delete(ws.userId);
          }
        }
        console.log('WebSocket connection closed');
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
      
      // Send ping to keep connection alive
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });
    });
    
    // Ping interval to keep connections alive
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }
  
  // Broadcast to all clients
  broadcast(data) {
    const message = JSON.stringify(data);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
  
  // Send to specific user
  sendToUser(userId, data) {
    const message = JSON.stringify(data);
    if (this.clients.has(userId)) {
      this.clients.get(userId).forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }
  
  // Send to all users except sender
  broadcastExcept(userId, data) {
    const message = JSON.stringify(data);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.userId !== userId) {
        client.send(message);
      }
    });
  }
}

module.exports = WebSocketServer;

