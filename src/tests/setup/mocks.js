// src/tests/setup/mocks.js

import { vi } from 'vitest';

// Mock PlexContext
vi.mock('@/contexts/PlexContext', () => ({
  usePlex: () => ({
    user: {
      id: 'test-user-id',
      username: 'test-user',
      thumb: 'test-thumb'
    },
    isAuthenticated: true,
    servers: [],
    selectedServer: null,
    loading: false,
    error: null
  })
}));

// Mock PlexService
vi.mock('@/services/plexService', () => ({
  plexService: {
    token: 'test-token',
    baseUrl: 'http://test-server',
    clientId: 'test-client-id',
    serverId: 'test-server-id',
    isAuthenticated: () => true,
    getHeaders: () => ({
      'X-Plex-Token': 'test-token',
      'X-Plex-Client-Identifier': 'test-client-id'
    }),
    getUserProfile: vi.fn().mockResolvedValue({
      id: 'test-user-id',
      username: 'test-user',
      thumb: 'test-thumb'
    }),
    getServers: vi.fn().mockResolvedValue([
      {
        name: 'Test Server',
        clientIdentifier: 'test-server-id',
        connections: [{ uri: 'http://test-server' }]
      }
    ]),
    initialize: vi.fn(),
    clearAuthToken: vi.fn()
  }
}));

// Mock useToast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
  default: {
    test: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn()
  }
}));
