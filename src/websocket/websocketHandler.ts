// src/websocket/websocketHandler.ts
import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken } from '../utils/jwt';
import { logger } from '../utils/logger';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  sessionId?: string;
}

interface WebSocketMessage {
  type: string;
  payload: any;
}

const sessions = new Map<string, Set<AuthenticatedWebSocket>>();

export const setupWebSocketHandlers = (wss: WebSocketServer) => {
  wss.on('connection', async (ws: AuthenticatedWebSocket, request) => {
    try {
      // Extract token from query string
      const token = new URL(request.url!, 'ws://localhost').searchParams.get('token');
      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }

      // Verify token
      const payload = await verifyToken(token);
      ws.userId = payload.userId;

      // Handle incoming messages
      ws.on('message', async (data: string) => {
        try {
          const message: WebSocketMessage = JSON.parse(data);
          handleMessage(ws, message);
        } catch (error) {
          logger.error('Error handling WebSocket message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            payload: 'Invalid message format'
          }));
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        if (ws.sessionId) {
          removeFromSession(ws);
        }
      });

    } catch (error) {
      logger.error('WebSocket connection error:', error);
      ws.close(1008, 'Authentication failed');
    }
  });
};

const handleMessage = (ws: AuthenticatedWebSocket, message: WebSocketMessage) => {
  switch (message.type) {
    case 'join_session':
      joinSession(ws, message.payload.sessionId);
      break;
    case 'leave_session':
      removeFromSession(ws);
      break;
    case 'vote_cast':
      broadcastToSession(ws.sessionId!, {
        type: 'vote_update',
        payload: message.payload
      });
      break;
    case 'session_update':
      broadcastToSession(ws.sessionId!, {
        type: 'session_state_update',
        payload: message.payload
      });
      break;
    default:
      ws.send(JSON.stringify({
        type: 'error',
        payload: 'Unknown message type'
      }));
  }
};

const joinSession = (ws: AuthenticatedWebSocket, sessionId: string) => {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, new Set());
  }
  sessions.get(sessionId)!.add(ws);
  ws.sessionId = sessionId;
};

const removeFromSession = (ws: AuthenticatedWebSocket) => {
  if (ws.sessionId && sessions.has(ws.sessionId)) {
    sessions.get(ws.sessionId)!.delete(ws);
    if (sessions.get(ws.sessionId)!.size === 0) {
      sessions.delete(ws.sessionId);
    }
  }
};

const broadcastToSession = (sessionId: string, message: WebSocketMessage) => {
  const sessionClients = sessions.get(sessionId);
  if (sessionClients) {
    const messageString = JSON.stringify(message);
    sessionClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageString);
      }
    });
  }
};
