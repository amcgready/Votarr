// src/controllers/websocketController.ts
import WebSocket from 'ws';
import { IncomingMessage } from 'http';
import { WebSocketService } from '../services/websocketService';
import { validateWSMessage } from '../middleware/validation';
import { WSMessage, WSMessageType } from '../types/websocket';
import { logger } from '../config/logger';
import { verifyToken } from '../middleware/auth';

export class WebSocketController {
  private wsService: WebSocketService;

  constructor() {
    this.wsService = new WebSocketService();
  }

  public handleConnection = async (ws: WebSocket, request: IncomingMessage) => {
    try {
      // Extract token from request headers or query parameters
      const token = this.extractToken(request);
      const user = await verifyToken(token);

      if (!user) {
        ws.close(4001, 'Unauthorized');
        return;
      }

      // Store user information with the WebSocket connection
      this.wsService.registerConnection(ws, user.id);
      
      logger.info(`WebSocket connection established for user ${user.id}`);

      ws.on('message', (message: string) => this.handleMessage(ws, message, user.id));
      ws.on('close', () => this.handleDisconnection(user.id));
      ws.on('error', (error) => this.handleError(ws, error, user.id));

    } catch (error) {
      logger.error('WebSocket connection error:', error);
      ws.close(4000, 'Connection error');
    }
  };

  private handleMessage = async (ws: WebSocket, message: string, userId: string) => {
    try {
      const parsedMessage = JSON.parse(message) as WSMessage;
      const validatedMessage = validateWSMessage(parsedMessage);

      switch (validatedMessage.type) {
        case WSMessageType.JOIN_SESSION:
          await this.wsService.handleSessionJoin(
            userId,
            validatedMessage.sessionId!
          );
          break;

        case WSMessageType.LEAVE_SESSION:
          await this.wsService.handleSessionLeave(
            userId,
            validatedMessage.sessionId!
          );
          break;

        case WSMessageType.VOTE_UPDATE:
          await this.wsService.handleVoteUpdate(
            userId,
            validatedMessage.sessionId!,
            validatedMessage.payload
          );
          break;

        case WSMessageType.CHAT_MESSAGE:
          await this.wsService.handleChatMessage(
            userId,
            validatedMessage.sessionId!,
            validatedMessage.payload
          );
          break;

        default:
          ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Unknown message type'
          }));
      }

      logger.info(`WebSocket message handled for user ${userId}: ${validatedMessage.type}`);
    } catch (error) {
      logger.error(`WebSocket message error for user ${userId}:`, error);
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Failed to process message'
      }));
    }
  };

  private handleDisconnection = (userId: string) => {
    this.wsService.removeConnection(userId);
    logger.info(`WebSocket connection closed for user ${userId}`);
  };

  private handleError = (ws: WebSocket, error: Error, userId: string) => {
    logger.error(`WebSocket error for user ${userId}:
