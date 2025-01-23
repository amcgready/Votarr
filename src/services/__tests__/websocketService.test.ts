// src/services/__tests__/websocketService.test.ts
import { WebSocketService } from '../websocketService';
import { mockSession, mockUser } from '../../utils/testHelpers';
import { WebSocket as MockWebSocket } from 'mock-socket';
import { WebSocketMessage, WebSocketMessageType } from '../../types/websocket';

jest.mock('ws');

describe('WebSocketService', () => {
  let wsService: WebSocketService;
  let mockWs: jest.Mocked<WebSocket>;
  const mockUrl = 'ws://localhost:3000';

  beforeEach(() => {
    mockWs = {
      send: jest.fn(),
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      readyState: WebSocket.OPEN,
    } as unknown as jest.Mocked<WebSocket>;

    (global as any).WebSocket = jest.fn(() => mockWs);
    wsService = new WebSocketService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connection management', () => {
    it('establishes connection successfully', async () => {
      const connectPromise = wsService.connect(mockUrl);
      
      // Simulate successful connection
      const openCallback = mockWs.addEventListener.mock.calls.find(
        call => call[0] === 'open'
      )?.[1];
      openCallback?.({} as Event);

      await expect(connectPromise).resolves.toBeUndefined();
      expect(mockWs.addEventListener).toHaveBeenCalledWith('open', expect.any(Function));
      expect(mockWs.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockWs.addEventListener).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockWs.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('handles connection failures', async () => {
      const connectPromise = wsService.connect(mockUrl);
      
      // Simulate connection error
      const errorCallback = mockWs.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];
      errorCallback?.(new Event('error'));

      await expect(connectPromise).rejects.toThrow('WebSocket connection failed');
    });

    it('implements reconnection strategy', async () => {
      await wsService.connect(mockUrl);
      
      // Simulate disconnection
      const closeCallback = mockWs.addEventListener.mock.calls.find(
        call => call[0] === 'close'
      )?.[1];
      closeCallback?.(new CloseEvent('close'));

      // Should attempt to reconnect
      expect(global.WebSocket).toHaveBeenCalledTimes(2);
    });
  });

  describe('message handling', () => {
    beforeEach(async () => {
      await wsService.connect(mockUrl);
    });

    it('sends messages correctly', () => {
      const message: WebSocketMessage = {
        type: WebSocketMessageType.JOIN_SESSION,
        sessionId: 'test-session'
      };

      wsService.send(message);

      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('handles incoming messages', () => {
      const mockHandler = jest.fn();
      wsService.onMessage(mockHandler);

      // Simulate incoming message
      const messageCallback = mockWs.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];
      const mockMessage = {
        data: JSON.stringify({
          type: WebSocketMessageType.SESSION_UPDATE,
          data: mockSession
        })
      };
      messageCallback?.(mockMessage as MessageEvent);

      expect(mockHandler).toHaveBeenCalledWith(expect.any(Object));
    });

    it('handles malformed messages gracefully', () => {
      const mockHandler = jest.fn();
      wsService.onMessage(mockHandler);

      // Simulate malformed message
      const messageCallback = mockWs.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];
      messageCallback?.({ data: 'invalid json' } as MessageEvent);

      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('session management', () => {
    beforeEach(async () => {
      await wsService.connect(mockUrl);
    });

    it('joins session successfully', () => {
      wsService.joinSession('test-session', mockUser.id);

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining(WebSocketMessageType.JOIN_SESSION)
      );
    });

    it('leaves session successfully', () => {
      wsService.leaveSession('test-session', mockUser.id);

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining(WebSocketMessageType.LEAVE_SESSION)
      );
    });

    it('manages session subscriptions', () => {
      const mockHandler = jest.fn();
      
      // Subscribe to session updates
      const unsubscribe = wsService.subscribeToSession('test-session', mockHandler);

      // Simulate session update
      const messageCallback = mockWs.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];
      messageCallback?.({
        data: JSON.stringify({
          type: WebSocketMessageType.SESSION_UPDATE,
          sessionId: 'test-session',
          data: mockSession
        })
      } as MessageEvent);

      expect(mockHandler).toHaveBeenCalledWith(expect.any(Object));

      // Unsubscribe and verify no more updates
      unsubscribe();
      mockHandler.mockClear();
      messageCallback?.({
        data: JSON.stringify({
          type: WebSocketMessageType.SESSION_UPDATE,
          sessionId: 'test-session',
          data: mockSession
        })
      } as MessageEvent);

      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('handles send errors gracefully', () => {
      mockWs.readyState = WebSocket.CLOSED;
      const message: WebSocketMessage = {
        type: WebSocketMessageType.JOIN_SESSION,
        sessionId: 'test-session'
      };

      expect(() => wsService.send(message)).not.toThrow();
    });

    it('notifies error subscribers', () => {
      const mockErrorHandler = jest.fn();
      wsService.onError(mockErrorHandler);

      // Simulate WebSocket error
      const errorCallback = mockWs.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];
      const mockError = new Error('Test error');
      errorCallback?.(new ErrorEvent('error', { error: mockError }));

      expect(mockErrorHandler).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
