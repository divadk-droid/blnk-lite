/**
 * BLNK WebSocket Real-time Alert System
 * Live monitoring with WebSocket connections
 */

const WebSocket = require('ws');
const http = require('http');

class WebSocketAlertSystem {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // Map of client connections
    this.subscriptions = new Map(); // Map of token -> subscribed clients
    
    this.setupWebSocketServer();
  }
  
  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      console.log(`🔌 WebSocket client connected: ${clientId}`);
      
      // Store client
      this.clients.set(clientId, {
        ws,
        id: clientId,
        subscriptions: new Set(),
        connectedAt: Date.now()
      });
      
      // Send welcome message
      this.sendToClient(clientId, {
        type: 'connection',
        status: 'connected',
        clientId,
        message: 'BLNK Real-time Alert System'
      });
      
      // Handle messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(clientId, message);
        } catch (error) {
          this.sendToClient(clientId, {
            type: 'error',
            message: 'Invalid JSON'
          });
        }
      });
      
      // Handle disconnect
      ws.on('close', () => {
        console.log(`🔌 WebSocket client disconnected: ${clientId}`);
        this.handleDisconnect(clientId);
      });
      
      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for ${clientId}:`, error);
      });
    });
  }
  
  /**
   * Handle incoming messages
   */
  handleMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    switch (message.type) {
      case 'subscribe':
        this.handleSubscribe(clientId, message);
        break;
        
      case 'unsubscribe':
        this.handleUnsubscribe(clientId, message);
        break;
        
      case 'ping':
        this.sendToClient(clientId, { type: 'pong', timestamp: Date.now() });
        break;
        
      case 'get_stats':
        this.sendStats(clientId);
        break;
        
      default:
        this.sendToClient(clientId, {
          type: 'error',
          message: `Unknown message type: ${message.type}`
        });
    }
  }
  
  /**
   * Handle subscription request
   */
  handleSubscribe(clientId, message) {
    const { tokens, alertTypes = ['all'] } = message;
    
    if (!tokens || !Array.isArray(tokens)) {
      return this.sendToClient(clientId, {
        type: 'error',
        message: 'tokens array required'
      });
    }
    
    const client = this.clients.get(clientId);
    
    for (const token of tokens) {
      const normalizedToken = token.toLowerCase();
      
      // Add to client's subscriptions
      client.subscriptions.add(normalizedToken);
      
      // Add to global subscriptions
      if (!this.subscriptions.has(normalizedToken)) {
        this.subscriptions.set(normalizedToken, new Set());
      }
      this.subscriptions.get(normalizedToken).add(clientId);
    }
    
    this.sendToClient(clientId, {
      type: 'subscribed',
      tokens,
      alertTypes,
      message: `Subscribed to ${tokens.length} token(s)`
    });
  }
  
  /**
   * Handle unsubscribe request
   */
  handleUnsubscribe(clientId, message) {
    const { tokens } = message;
    const client = this.clients.get(clientId);
    
    if (tokens === 'all') {
      // Unsubscribe from all
      for (const token of client.subscriptions) {
        this.subscriptions.get(token)?.delete(clientId);
      }
      client.subscriptions.clear();
      
      this.sendToClient(clientId, {
        type: 'unsubscribed',
        message: 'Unsubscribed from all tokens'
      });
    } else if (Array.isArray(tokens)) {
      // Unsubscribe from specific tokens
      for (const token of tokens) {
        const normalizedToken = token.toLowerCase();
        client.subscriptions.delete(normalizedToken);
        this.subscriptions.get(normalizedToken)?.delete(clientId);
      }
      
      this.sendToClient(clientId, {
        type: 'unsubscribed',
        tokens,
        message: `Unsubscribed from ${tokens.length} token(s)`
      });
    }
  }
  
  /**
   * Handle client disconnect
   */
  handleDisconnect(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    // Remove from all subscriptions
    for (const token of client.subscriptions) {
      this.subscriptions.get(token)?.delete(clientId);
    }
    
    // Remove client
    this.clients.delete(clientId);
  }
  
  /**
   * Send alert to subscribed clients
   */
  broadcastAlert(token, alert) {
    const normalizedToken = token.toLowerCase();
    const subscribers = this.subscriptions.get(normalizedToken);
    
    if (!subscribers || subscribers.size === 0) return;
    
    const message = {
      type: 'alert',
      token: normalizedToken,
      alert,
      timestamp: Date.now()
    };
    
    for (const clientId of subscribers) {
      this.sendToClient(clientId, message);
    }
    
    console.log(`📢 Alert sent to ${subscribers.size} subscriber(s) for ${token}`);
  }
  
  /**
   * Send message to specific client
   */
  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) return;
    
    client.ws.send(JSON.stringify(message));
  }
  
  /**
   * Send stats to client
   */
  sendStats(clientId) {
    const stats = {
      type: 'stats',
      connectedClients: this.clients.size,
      totalSubscriptions: this.subscriptions.size,
      timestamp: Date.now()
    };
    
    this.sendToClient(clientId, stats);
  }
  
  /**
   * Generate unique client ID
   */
  generateClientId() {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get system stats
   */
  getStats() {
    return {
      connectedClients: this.clients.size,
      totalSubscriptions: this.subscriptions.size,
      subscriptionsByToken: Array.from(this.subscriptions.entries()).map(([token, clients]) => ({
        token,
        subscriberCount: clients.size
      }))
    };
  }
  
  /**
   * Trigger test alert
   */
  triggerTestAlert(token = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2') {
    this.broadcastAlert(token, {
      type: 'test',
      severity: 'info',
      message: 'This is a test alert',
      data: { test: true }
    });
  }
}

module.exports = { WebSocketAlertSystem };
