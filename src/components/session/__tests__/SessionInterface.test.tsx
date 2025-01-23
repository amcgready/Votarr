// src/components/session/__tests__/SessionInterface.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionInterface } from '../SessionInterface';
import { SessionService } from '../../../services/sessionService';
import { WebSocketService } from '../../../services/websocketService';
import { AuthContext } from '../../auth/AuthContext';
import { mockSession, mockUser } from '../../../utils/testHelpers';

jest.mock('../../../services/sessionService');
jest.mock('../../../services/websocketService');

describe('SessionInterface Component', () => {
  const mockSessionService = SessionService as jest.Mocked<typeof SessionService>;
  const mockWebSocketService = WebSocketService as jest.Mocked<typeof WebSocketService>;

  const mockAuthContext = {
    user: mockUser,
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders session interface with initial state', async () => {
    mockSessionService.prototype.getSession.mockResolvedValue(mockSession);
    mockWebSocketService.prototype.connect.mockResolvedValue(undefined);

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <SessionInterface sessionId={mockSession.id} />
      </AuthContext.Provider>
    );

    // Verify initial loading state
    expect(screen.getByText(/loading session/i)).toBeInTheDocument();

    // Verify session content after loading
    await waitFor(() => {
      expect(screen.getByText(mockSession.name)).toBeInTheDocument();
      expect(screen.getByText(`Host: ${mockSession.hostName}`)).toBeInTheDocument();
    });
  });

  it('handles session updates via WebSocket', async () => {
    mockSessionService.prototype.getSession.mockResolvedValue(mockSession);
    
    const updatedSession = {
      ...mockSession,
      name: 'Updated Session Name',
    };

    let wsCallback: (data: any) => void;
    mockWebSocketService.prototype.subscribe.mockImplementation((callback) => {
      wsCallback = callback;
      return () => {};
    });

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <SessionInterface sessionId={mockSession.id} />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(mockSession.name)).toBeInTheDocument();
    });

    // Simulate WebSocket update
    wsCallback({ type: 'SESSION_UPDATE', data: updatedSession });

    await waitFor(() => {
      expect(screen.getByText(updatedSession.name)).toBeInTheDocument();
    });
  });

  it('allows host to update session settings', async () => {
    const hostSession = { ...mockSession, hostId: mockUser.id };
    mockSessionService.prototype.getSession.mockResolvedValue(hostSession);
    mockSessionService.prototype.updateSessionSettings.mockResolvedValue(hostSession);

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <SessionInterface sessionId={hostSession.id} />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/settings/i)).toBeInTheDocument();
    });

    // Open settings modal
    fireEvent.click(screen.getByText(/settings/i));

    // Update session name
    const nameInput = screen.getByLabelText(/session name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'New Session Name');

    // Save settings
    fireEvent.click(screen.getByText(/save/i));

    await waitFor(() => {
      expect(mockSessionService.prototype.updateSessionSettings).toHaveBeenCalledWith(
        hostSession.id,
        expect.objectContaining({ name: 'New Session Name' })
      );
    });
  });

  it('handles errors gracefully', async () => {
    mockSessionService.prototype.getSession.mockRejectedValue(
      new Error('Failed to load session')
    );

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <SessionInterface sessionId={mockSession.id} />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error loading session/i)).toBeInTheDocument();
    });
  });

  it('manages WebSocket reconnection attempts', async () => {
    mockSessionService.prototype.getSession.mockResolvedValue(mockSession);
    
    let wsErrorCallback: (error: Error) => void;
    mockWebSocketService.prototype.onError.mockImplementation((callback) => {
      wsErrorCallback = callback;
      return () => {};
    });

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <SessionInterface sessionId={mockSession.id} />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(mockSession.name)).toBeInTheDocument();
    });

    // Simulate WebSocket error
    wsErrorCallback(new Error('Connection lost'));

    await waitFor(() => {
      expect(screen.getByText(/reconnecting/i)).toBeInTheDocument();
    });
  });

  it('cleans up WebSocket connection on unmount', async () => {
    const mockDisconnect = jest.fn();
    mockWebSocketService.prototype.disconnect = mockDisconnect;
    mockSessionService.prototype.getSession.mockResolvedValue(mockSession);

    const { unmount } = render(
      <AuthContext.Provider value={mockAuthContext}>
        <SessionInterface sessionId={mockSession.id} />
      </AuthContext.Provider>
    );

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });
});
