// src/tests/components/VoteManager.test.jsx
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VoteManager from '../../components/VoteManager';
import { RealtimeContext } from '../../contexts/RealtimeContext';
import logger from '../../utils/logger';

// Mock the toast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('VoteManager Component', () => {
  const mockVotes = {
    'movie1': ['user1', 'user2'],
    'movie2': ['user3'],
    'movie3': ['user4', 'user5']
  };

  const mockMovies = {
    'movie1': { id: 'movie1', title: 'Movie 1', poster: '/poster1.jpg' },
    'movie2': { id: 'movie2', title: 'Movie 2', poster: '/poster2.jpg' },
    'movie3': { id: 'movie3', title: 'Movie 3', poster: '/poster3.jpg' }
  };

  const mockRealtimeContext = {
    sendVote: vi.fn(),
    updateVoteStatus: vi.fn()
  };

  beforeEach(async () => {
    try {
      await logger.test('VoteManager', 'Setting up test environment');
      vi.clearAllMocks();
    } catch (error) {
      await logger.error('VoteManager setup failed', error);
      throw error;
    }
  });

  afterEach(async () => {
    try {
      await logger.test('VoteManager', 'Cleaning up test environment');
    } catch (error) {
      await logger.error('VoteManager cleanup failed', error);
    }
  });

  const renderWithContext = (ui, contextValue = mockRealtimeContext) => {
    return render(
      <RealtimeContext.Provider value={contextValue}>
        {ui}
      </RealtimeContext.Provider>
    );
  };

  describe('Rendering', () => {
    test('renders voting options correctly', async () => {
      try {
        await logger.test('VoteManager', 'Testing voting options render');
        renderWithContext(
          <VoteManager
            votes={mockVotes}
            movies={mockMovies}
            currentUserId="user1"
            round={1}
            maxVotes={2}
          />
        );

        Object.values(mockMovies).forEach(movie => {
          expect(screen.getByText(movie.title)).toBeInTheDocument();
        });

        await logger.test('VoteManager', 'Voting options render passed');
      } catch (error) {
        await logger.error('VoteManager render failed', error);
        throw error;
      }
    });

    test('displays vote counts correctly', async () => {
      try {
        await logger.test('VoteManager', 'Testing vote count display');
        renderWithContext(
          <VoteManager
            votes={mockVotes}
            movies={mockMovies}
            currentUserId="user1"
            round={1}
            maxVotes={2}
          />
        );

        expect(screen.getByTestId('vote-count-movie1')).toHaveTextContent('2');
        expect(screen.getByTestId('vote-count-movie2')).toHaveTextContent('1');
        expect(screen.getByTestId('vote-count-movie3')).toHaveTextContent('2');

        await logger.test('VoteManager', 'Vote count display passed');
      } catch (error) {
        await logger.error('VoteManager vote count display failed', error);
        throw error;
      }
    });
  });

  describe('Voting Functionality', () => {
    test('allows voting within maximum votes limit', async () => {
      try {
        await logger.test('VoteManager', 'Testing voting functionality');
        renderWithContext(
          <VoteManager
            votes={mockVotes}
            movies={mockMovies}
            currentUserId="user6"
            round={1}
            maxVotes={2}
          />
        );

        const voteButton = screen.getByTestId('vote-button-movie1');
        fireEvent.click(voteButton);

        expect(mockRealtimeContext.sendVote).toHaveBeenCalledWith('movie1', 'user6');

        await logger.test('VoteManager', 'Voting functionality passed');
      } catch (error) {
        await logger.error('VoteManager voting functionality failed', error);
        throw error;
      }
    });

    test('prevents voting beyond maximum votes', async () => {
      try {
        await logger.test('VoteManager', 'Testing max votes limit');
        const userVotes = { ...mockVotes, movie1: ['user6'], movie2: ['user6'] };
        
        renderWithContext(
          <VoteManager
            votes={userVotes}
            movies={mockMovies}
            currentUserId="user6"
            round={1}
            maxVotes={2}
          />
        );

        const voteButton = screen.getByTestId('vote-button-movie3');
        fireEvent.click(voteButton);

        expect(mockRealtimeContext.sendVote).not.toHaveBeenCalled();

        await logger.test('VoteManager', 'Max votes limit passed');
      } catch (error) {
        await logger.error('VoteManager max votes limit failed', error);
        throw error;
      }
    });
  });

  describe('Round Management', () => {
    test('handles different voting rounds correctly', async () => {
      try {
        await logger.test('VoteManager', 'Testing round management');
        const { rerender } = renderWithContext(
          <VoteManager
            votes={mockVotes}
            movies={mockMovies}
            currentUserId="user1"
            round={1}
            maxVotes={2}
          />
        );

        // First round
        expect(screen.getByText('Round 1')).toBeInTheDocument();
        expect(screen.getByText('Choose up to 2 movies')).toBeInTheDocument();

        // Second round
        rerender(
          <RealtimeContext.Provider value={mockRealtimeContext}>
            <VoteManager
              votes={mockVotes}
              movies={mockMovies}
              currentUserId="user1"
              round={2}
              maxVotes={1}
            />
          </RealtimeContext.Provider>
        );

        expect(screen.getByText('Final Round')).toBeInTheDocument();
        expect(screen.getByText('Choose 1 movie')).toBeInTheDocument();

        await logger.test('VoteManager', 'Round management passed');
      } catch (error) {
        await logger.error('VoteManager round management failed', error);
        throw error;
      }
    });
  });

  describe('Error Handling', () => {
    test('handles missing movie data gracefully', async () => {
      try {
        await logger.test('VoteManager', 'Testing error handling');
        const invalidVotes = {
          'movie1': ['user1'],
          'invalidMovie': ['user2']
        };

        renderWithContext(
          <VoteManager
            votes={invalidVotes}
            movies={mockMovies}
            currentUserId="user1"
            round={1}
            maxVotes={2}
          />
        );

        expect(screen.queryByTestId('vote-button-invalidMovie')).not.toBeInTheDocument();

        await logger.test('VoteManager', 'Error handling passed');
      } catch (error) {
        await logger.error('VoteManager error handling failed', error);
        throw error;
      }
    });
  });
});
