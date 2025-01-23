// jest.setup.ts
import '@testing-library/jest-dom';
import { server } from './src/mocks/server';

// Establish API mocking before all tests
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});

// Clean up after the tests are finished
afterAll(() => server.close());

// Mock WebSocket
global.WebSocket = class MockWebSocket {
  onopen: () => void = () => {};
  onclose: () => void = () => {};
  onmessage: (data: any) => void = () => {};
  onerror: () => void = () => {};
  send: jest.Mock = jest.fn();
  close: jest.Mock = jest.fn();

  constructor(url: string) {
    setTimeout(() => this.onopen(), 0);
  }
};

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.PLEX_CLIENT_IDENTIFIER = 'test-client-id';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/votarr_test';
