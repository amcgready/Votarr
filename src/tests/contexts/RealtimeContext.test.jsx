// src/tests/contexts/RealtimeContext.test.jsx

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, waitFor, screen, fireEvent } from '@testing-library/react';
import { RealtimeProvider, useRealtime } from '../../contexts/RealtimeContext';
import { usePlex } from '../../contexts/PlexContext';
import { sessionService } from '../../services/sessionService';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import React, { useEffect } from 'react';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn()
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: vi.fn()
}));

vi.mock('../../contexts/PlexContext', () => ({
  usePlex: vi.fn()
}));

vi.mock('../../services/sessionService', () => ({
  sessionService: {
    createSession: vi.fn(),
    joinSession: vi.fn(),
    leaveSession: vi.fn(),
    getStoredSession: vi.fn(),
    clearStoredSession: vi.fn(),
    generateInviteLink: vi.fn()
  }
}));

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    this.CONNECTING = WebSocket.CONNECTING;
    this.OPEN = WebSocket.OPEN;
    this.CLOSED = WebSocket.CLOSED;
    this.addEventListener = vi.fn((event, callback) => {
      this[`on${event}`] = callback;
    });
    this.removeEventListener = vi.fn();
    this.send = vi.fn();
    this.close = vi.fn();
    
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.onopen && this.onopen();
    }, 50);
  }
}

// Test component
const TestComponent = ({ onStateChange, onAction }) => {
  const realtime = useRealtime();
  
  useEffect(() => {
    onStateChange && onStateChange(realtime);
  }, [realtime, onStateChange]);

  return (
    <div>
      <div data-testid="connection-status">
        {realtime.connectionState.status}
      </div>
      <button
        data-testid="create-session"
        onClick={() => realtime.createSession({ maxUsers: 4 })}
      >
        Create Session
      </button>
      <button
        data-testid="join-session"
        onClick={() => realtime.joinSession('test-session')}
      >
        Join Session
      </button>
      <button
        data-testid="leave-session"
        onClick={() => realtime.leaveSession()}
      >
        Leave Session
      </button>
      <button
        data-testid="start-voting"
        onClick={() => realtime.startVoting([])}
      >
        Start Voting
      </button>
    </div>
  );
};

describe('RealtimeContext', () => {
  let mockWs;
  let mockNavigate;
  let mockToast;
  let mockUser;
  
  beforeEach(() => {
    // Setup mocks
    mockNavigate = vi.fn();
    useNavigate.mockReturnValue(mockNavigate);
    
    mockToast = { toast: vi.fn() };
    useToast.mockReturnValue(mockToast);
    
    mockUser = { id: 'test-user', username: 'Test User' };
    usePlex.mockReturnValue({ user: mockUser });
    
    // Setup WebSocket mock
    vi.spyOn(global, 'WebSocket').mockImplementation((url) => {
      mockWs = new MockWebSocket(url);
      return mockWs;
    });
    
    // Reset session service mocks
    sessionService.createSession.mockReset();
    sessionService.joinSession.mockReset();
    sessionService.leaveSession.mockReset();
    sessionService.getStoredSession.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should establish connection and join session', async () => {
    const onStateChange = vi.fn();
    sessionService.getStoredSession.mockReturnValue(null);

    render(
      <RealtimeProvider>
        <TestComponent onStateChange={onStateChange} />
      </RealtimeProvider>
    );

    await waitFor(() => {
      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionState: expect.objectContaining({
            status: 'connected'
          })
        })
      );
    });
  });

  it('should handle session creation', async () => {
    const sessionConfig = { maxUsers: 4 };
    const sessionResponse = { id: 'test-session', isHost: true };
    sessionService.createSession.mockResolvedValue(sessionResponse);

    const { getByTestId } = render(
      <RealtimeProvider>
        <TestComponent />
      </RealtimeProvider>
    );

    await act(async () => {
      fireEvent.click(getByTestId('create-session'));
    });

    expect(sessionService.createSession).toHaveBeenCalledWith({
      userId: mockUser.id,
      username: mockUser.username,
      ...sessionConfig
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/invite');
    });
  });

  it('should handle session joining', async () => {
    const sessionResponse = { id: 'test-session', isHost: false };
    sessionService.joinSession.mockResolvedValue(sessionResponse);

    const { getByTestId } = render(
      <RealtimeProvider>
        <TestComponent />
      </RealtimeProvider>
    );

    await act(async () => {
      fireEvent.click(getByTestId('join-session'));
    });

    expect(sessionService.joinSession).toHaveBeenCalledWith(
      'test-session',
      {
        userId: mockUser.id,
        username: mockUser.username
      }
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/genre');
    });
  });

  it('should handle message queue and processing', async () => {
    const onStateChange = vi.fn();

    render(
      <RealtimeProvider>
        <TestComponent onStateChange={onStateChange} />
      </RealtimeProvider>
    );

    await waitFor(() => {
      expect(mockWs.readyState).toBe(WebSocket.OPEN);
    });

    // Simulate receiving multiple messages
    act(() => {
      mockWs.onmessage({
        data: JSON.stringify({
          type: 'USER_JOINED',
          data: { user: { id: 'user1', username: 'User 1' } }
        })
      });

      mockWs.onmessage({
        data: JSON.stringify({
          type: 'USER_JOINED',
          data: { user: { id: 'user2', username: 'User 2' } }
        })
      });
    });

    await waitFor(() => {
      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          connectedUsers: expect.arrayContaining([
            expect.objectContaining({ id: 'user1' }),
            expect.objectContaining({ id: 'user2' })
          ])
        })
      );
    });
  });

  it('should handle voting rounds', async () => {
    const onStateChange = vi.fn();

    render(
      <RealtimeProvider>
        <TestComponent onStateChange={onStateChange} />
      </RealtimeProvider>
    );

    await waitFor(() => {
      expect(mockWs.readyState).toBe(WebSocket.OPEN);
    });

    // Simulate start voting message
    act(() => {
      mockWs.onmessage({
        data: JSON.stringify({
          type: 'START_VOTING',
          data: {
            round: 1,
            media: [],
            timeout: 45000,
            startTime: Date.now()
          }
        })
      });
    });

    await waitFor(() => {
      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionState: expect.objectContaining({
            status: 'voting',
            round: 1
          })
        })
      );
    });
  });

  it('should handle connection errors and reconnection', async () => {
    const onStateChange = vi.fn();

    render(
      <RealtimeProvider>
        <TestComponent onStateChange={onStateChange} />
      </RealtimeProvider>
    );

    await waitFor(() => {
      expect(mockWs.readyState).toBe(WebSocket.OPEN);
    });

    // Simulate connection error
    act(() => {
      mockWs.onclose({ wasClean: false });
    });

    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Connection lost',
          description: expect.stringContaining('Attempting to reconnect')
        })
      );
    });

    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionState: expect.objectContaining({
          status: 'reconnecting'
        })
      })
    );
  });

  it('should clean up resources on unmount', async () => {
    const { unmount } = render(
      <RealtimeProvider>
        <TestComponent />
      </RealtimeProvider>
    );

    await waitFor(() => {
      expect(mockWs.readyState).toBe(WebSocket.OPEN);
    });

    unmount();

    expect(mockWs.close).toHaveBeenCalled();
  });
});
