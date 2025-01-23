// src/__tests__/components/SessionInterface.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionInterface } from '../../components/SessionInterface';
import { SessionContext } from '../../contexts/SessionContext';
import { WebSocketContext } from '../../contexts/WebSocketContext';
import { Session, User } from '../../types';
import '@testing-library/jest-dom';

// Mock the required contexts and hooks
jest.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    sendMessage: jest.fn(),
    lastMessage: null,
  }),
}));

describe('SessionInterface', () => {
  const mockSession: Session = {
    id: '123',
    name: 'Test Session',
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'active',
    ownerId: 'user123',
    currentRound: 1,
    maxRounds: 5
  };

  const mockUser: User = {
    id: 'user123',
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockWebSocket = {
    connected: true,
    connect: jest.fn(),
    disconnect: jest.fn(),
    sendMessage: jest.fn(),
  };

  const mockSessionContext = {
    session: mockSession,
    updateSession: jest.fn(),
    leaveSession: jest.fn(),
    isOwner: true,
  };

  const renderComponent = () => {
    return render(
      <WebSocketContext.Provider value={mockWebSocket}>
        <SessionContext.Provider value={mockSessionContext}>
          <SessionInterface user={mockUser} />
        </SessionContext.Provider>
      </WebSocketContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders session information correctly', () => {
    renderComponent();
    
    expect(screen.getByText(mockSession.name)).toBeInTheDocument();
    expect(screen.getByText(`Round ${mockSession.currentRound}/${mockSession.maxRounds}`)).toBeInTheDocument();
  });

  it('shows owner controls when user is session owner', () => {
    renderComponent();
    
    expect(screen.getByText('Start Round')).toBeInTheDocument();
    expect(screen.getByText('End Session')).toBeInTheDocument();
  });

  it('handles starting a new round', async () => {
    renderComponent();
    
    const startButton = screen.getByText('Start Round');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockWebSocket.sendMessage).toHaveBeenCalledWith({
        type: 'START_ROUND',
        sessionId: mockSession.id,
      });
    });
  });

  it('handles ending the session', async () => {
    renderComponent();
    
    const endButton = screen.getByText('End Session');
    fireEvent.click(endButton);

    await waitFor(() => {
      expect(mockSessionContext.leaveSession).toHaveBeenCalled();
    });
  });

  it('shows loading state while processing actions', async () => {
    renderComponent();
    
    const startButton = screen.getByText('Start Round');
    fireEvent.click(startButton);

    expect(screen.getByText('Processing...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
    });
  });

  it('displays error message when websocket is disconnected', () => {
    const disconnectedWebSocket = { ...mockWebSocket, connected: false };
    
    render(
      <WebSocketContext.Provider value={disconnectedWebSocket}>
        <SessionContext.Provider value={mockSessionContext}>
          <SessionInterface user={mockUser} />
        </SessionContext.Provider>
      </WebSocketContext.Provider>
    );

    expect(screen.getByText('Connection lost. Reconnecting...')).toBeInTheDocument();
  });

  it('updates UI when receiving websocket messages', async () => {
    const { rerender } = renderComponent();

    // Simulate receiving a websocket message
    const updatedSession = { ...mockSession, currentRound: 2 };
    const newMockSessionContext = { ...mockSessionContext, session: updatedSession };

    rerender(
      <WebSocketContext.Provider value={mockWebSocket}>
        <SessionContext.Provider value={newMockSessionContext}>
          <SessionInterface user={mockUser} />
        </SessionContext.Provider>
      </WebSocketContext.Provider>
    );

    expect(screen.getByText(`Round ${updatedSession.currentRound}/${updatedSession.maxRounds}`)).toBeInTheDocument();
  });

  it('handles session state transitions correctly', async () => {
    renderComponent();
    
    // Simulate session ending
    const updatedSession = { ...mockSession, status: 'completed' };
    const newMockSessionContext = { ...mockSessionContext, session: updatedSession };

    render(
      <WebSocketContext.Provider value={mockWebSocket}>
        <SessionContext.Provider value={newMockSessionContext}>
          <SessionInterface user={mockUser} />
        </SessionContext.Provider>
      </WebSocketContext.Provider>
    );

    expect(screen.getByText('Session Completed')).toBeInTheDocument();
  });
});
