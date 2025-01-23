// src/__tests__/services/WebSocketService.test.ts
import { WebSocketService } from '../../services/WebSocketService';
import { WebSocket, Server as WebSocketServer } from 'ws';
import { Server } from 'http';
import { EventEmitter } from 'events';
import { SessionService } from '../../services/SessionService';
import { AuthService } from '../../services/AuthService';
import { WebSocketMessage, WebSocketMessageType, Session, User } from '../../types';
import { WebSocketError } from '../../errors';

// Mock dependencies
jest.mock('ws');
jest.mock('http');
jest.mock('../../services/SessionService');
jest.mock('../../services/AuthService');

describe('WebSocketService', () => {
  let webSocketService: WebSocketService;
  let mockWss: jest.Mocked<WebSocketServer>;
  let mockServer: jest.Mocked<Server>;
  let mockSessionService: jest.Mocked<SessionService>;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockWebSocket: jest.Mocked<WebSocket & EventEmitter>;

  const mockUser: User = {
    id: 'user123',
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockSession: Session = {
    id: 'session123',
    name: 'Test Session',
    ownerId: 'user123',
    status: 'active',
    currentRound: 1,
    maxRounds: 5,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    // Create mock WebSocket instance
    mockWebSocket = new EventEmitter() as jest.Mocked<WebSocket & EventEmitter>;
    mockWebSocket.send = jest.fn();
    mockWebSocket.close = jest.fn();
    mockWebSocket.readyState = WebSocket.OPEN;

    // Create mock WebSocket server
    mockWss = {
      clients: new Set([mockWebSocket]),
      on: jest.fn(),
      handleUpgrade: jest.fn(),
      emit: jest.fn(),
      broadcast: jest.fn(),
    } as unknown as jest.Mocked<WebSocketServer>;

    mockServer = {
      on: jest.fn(),
    } as unknown as jest.Mocked<Server>;

    mockSessionService = {
      getSession: jest.fn(),
      startSession: jest.fn(),
      endSession: jest.fn(),
      advanceRound: jest.fn(),
    } as unknown as jest.Mocked<SessionService>;

    mockAuthService = {
      validateToken: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    webSocketService = new WebSocketService(
      mockServer,
      mockSessionService,
      mockAuthService
    );
    (webSocketService as any).wss = mockWss;
  });

  describe('initialize', () => {
    it('should set up WebSocket server correctly', () => {
      webSocketService.initialize();

      expect(mockWss.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    it('should handle upgrades correctly', () => {
      webSocketService.initialize();

      expect(mockServer.on).toHaveBeenCalledWith('upgrade', expect.any(Function));
    });
  });

  describe('handleConnection', () => {
    it('should authenticate and setup client successfully', async () => {
      const token = 'valid-token';
      mockAuthService.validateToken.mockResolvedValue(mockUser);

      await webSocketService.handleConnection(mockWebSocket, token);

      expect(mockAuthService.validateToken).toHaveBeenCalledWith(token);
      expect(mockWebSocket.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockWebSocket.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('should close connection for invalid token', async () => {
      const token = 'invalid-token';
      mockAuthService.validateToken.mockRejectedValue(new Error('Invalid token'));

      await webSocketService.handleConnection(mockWebSocket, token);

      expect(mockWebSocket.close).toHaveBeenCalled();
    });
  });

  describe('handleMessage', () => {
    beforeEach(() => {
      (webSocketService as any).clients = new Map([
        [mockWebSocket, { user: mockUser, sessions: new Set(['session123']) }]
      ]);
    });

    it('should handle JOIN_SESSION message', async () => {
      const message: WebSocketMessage = {
        type: WebSocketMessageType.JOIN_SESSION,
        sessionId: 'session123'
      };

      mockSessionService.getSession.mockResolvedValue(mockSession);

      await webSocketService.handleMessage(mockWebSocket, JSON.stringify(message));

      expect(mockSessionService.getSession).toHaveBeenCalledWith('session123');
      expect((webSocketService as any).clients.get(mockWebSocket).sessions.has('session123')).toBe(true);
    });

    it('should handle LEAVE_SESSION message', async () => {
      const message: WebSocketMessage = {
        type: WebSocketMessageType.LEAVE_SESSION,
        sessionId: 'session123'
      };

      await webSocketService.handleMessage(mockWebSocket, JSON.stringify(message));

      expect((webSocketService as any).clients.get(mockWebSocket).sessions.has('session123')).toBe(false);
    });

    it('should handle START_ROUND message', async () => {
      const message: WebSocketMessage = {
        type: WebSocketMessageType.START_ROUND,
        sessionId: 'session123'
      };

      mockSessionService.getSession.mockResolvedValue(mockSession);
      mockSessionService.advanceRound.mockResolvedValue(mockSession);

      await webSocketService.handleMessage(mockWebSocket, JSON.stringify(message));

      expect(mockSessionService.advanceRound).toHaveBeenCalledWith('session123', mockUser.id);
    });

    it('should handle END_SESSION message', async () => {
      const message: WebSocketMessage = {
        type: WebSocketMessageType.END_SESSION,
        sessionId: 'session123'
      };

      mockSessionService.getSession.mockResolvedValue(mockSession);
      mockSessionService.endSession.mockResolvedValue(mockSession);

      await webSocketService.handleMessage(mockWebSocket, JSON.stringify(message));

      expect(mockSessionService.endSession).toHaveBeenCalledWith('session123', mockUser.id);
    });

    it('should handle invalid message format', async () => {
      const invalidMessage = 'invalid-json';

      await webSocketService.handleMessage(mockWebSocket, invalidMessage);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('Invalid message format')
      );
    });

    it('should handle unknown message type', async () => {
      const message = {
        type: 'UNKNOWN_TYPE',
        sessionId: 'session123'
      };

      await webSocketService.handleMessage(mockWebSocket, JSON.stringify(message));

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('Unknown message type')
      );
    });
  });

  describe('broadcastToSession', () => {
    beforeEach(() => {
      const mockClient1 = new EventEmitter() as WebSocket & EventEmitter;
      mockClient1.send = jest.fn();
      mockClient1.readyState = WebSocket.OPEN;

      const mockClient2 = new EventEmitter() as WebSocket & EventEmitter;
      mockClient2.send = jest.fn();
      mockClient2.readyState = WebSocket.OPEN;

      (webSocketService as any).clients = new Map([
        [mockClient1, { user: mockUser, sessions: new Set(['session123']) }],
        [mockClient2, { user: mockUser, sessions: new Set(['session456']) }]
      ]);
    });

    it('should broadcast message to all clients in session', () => {
      const message = {
        type: WebSocketMessageType.SESSION_UPDATE,
        sessionId: 'session123',
        data: mockSession
      };

      webSocketService.broadcastToSession('session123', message);

      let broadcastCount = 0;
      (webSocketService as any).clients.forEach((clientData: any, client: WebSocket) => {
        if (clientData.sessions.has('session123')) {
          expect(client.send).toHaveBeenCalledWith(JSON.stringify(message));
          broadcastCount++;
        }
      });

      expect(broadcastCount).toBe(1);
    });

    it('should not send to clients not in session', () => {
      const message = {
        type: WebSocketMessageType.SESSION_UPDATE,
        sessionId: 'session789',
        data: mockSession
      };

      webSocketService.broadcastToSession('session789', message);

      (webSocketService as any).clients.forEach((_, client: WebSocket) => {
        expect(client.send).not.toHaveBeenCalled();
      });
    });
  });

  describe('notifySessionUpdate', () => {
    it('should broadcast session update to all clients in session', async () => {
      const mockUpdatedSession = { ...mockSession, currentRound: 2 };
      mockSessionService.getSession.mockResolvedValue(mockUpdatedSession);

      await webSocketService.notifySessionUpdate('session123');

      expect(mockSessionService.getSession).toHaveBeenCalledWith('session123');
      // Verify broadcast was called with correct message
      const expectedMessage = {
        type: WebSocketMessageType.SESSION_UPDATE,
        sessionId: 'session123',
        data: mockUpdatedSession
      };
      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(expectedMessage));
    });
  });

  describe('handleClose', () => {
    it('should clean up client resources on connection close', () => {
      (webSocketService as any).clients.set(mockWebSocket, {
        user: mockUser,
        sessions: new Set(['session123'])
      });

      webSocketService.handleClose(mockWebSocket);

      expect((webSocketService as any).clients.has(mockWebSocket)).toBe(false);
    });
  });

  describe('cleanupClosedConnections', () => {
    it('should remove closed connections from clients map', () => {
      const closedSocket = {
        ...mockWebSocket,
        readyState: WebSocket.CLOSED
      };

      (webSocketService as any).clients.set(closedSocket, {
        user: mockUser,
        sessions: new Set(['session123'])
      });

      webSocketService.cleanupClosedConnections();

      expect((webSocketService as any).clients.has(closedSocket)).toBe(false);
    });

    it('should keep open connections in clients map', () => {
      const openSocket = {
        ...mockWebSocket,
        readyState: WebSocket.OPEN
      };

      (webSocketService as any).clients.set(openSocket, {
        user: mockUser,
        sessions: new Set(['session123'])
      });

      webSocketService.cleanupClosedConnections();

      expect((webSocketService as any).clients.has(openSocket)).toBe(true);
    });
  });
});
