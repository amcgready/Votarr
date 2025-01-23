// src/services/websocketService.ts
import WebSocket from 'ws';
import { Server } from 'http';
import { EventEmitter } from 'events';
import { Logger } from '../config/logger';
import { CustomError } from '../errors/CustomError';
import { Redis } from 'ioredis';

interface WebSocketMessage {
  type: string;
  payload: any;
}

interface ConnectedClient {
  userId: string;
  socket: WebSocket;
  lastHeartbeat: number;
  sessionId?: string;
}

export class WebSocketService {
  private wss: WebSocket.Server;
  private clients: Map<string, ConnectedClient> = new Map();
  private events: EventEmitter = new EventEmitter();
  private logger: Logger;
  private redis: Redis;
  private heartbeatInterval: NodeJS.Timeout;
  private messageBuffer: Map<string, WebSocketMessage[]> = new Map();

  constructor(server: Server, logger: Logger, redis: Redis) {
    this.logger = logger;
    this.redis = redis;
    this.wss = new WebSocket.Server({ server });
    this.setupWebSocketServer();
    this.setupHeartbeat();
    this.setupRedisSubscription();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', async (socket: WebSocket, request) => {
      try {
        // Extract user token from request and validate
        const token = this.extractToken(request);
        const userId = await this.validateToken(token);
        
        // Setup client
        const client: ConnectedClient = {
          userId,
          socket,
          lastHeartbeat: Date.now()
        };
        
        this.clients.set(userId, client);
        
        // Handle session joining if URL includes session ID
        const sessionId = this.extractSessionId(request.url);
        if (sessionId) {
          client.sessionId = sessionId;
          await this.handleSessionJoin(userId, sessionId);
        }

        this.setupSocketHandlers(socket, userId);
        
        // Send any buffered messages
        await this.sendBufferedMessages(userId);

      } catch (error) {
        this.logger.error('WebSocket connection error', { error });
        socket.close(1008, 'Authentication failed');
      }
    });
  }

  private setupSocketHandlers(socket: WebSocket, userId: string): void {
    socket.on('message', async (data: WebSocket.Data) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        await this.handleMessage(userId, message);
      } catch (error) {
        this.logger.error('Error handling WebSocket message', { error, userId });
        this.sendError(userId, 'Invalid message format');
      }
    });

    socket.on('close', () => {
      this.handleClientDisconnect(userId);
    });

    socket.on('error', (error) => {
      this.logger.error('WebSocket error', { error, userId });
      this.handleClientDisconnect(userId);
    });
  }

  private async handleMessage(userId: string, message: WebSocketMessage): Promise<void> {
    const client = this.clients.get(userId);
    if (!client) return;

    switch (message.type) {
      case 'heartbeat':
        client.lastHeartbeat = Date.now();
        break;

      case 'session:join':
        await this.handleSessionJoin(userId, message.payload.sessionId);
        break;

      case 'session:leave':
        await this.handleSessionLeave(userId);
        break;

      case 'session:playbackUpdate':
        await this.handlePlaybackUpdate(userId, message.payload);
        break;

      case 'session:vote':
        await this.handleVote(userId, message.payload);
        break;

      default:
        this.events.emit(message.type, { userId, payload: message.payload });
    }
  }

  private async handleSessionJoin(userId: string, sessionId: string): Promise<void> {
    try {
      const client = this.clients.get(userId);
      if (!client) return;

      client.sessionId = sessionId;
      
      // Store session membership in Redis for recovery
      await this.redis.sadd(`session:${sessionId}:members`, userId);
      
      // Notify other session members
      this.broadcastToSession(sessionId, {
        type: 'session:userJoined',
        payload: { userId, sessionId }
      }, [userId]);
      
      // Send current session state to new member
      const sessionState = await this.getSessionState(sessionId);
      this.sendToUser(userId, {
        type: 'session:state',
        payload: sessionState
      });

    } catch (error) {
      this.logger.error('Error handling session join', { error, userId, sessionId });
      this.sendError(userId, 'Failed to join session');
    }
  }

  private async handleSessionLeave(userId: string): Promise<void> {
    const client = this.clients.get(userId);
    if (!client || !client.sessionId) return;

    const sessionId = client.sessionId;
    await this.redis.srem(`session:${sessionId}:members`, userId);
    
    this.broadcastToSession(sessionId, {
      type: 'session:userLeft',
      payload: { userId, sessionId }
    }, [userId]);

    client.sessionId = undefined;
  }

  private async handlePlaybackUpdate(userId: string, payload: any): Promise<void> {
    const client = this.clients.get(userId);
    if (!client?.sessionId) return;

    // Store playback state in Redis
    await this.redis.set(
      `session:${client.sessionId}:playback`,
      JSON.stringify(payload)
    );

    this.broadcastToSession(client.sessionId, {
      type: 'session:playbackUpdate',
      payload
    }, [userId]);
  }

  private async handleVote(userId: string, payload: any): Promise<void> {
    const client = this.clients.get(userId);
    if (!client?.sessionId) return;

    // Store vote in Redis
    await this.redis.sadd(
      `session:${client.sessionId}:votes:${payload.mediaId}`,
      userId
    );

    // Calculate and broadcast new results
    const results = await this.calculateVoteResults(client.sessionId);
    this.broadcastToSession(client.sessionId, {
      type: 'session:voteResults',
      payload: { results }
    });
  }

  private async calculateVoteResults(sessionId: string): Promise<any> {
    const voteKeys = await this.redis.keys(`session:${sessionId}:votes:*`);
    const results = await Promise.all(
      voteKeys.map(async (key) => {
        const mediaId = key.split(':').pop();
        const votes = await this.redis.scard(key);
        return { mediaId, votes };
      })
    );
    return results;
  }

  private setupHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      for (const [userId, client] of this.clients) {
        if (now - client.lastHeartbeat > 60000) { // 60 seconds timeout
          this.logger.warn('Client heartbeat timeout', { userId });
          this.handleClientDisconnect(userId);
          client.socket.close(1001, 'Heartbeat timeout');
        }
      }
    }, 30000); // Check every 30 seconds
  }

  private async setupRedisSubscription(): Promise<void> {
    const sub = this.redis.duplicate();
    await sub.subscribe('websocket:broadcast');
    
    sub.on('message', (channel, message) => {
      try {
        const { sessionId, data, excludeUsers } = JSON.parse(message);
        if (sessionId) {
          this.broadcastToSession(sessionId, data, excludeUsers);
        } else {
          this.broadcastToAll(data, excludeUsers);
        }
      } catch (error) {
        this.logger.error('Redis message handling error', { error });
      }
    });
  }

  private async handleClientDisconnect(userId: string): Promise<void> {
    const client = this.clients.get(userId);
    if (!client) return;

    if (client.sessionId) {
      await this.handleSessionLeave(userId);
    }

    this.clients.delete(userId);
  }

  private async sendBufferedMessages(userId: string): Promise<void> {
    const buffered = this.messageBuffer.get(userId);
    if (buffered) {
      const client = this.clients.get(userId);
      if (client) {
        buffered.forEach(message => {
          client.socket.send(JSON.stringify(message));
        });
      }
      this.messageBuffer.delete(userId);
    }
  }

  public broadcastToSession(
    sessionId: string,
    message: WebSocketMessage,
    excludeUsers: string[] = []
  ): void {
    this.clients.forEach((client, userId) => {
      if (
        client.sessionId === sessionId &&
        !excludeUsers.includes(userId) &&
        client.socket.readyState === WebSocket.OPEN
      ) {
        client.socket.send(JSON.stringify(message));
      }
    });
  }

  public broadcastToUsers(
    userIds: string[],
    message: WebSocketMessage
  ): void {
    userIds.forEach(userId => {
      const client = this.clients.get(userId);
      if (client?.socket.readyState === WebSocket.OPEN) {
        client.socket.send(JSON.stringify(message));
      } else {
        // Buffer message for disconnected users
        let buffered = this.messageBuffer.get(userId) || [];
        buffered.push(message);
        this.messageBuffer.set(userId, buffered);
      }
    });
  }

  public sendToUser(userId: string, message: WebSocketMessage): void {
    const client = this.clients.get(userId);
    if (client?.socket.readyState === WebSocket.OPEN) {
      client.socket.send(JSON.stringify(message));
    } else {
      let buffered = this.messageBuffer.get(userId) || [];
      buffered.push(message);
      this.messageBuffer.set(userId, buffered);
    }
  }

  private sendError(userId: string, message: string): void {
    this.sendToUser(userId, {
      type: 'error',
      payload: { message }
    });
  }

  private extractToken(request: any): string {
    const header = request.headers['authorization'];
    if (!header) throw new CustomError('AuthError', 'No authorization header');
    return header.replace('Bearer ', '');
  }

  private async validateToken(token: string): Promise<string> {
    // Implementation would depend on your auth system
    // This is a placeholder that should be replaced with actual token validation
    try {
      // Verify token and extract user ID
      const userId = 'user-id'; // Replace with actual validation
      return userId;
    } catch (error) {
      throw new CustomError('AuthError', 'Invalid token');
    }
  }

  private extractSessionId(url: string | undefined): string | undefined {
    if (!url) return undefined;
    const match = url.match(/\/session\/([^\/]+)/);
    return match ? match[1] : undefined;
  }

  private async getSessionState(sessionId: string): Promise<any> {
    try {
      const [playback, voteResults] = await Promise.all([
        this.redis.get(`session:${sessionId}:playback`),
        this.calculateVoteResults(sessionId)
      ]);

      return {
        playback: playback ? JSON.parse(playback) : null,
        voteResults
      };
    } catch (error) {
      this.logger.error('Error getting session state', { error, sessionId });
      throw new CustomError('StateError', 'Failed to get session state');
    }
  }

  public shutdown(): void {
    clearInterval(this.heartbeatInterval);
    this.wss.close();
    this.redis.disconnect();
  }
}
