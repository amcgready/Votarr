// src/tests/pages/MovieQueuePage.test.jsx
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MovieQueuePage from '../../pages/MovieQueuePage';
import { VotingProvider } from '../../contexts/VotingContext';
import { PlexProvider } from '../../contexts/PlexContext';
import { plexService } from '../../services/plexService';
import { BrowserRouter } from 'react-router-dom';
import logger from '../../utils/logger';

// Mock dependencies
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

vi.mock('../../services/plexService', () => ({
  plexService: {
    getWatchHistory: vi.fn(),
    getLibraries: vi.fn(),
    getMediaByGenre: vi.fn(),
    getMediaItems: vi.fn()
  }
}));

// Mock framer-motion to handle animations in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  },
  useAnimation: () => ({
    start: vi.fn(),
    set: vi.fn()
  })
}));

const mockMovies = [
  {
    id: '1',
    title: 'Test Movie 1',
    year: 2024,
    summary: 'A test movie summary',
    thumb: '/api/placeholder/300/450',
    genres: ['Action', 'Adventure'],
    rating: 8.5,
    contentRating: 'PG-13'
  },
  {
    id: '2',
    title: 'Test Movie 2',
    year: 2023,
    summary: 'Another test movie',
    thumb: '/api/placeholder/300/450',
    genres: ['Comedy'],
    rating: 7.5,
    contentRating: 'PG'
  }
];

// Mock VotingContext initial state
const mockVotingContext = {
  mainQueue: [],
  maybeQueue: [],
  addToMainQueue: vi.fn(),
  addToMaybeQueue: vi.fn(),
  removeFromMainQueue: vi.fn(),
  removeFromMaybeQueue: vi.fn()
};

const renderWithProviders = (component, { votingContext = mockVotingContext } = {}) => {
  return render(
    <BrowserRouter>
      <PlexProvider>
        <VotingProvider initialState={votingContext}>
          {component}
        </VotingProvider>
      </PlexProvider>
    </BrowserRouter>
  );
};

describe('MovieQueuePage', () => {
  beforeEach(async () => {
    try {
      await logger.test('MovieQueuePage', 'Setting up test environment');
      
      // Reset all mocks
      vi.clearAllMocks();
      
      // Setup Plex service mocks
      plexService.getWatchHistory.mockResolvedValue([]);
      plexService.getLibraries.mockResolvedValue([
        { key: 'movies', type: 'movie' }
      ]);
      plexService.getMediaItems.mockResolvedValue(mockMovies);
      
      await logger.test('MovieQueuePage', 'Test environment setup complete');
    } catch (error) {
      await logger.error('MovieQueuePage setup failed', error);
      throw error;
    }
  });

  describe('Initial Loading', () => {
    test('shows loading state initially', async () => {
      try {
        await logger.test('MovieQueuePage', 'Testing initial loading state');
        renderWithProviders(<MovieQueuePage />);
        
        expect(screen.getByText(/loading movies/i)).toBeInTheDocument();
        
        await logger.test('MovieQueuePage', 'Initial loading state test passed');
      } catch (error) {
        await logger.error('Initial loading state test failed', error);
        throw error;
      }
    });

    test('handles Plex API errors gracefully', async () => {
      try {
        await logger.test('MovieQueuePage', 'Testing API error handling');
        plexService.getLibraries.mockRejectedValue(new Error('API Error'));
        
        renderWithProviders(<MovieQueuePage />);
        
        await waitFor(() => {
          expect(screen.getByText(/API Error/i)).toBeInTheDocument();
          expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
        });
        
        await logger.test('MovieQueuePage', 'API error handling test passed');
      } catch (error) {
        await logger.error('API error handling test failed', error);
        throw error;
      }
    });
  });

  describe('Movie Card Interactions', () => {
    test('allows swiping right to add to main queue', async () => {
      try {
        await logger.test('MovieQueuePage', 'Testing right swipe interaction');
        const { container } = renderWithProviders(<MovieQueuePage />);
        
        await waitFor(() => {
          expect(screen.getByText('Test Movie 1')).toBeInTheDocument();
        });

        const swipeContainer = container.querySelector('[data-testid="swipe-container"]');
        
        // Simulate right swipe
        fireEvent.pointerDown(swipeContainer, { clientX: 0, clientY: 0 });
        fireEvent.pointerMove(swipeContainer, { clientX: 200, clientY: 0 });
        fireEvent.pointerUp(swipeContainer);
        
        expect(mockVotingContext.addToMainQueue).toHaveBeenCalledWith(mockMovies[0]);
        
        await logger.test('MovieQueuePage', 'Right swipe test passed');
      } catch (error) {
        await logger.error('Right swipe test failed', error);
        throw error;
      }
    });

    test('allows swiping up/down to add to maybe queue', async () => {
      try {
        await logger.test('MovieQueuePage', 'Testing vertical swipe interaction');
        const { container } = renderWithProviders(<MovieQueuePage />);
        
        await waitFor(() => {
          expect(screen.getByText('Test Movie 1')).toBeInTheDocument();
        });

        const swipeContainer = container.querySelector('[data-testid="swipe-container"]');
        
        // Simulate up swipe
        fireEvent.pointerDown(swipeContainer, { clientX: 0, clientY: 200 });
        fireEvent.pointerMove(swipeContainer, { clientX: 0, clientY: 0 });
        fireEvent.pointerUp(swipeContainer);
        
        expect(mockVotingContext.addToMaybeQueue).toHaveBeenCalledWith(mockMovies[0]);
        
        await logger.test('MovieQueuePage', 'Vertical swipe test passed');
      } catch (error) {
        await logger.error('Vertical swipe test failed', error);
        throw error;
      }
    });

    test('supports keyboard navigation', async () => {
      try {
        await logger.test('MovieQueuePage', 'Testing keyboard navigation');
        renderWithProviders(<MovieQueuePage />);
        
        await waitFor(() => {
          expect(screen.getByText('Test Movie 1')).toBeInTheDocument();
        });

        const movieCard = screen.getByTestId('movie-card');
        movieCard.focus();
        
        // Right arrow to add to main queue
        fireEvent.keyDown(movieCard, { key: 'ArrowRight' });
        expect(mockVotingContext.addToMainQueue).toHaveBeenCalledWith(mockMovies[0]);
        
        // Up arrow to add to maybe queue
        fireEvent.keyDown(movieCard, { key: 'ArrowUp' });
        expect(mockVotingContext.addToMaybeQueue).toHaveBeenCalledWith(mockMovies[0]);
        
        await logger.test('MovieQueuePage', 'Keyboard navigation test passed');
      } catch (error) {
        await logger.error('Keyboard navigation test failed', error);
        throw error;
      }
    });
  });

  describe('Queue Management', () => {
    test('shows queue full dialog when queues are filled', async () => {
      try {
        await logger.test('MovieQueuePage', 'Testing queue full dialog');
        const fullContext = {
          ...mockVotingContext,
          mainQueue: Array(5).fill(mockMovies[0]),
          maybeQueue: Array(2).fill(mockMovies[1])
        };
        
        renderWithProviders(<MovieQueuePage />, { votingContext: fullContext });
        
        await waitFor(() => {
          expect(screen.getByText(/review your selections/i)).toBeInTheDocument();
          expect(screen.getByRole('button', { name: /let's vote/i })).toBeInTheDocument();
        });
        
        await logger.test('MovieQueuePage', 'Queue full dialog test passed');
      } catch (error) {
        await logger.error('Queue full dialog test failed', error);
        throw error;
      }
    });

    test('allows viewing queues in side panel', async () => {
      try {
        await logger.test('MovieQueuePage', 'Testing queue side panel');
        renderWithProviders(<MovieQueuePage />);
        
        const viewQueuesButton = screen.getByRole('button', { name: /view queues/i });
        await userEvent.click(viewQueuesButton);
        
        expect(screen.getByText(/main queue/i)).toBeInTheDocument();
        expect(screen.getByText(/maybe queue/i)).toBeInTheDocument();
        
        await logger.test('MovieQueuePage', 'Queue side panel test passed');
      } catch (error) {
        await logger.error('Queue side panel test failed', error);
        throw error;
      }
    });
  });

  describe('Voting Flow', () => {
    test('navigates to voting page when confirmed', async () => {
      try {
        await logger.test('MovieQueuePage', 'Testing voting navigation');
        const navigate = vi.fn();
        vi.mock('react-router-dom', () => ({
          ...vi.importActual('react-router-dom'),
          useNavigate: () => navigate
        }));
        
        const fullContext = {
          ...mockVotingContext,
          mainQueue: Array(5).fill(mockMovies[0])
        };
        
        renderWithProviders(<MovieQueuePage />, { votingContext: fullContext });
        
        // Open queue dialog
        await waitFor(() => {
          screen.getByText(/review your selections/i);
        });
        
        // Click "Let's Vote"
        const voteButton = screen.getByRole('button', { name: /let's vote/i });
        await userEvent.click(voteButton);
        
        // Confirm in the dialog
        const confirmButton = screen.getByRole('button', { name: /start voting/i });
        await userEvent.click(confirmButton);
        
        expect(navigate).toHaveBeenCalledWith('/vote');
        
        await logger.test('MovieQueuePage', 'Voting navigation test passed');
      } catch (error) {
        await logger.error('Voting navigation test failed', error);
        throw error;
      }
    });
  });

  describe('Performance Optimizations', () => {
    test('loads more movies when running low', async () => {
      try {
        await logger.test('MovieQueuePage', 'Testing movie loading optimization');
        plexService.getMediaItems
          .mockResolvedValueOnce(mockMovies)
          .mockResolvedValueOnce([...mockMovies]);
        
        renderWithProviders(<MovieQueuePage />);
        
        // Swipe through movies until near the end
        const swipeContainer = screen.getByTestId('swipe-container');
        for (let i = 0; i < mockMovies.length - 2; i++) {
          fireEvent.pointerDown(swipeContainer, { clientX: 0, clientY: 0 });
          fireEvent.pointerMove(swipeContainer, { clientX: 200, clientY: 0 });
          fireEvent.pointerUp(swipeContainer);
        }
        
        await waitFor(() => {
          expect(plexService.getMediaItems).toHaveBeenCalledTimes(2);
        });
        
        await logger.test('MovieQueuePage', 'Movie loading optimization test passed');
      } catch (error) {
        await logger.error('Movie loading optimization test failed', error);
        throw error;
      }
    });
  });
});
