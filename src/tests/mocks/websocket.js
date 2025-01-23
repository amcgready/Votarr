// src/tests/mocks/websocket.js
export class MockWebSocket {
  static instances = [];
  
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    this.listeners = new Map();
    MockWebSocket.instances.push(this);
    
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.dispatchEvent(new Event('open'));
    }, 50);
  }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(listener);
  }

  removeEventListener(type, listener) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).delete(listener);
    }
  }

  dispatchEvent(event) {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }
  }

  send(data) {
    // Store sent messages for verification
    if (!this.sentMessages) {
      this.sentMessages = [];
    }
    this.sentMessages.push(JSON.parse(data));
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    this.dispatchEvent(new Event('close'));
  }

  // Test helper methods
  simulateMessage(data) {
    const messageEvent = new MessageEvent('message', {
      data: JSON.stringify(data)
    });
    this.dispatchEvent(messageEvent);
  }

  simulateError() {
    this.dispatchEvent(new Event('error'));
  }

  simulateDisconnect() {
    this.close();
  }
}
