// src/tests/integration/UserFlows.test.js
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import App from '../../App';
import { mockPlexData, mockTMDBData, mockSessionData } from '../fixtures/testData';
import { MockWebSocket } from '../mocks/websocket';

// Mock services
vi.mock('@/services/plexService', () => ({
  plexService: {
    isAuthenticated: vi.fn(() => true),
    getServers: vi.fn(() => Promise.resolve(mockPlexData.servers)),
    getUserProfile: vi.fn(() => Promise.resolve(mockPlexData.user)),
    getMediaItems: vi.fn(() => Promise.resolve(mockPlexData.movies)),
    initialize: vi.fn(),
    handleCallback: vi.fn()
  }
}));

vi.mock('@/services/tmdbService', () => ({
  tmdbService: {
    getDetails: vi.fn(() => Promise.resolve(mockTMDBData.movieDetails)),
    search: vi.fn(() => Promise.resolve([mockTMDBData.movieDetails]))
  }
}));

// Replace WebSocket with mock
global.WebSocket = MockWebSocket;

describe('User Flows', () => {
  let mockWs;

  beforeEach(() => {
    MockWebSocket.instances = [];
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Host Flow', () => {
    test('complete host flow from landing to results', async () => {
      // Set up base authentication state
      localStorage.setItem('plexToken', 'test_token');
      sessionStorage.setItem('userCount', '2');

      const user = userEvent.setup();
      const router = createMemoryRouter([{ path: "*", element: <App /> }], {
        initialEntries: ['/'],
      });

      render(<RouterProvider router={router} />);

      // Verify landing page
      await waitFor(() => {
        expect(screen.getByText(/Select Number of Users/i)).toBeInTheDocument();
      });

      // Select user count
      const userCountButton = screen.getByRole('button', { name: /2 users/i });
      await user.click(userCountButton);

      // Verify server selection
      await waitFor(() => {
        expect(screen.getByText(/Select Server/i)).toBeInTheDocument();
      });

      // Select server
      const serverButton = screen.getByTestId('server-select-item');
      await user.click(serverButton);

      // Wait for WebSocket connection
      await waitFor(() => {
        mockWs = MockWebSocket.instances[0];
        expect(mockWs).toBeDefined();
      });

      // Verify queue page
      await waitFor(() => {
        expect(screen.getByText(/Build Your Queue/i)).toBeInTheDocument();
      });

      // Simulate movie swipes
      const movieCard = screen.getByTestId('movie-card');
      for (let i = 0; i < 5; i++) {
        fireEvent.touchStart(movieCard, { touches: [{ clientX: 0, clientY: 0 }] });
        fireEvent.touchEnd(movieCard, { changedTouches: [{ clientX: 200, clientY: 0 }] });
        await waitFor(() => {
          expect(mockWs.sentMessages).toContainEqual(
            expect.objectContaining({ type: 'QUEUE_UPDATE' })
          );
        });
      }

      // Start voting
      const voteButton = screen.getByRole('button', { name: /Let's Vote!/i });
      await user.click(voteButton);

      // Verify voting page
      await waitFor(() => {
        expect(screen.getByText(/Round 1 of 2/i)).toBeInTheDocument();
      });

      // Simulate voting process
      mockWs.simulateMessage({
        type: 'VOTE_UPDATE',
        payload: { votedUsers: [mockPlexData.user.id] }
      });

      // Complete voting
      mockWs.simulateMessage({
        type: 'VOTING_COMPLETE',
        payload: {
          winner: mockPlexData.movies[0],
          totalVotes: 2,
          winningVotes: 2
        }
      });

      // Verify results page
      await waitFor(() => {
        expect(screen.getByText(/Winner Selected!/i)).toBeInTheDocument();
      });
    });
  });
});
