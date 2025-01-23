// src/tests/integration/ComponentInteractions.test.js
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MovieCard } from '@/components/ui/MovieCard';
import { VotingManager } from '@/components/VotingManager';
import { QueueDisplay } from '@/components/QueueDisplay';
import { mockPlexData, mockQueues } from '../fixtures/testData';
import { MockWebSocket } from '../mocks/websocket';

describe('Component Interactions', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('MovieCard Interactions', () => {
    test('swipe right adds movie to main queue', async () => {
      const onSwipe = vi.fn();
      const movie = mockPlexData.movies[0];

      render(
        <MovieCard
          movie={movie}
          mainQueue={[]}
          maybeQueue={[]}
          onSwipe={onSwipe}
        />
      );

      const card = screen.getByTestId('movie-card');
      
      // Simulate right swipe
      fireEvent.touchStart(card, { touches: [{ clientX: 0, clientY: 0 }] });
      fireEvent.touchEnd(card, { changedTouches: [{ clientX: 200, clientY: 0 }] });

      await waitFor(() => {
        expect(onSwipe).toHaveBeenCalledWith('right', movie);
      });
    });

    test('swipe up adds movie to maybe queue', async () => {
      const onSwipe = vi.fn();
      const movie = mockPlexData.movies[0];

      render(
        <MovieCard
          movie={movie}
          mainQueue={[]}
          maybeQueue={[]}
          onSwipe={onSwipe}
        />
      );

      const card = screen.getByTestId('movie-card');
      
      // Simulate up swipe
      fireEvent.touchStart(card, { touches: [{ clientX: 0, clientY: 200 }] });
      fireEvent.touchEnd(card, { changedTouches: [{ clientX: 0, clientY: 0 }] });

      await waitFor(() => {
        expect(onSwipe).toHaveBeenCalledWith('up', movie);
      });
    });
  });

  describe('QueueDisplay Interactions', () => {
    test('removes item from queue on button click', async () => {
      const onRemove = vi.fn();
      const queue = mockQueues.mainQueue;

      render(
        <QueueDisplay
          items={queue}
          queueType="main"
          maxItems={5}
          onRemove={onRemove}
        />
      );

      const removeButton = screen.getByTestId(`remove-${queue[0].id}`);
      await userEvent.click(removeButton);

      expect(onRemove).toHaveBeenCalledWith(queue[0].id);
    });
  });

  describe('VotingManager Interactions', () => {
    test('handles voting round transitions', async () => {
      const mockSession = {
        status: 'voting',
        votedUsers: [],
        currentRound: 1
      };

      render(
        <VotingManager
          sessionState={mockSession}
          isHost={true}
          connectedUsers={[mockPlexData.user]}
        />
      );

      // Verify initial round state
      expect(screen.getByText(/Round 1 of 2/i)).toBeInTheDocument();

      // Simulate voting completion
      mockSession.votedUsers = [mockPlexData.user.id];
      mockSession.currentRound = 2;

      // Verify round transition
      await waitFor(() => {
        expect(screen.getByText(/Round 2 of 2/i)).toBeInTheDocument();
      });
    });
  });
});

// src/tests/integration/ServiceIntegration.test.js
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { plexService } from '@/services/plexService';
import { tmdbService } from '@/services/tmdbService';
import { mockPlexData, mockTMDBData } from '../fixtures/testData';

describe('Service Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('enhances plex movies with tmdb data', async () => {
    // Mock service responses
    vi.spyOn(plexService, 'getMediaItems').mockResolvedValue(mockPlexData.movies);
    vi.spyOn(tmdbService, 'search').mockResolvedValue([mockTMDBData.movieDetails]);

    const movies = await plexService.getMediaItems();
    const enhancedMovies = await Promise.all(
      movies.map(async (movie) => {
        const tmdbData = await tmdbService.search(movie.title);
        return {
          ...movie,
          tmdbRating: tmdbData[0].vote_average
        };
      })
    );

    expect(enhancedMovies[0]).toHaveProperty('tmdbRating');
    expect(tmdbService.search).toHaveBeenCalledWith(mockPlexData.movies[0].title);
  });
});

// src/tests/integration/ErrorRecovery.test.js
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PlexProvider } from '@/contexts/PlexContext';
import { mockPlexData } from '../fixtures/testData';

const ErrorComponent = ({ error }) => {
  throw error;
};

describe('Error Recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('recovers from plex authentication errors', async () => {
    const authError = new Error('Authentication failed');
    authError.name = 'PlexAuthError';

    render(
      <ErrorBoundary>
        <ErrorComponent error={authError} />
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText(/Authentication Error/i)).toBeInTheDocument();
      expect(screen.getByText(/Please try logging in again/i)).toBeInTheDocument();
    });

    // Test recovery action
    const loginButton = screen.getByRole('button', { name: /Return to Login/i });
    fireEvent.click(loginButton);

    expect(window.location.pathname).toBe('/');
  });

  test('recovers from network errors', async () => {
    const networkError = new Error('Network error');
    networkError.name = 'NetworkError';

    render(
      <ErrorBoundary>
        <ErrorComponent error={networkError} />
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText(/Connection Error/i)).toBeInTheDocument();
      expect(screen.getByText(/Please check your internet connection/i)).toBeInTheDocument();
    });

    // Test retry action
    const retryButton = screen.getByRole('button', { name: /Retry Connection/i });
    fireEvent.click(retryButton);
  });
});

// src/tests/integration/StateManagement.test.js
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { RealtimeProvider, useRealtime } from '@/contexts/RealtimeContext';
import { VotingProvider, useVoting } from '@/contexts/VotingContext';
import { mockSessionData, mockQueues } from '../fixtures/testData';

describe('State Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  test('manages voting state across components', async () => {
    const wrapper = ({ children }) => (
      <RealtimeProvider>
        <VotingProvider>{children}</VotingProvider>
      </RealtimeProvider>
    );

    const { result } = renderHook(() => useVoting(), { wrapper });

    act(() => {
      result.current.updateQueue(mockQueues.mainQueue, mockQueues.maybeQueue);
    });

    expect(result.current.mainQueue).toEqual(mockQueues.mainQueue);
    expect(result.current.maybeQueue).toEqual(mockQueues.maybeQueue);
  });

  test('synchronizes session state across realtime updates', async () => {
    const wrapper = ({ children }) => (
      <RealtimeProvider>
        <VotingProvider>{children}</VotingProvider>
      </RealtimeProvider>
    );

    const { result } = renderHook(() => useRealtime(), { wrapper });

    act(() => {
      result.current.updateSessionState(mockSessionData);
    });

    expect(result.current.sessionState).toEqual(mockSessionData);
  });
});
