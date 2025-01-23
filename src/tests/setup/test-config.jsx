// src/tests/setup/test-config.jsx
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { PlexProvider } from '@/contexts/PlexContext';
import { RealtimeProvider } from '@/contexts/RealtimeContext';
import { VotingProvider } from '@/contexts/VotingContext';
import { render } from '@testing-library/react';

// Default context states
const defaultContextState = {
  realtime: {
    connected: true,
    sessionId: 'test-session',
    userId: 'test-user',
    isHost: true,
    users: [],
    currentRound: 0,
    error: null,
  },
  plex: {
    authenticated: true,
    servers: [],
    selectedServer: null,
    loading: false,
    error: null,
    user: {
      id: 'test-user-id',
      username: 'test-user',
      thumb: 'test-thumb',
      email: 'test@example.com',
    },
  },
  voting: {
    votes: {},
    results: [],
    round: 1,
    complete: false,
  },
};

// Test wrapper component that includes all necessary providers
export function TestWrapper({ children, initialState = {} }) {
  const mergedState = {
    ...defaultContextState,
    ...initialState,
  };

  return (
    <MemoryRouter>
      <PlexProvider initialState={mergedState.plex}>
        <RealtimeProvider initialState={mergedState.realtime}>
          <VotingProvider initialState={mergedState.voting}>
            {children}
          </VotingProvider>
        </RealtimeProvider>
      </PlexProvider>
    </MemoryRouter>
  );
}

// Custom render method that includes the test wrapper
export function renderWithProviders(ui, { initialState = {}, ...options } = {}) {
  return render(ui, {
    wrapper: (props) => <TestWrapper {...props} initialState={initialState} />,
    ...options,
  });
}

// Mock session service
export const mockSessionService = {
  createSession: vi.fn(),
  joinSession: vi.fn(),
  leaveSession: vi.fn(),
  getStoredSession: vi.fn(),
  clearStoredSession: vi.fn(),
  generateInviteLink: vi.fn(),
};

// Mock user data
export const mockUser = {
  id: 'test-user-id',
  username: 'test-user',
  thumb: 'test-thumb',
  email: 'test@example.com',
};

// Mock server data
export const mockServer = {
  name: 'Test Server',
  clientIdentifier: 'test-server-id',
  connections: [{ uri: 'http://test-server' }],
};

// Default test data
export const defaultTestData = {
  sessionId: 'test-session',
  userId: mockUser.id,
  username: mockUser.username,
  isHost: true,
};

// Helper function to create a message object
export function createMessage(type, payload) {
  return {
    id: `test-${Date.now()}`,
    type,
    data: {
      ...payload,
      timestamp: Date.now()
    }
  };
}

// Export WebSocket ready states for testing
export const WS_READY_STATES = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};
