// src/tests/utils/test-utils.jsx

import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RealtimeProvider } from '@/contexts/RealtimeContext';
import { PlexProvider } from '@/contexts/PlexContext';
import { VotingProvider } from '@/contexts/VotingContext';
import { vi } from 'vitest';

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

// Mock window.location
delete window.location;
window.location = new URL('http://localhost:3000');

// Mock WebSocket class
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    
    // Set default handlers
    this.onopen = null;
    this.onclose = null;
    this.onmessage = null;
    this.onerror = null;
    
    // Mock methods
    this.send = vi.fn();
    this.close = vi.fn();
    
    // Auto-connect after a tick
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.onopen?.();
    }, 0);
  }

  // Helper method to simulate receiving a message
  mockReceiveMessage(data) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  // Helper method to simulate disconnection
  mockDisconnect() {
    this.readyState = WebSocket.CLOSED;
    this.onclose?.();
  }

  // Helper method to simulate error
  mockError(error) {
    this.onerror?.({ error });
  }
}

// Default mock functions that can be overridden in tests
const defaultMocks = {
  onSwipe: vi.fn(),
  onQueuesFull: vi.fn(),
  onVote: vi.fn(),
  onSessionCreate: vi.fn(),
  onServerSelect: vi.fn(),
};

// Helper to merge provided mocks with defaults
const getMocks = (customMocks = {}) => ({
  ...defaultMocks,
  ...customMocks,
});

// Create initial contexts state
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

// Message helper functions
const createMessage = (type, payload) => ({
  id: `test-${Date.now()}`,
  type,
  data: {
    ...payload,
    timestamp: Date.now()
  }
});

// WebSocket ready states
const WS_READY_STATES = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};

// Custom render function that wraps components with necessary providers
function renderWithProviders(
  ui,
  {
    route = '/',
    mocks = {},
    contextState = {},
    mockWebSocket = true,
    ...renderOptions
  } = {}
) {
  // Merge provided state with defaults
  const mergedContextState = {
    ...defaultContextState,
    ...contextState,
  };

  // Merge provided mocks with defaults
  const mergedMocks = getMocks(mocks);

  // Set up window location for route
  window.history.pushState({}, 'Test page', route);

  // Mock WebSocket if needed
  if (mockWebSocket) {
    global.WebSocket = MockWebSocket;
  }

  function Providers({ children }) {
    return (
      <BrowserRouter>
        <PlexProvider initialState={mergedContextState.plex}>
          <RealtimeProvider initialState={mergedContextState.realtime}>
            <VotingProvider initialState={mergedContextState.voting}>
              {children}
            </VotingProvider>
          </RealtimeProvider>
        </PlexProvider>
      </BrowserRouter>
    );
  }

  return {
    ...render(ui, { wrapper: Providers, ...renderOptions }),
    mocks: mergedMocks,
    mockWebSocket: MockWebSocket,
    WS_READY_STATES,
    createMessage,
  };
}

// Helper function to simulate swipe gestures
const simulateSwipe = async (element, direction, distance = 200) => {
  const movements = {
    right: { x: distance, y: 0 },
    left: { x: -distance, y: 0 },
    up: { x: 0, y: -distance },
    down: { x: 0, y: distance },
  };

  const move = movements[direction];

  // Start touch
  const touchStart = new Touch({
    identifier: Date.now(),
    target: element,
    clientX: 0,
    clientY: 0,
  });

  const touchStartEvent = new TouchEvent('touchstart', {
    touches: [touchStart],
    bubbles: true,
  });

  // Move touch
  const touchMove = new Touch({
    identifier: touchStart.identifier,
    target: element,
    clientX: move.x,
    clientY: move.y,
  });

  const touchMoveEvent = new TouchEvent('touchmove', {
    touches: [touchMove],
    bubbles: true,
  });

  // End touch
  const touchEndEvent = new TouchEvent('touchend', {
    touches: [],
    bubbles: true,
  });

  // Fire events
  element.dispatchEvent(touchStartEvent);
  element.dispatchEvent(touchMoveEvent);
  element.dispatchEvent(touchEndEvent);
};

// Mock implementations for services
const mockServices = {
  plexService: {
    authenticate: vi.fn(),
    getServers: vi.fn(),
    getLibraries: vi.fn(),
    searchMedia: vi.fn(),
    getStreamingUrl: vi.fn(),
    isAuthenticated: vi.fn().mockReturnValue(true),
    getUserProfile: vi.fn().mockResolvedValue({
      id: 'test-user-id',
      username: 'test-user',
      thumb: 'test-thumb',
      email: 'test@example.com',
    }),
    initialize: vi.fn(),
    clearAuthToken: vi.fn(),
  },
  sessionService: {
    createSession: vi.fn(),
    joinSession: vi.fn(),
    leaveSession: vi.fn(),
    getStoredSession: vi.fn(),
    clearStoredSession: vi.fn(),
    generateInviteLink: vi.fn(),
  },
  tmdbService: {
    getMovieDetails: vi.fn(),
    searchMovies: vi.fn(),
    getMovieRecommendations: vi.fn(),
    getConfiguration: vi.fn(),
    isConfigured: vi.fn(),
    validateConfig: vi.fn(),
  },
};

// Consolidated exports
export * from '@testing-library/react';
export {
  renderWithProviders as render,
  simulateSwipe,
  mockServices,
  createMessage,
  WS_READY_STATES,
  MockWebSocket
};
