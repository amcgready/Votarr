// src/tests/VotingPage.test.jsx
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VotingPage from '../../pages/VotingPage';
import { PlexProvider } from '../../contexts/PlexContext';
import { BrowserRouter } from 'react-router-dom';
import { plexService } from '../../services/plexService';
import logger from '../../utils/logger';

// Mock the toast hook
vi.mock('@/components/ui/use-toast', () => ({
 useToast: () => ({
   toast: vi.fn()
 })
}));

// Mock session storage
const sessionStorageMock = (() => {
 let store = {};
 return {
   getItem: vi.fn(key => store[key] ?? null),
   setItem: vi.fn((key, value) => {
     store[key] = value.toString();
   }),
   clear: vi.fn(() => {
     store = {};
   }),
   removeItem: vi.fn(key => {
     delete store[key];
   })
 };
})();

Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

const mockMovies = [
 {
   id: '1',
   title: 'Test Movie 1',
   year: 2024,
   type: 'movie',
   summary: 'Test summary 1',
   thumb: '/api/placeholder/300/450',
   genres: ['Action', 'Adventure'],
   rating: 8.5,
   contentRating: 'PG-13'
 },
 {
   id: '2',
   title: 'Test Movie 2',
   year: 2023,
   type: 'movie',
   summary: 'Test summary 2',
   thumb: '/api/placeholder/300/450',
   genres: ['Comedy', 'Drama'],
   rating: 7.8,
   contentRating: 'R'
 }
];

const renderWithProviders = (component) => {
 return render(
   <BrowserRouter>
     <PlexProvider>
       {component}
     </PlexProvider>
   </BrowserRouter>
 );
};

describe('VotingPage', () => {
 beforeEach(async () => {
   try {
     await logger.test('VotingPage', 'Setting up test environment');
     sessionStorageMock.clear();
     vi.clearAllMocks();

     // Setup initial session state
     sessionStorageMock.setItem('selectedGenres', JSON.stringify(['Action']));
     sessionStorageMock.setItem('mediaType', 'movie');

     // Mock Plex service methods
     vi.spyOn(plexService, 'fetchMediaByGenre').mockResolvedValue(mockMovies);
     vi.spyOn(plexService, 'getStreamingUrl').mockImplementation(id => `/api/placeholder/${id}`);

     await logger.test('VotingPage', 'Test environment setup complete');
   } catch (error) {
     await logger.error('VotingPage setup failed', error);
     throw error;
   }
 });

 afterEach(async () => {
   await logger.test('VotingPage', 'Cleaning up test environment');
 });

 describe('Initial Render', () => {
   test('renders initial movie card', async () => {
     try {
       await logger.test('VotingPage', 'Testing initial render');
       renderWithProviders(<VotingPage />);
       
       await waitFor(() => {
         expect(screen.getByText(mockMovies[0].title)).toBeInTheDocument();
         expect(screen.getByText(mockMovies[0].year.toString())).toBeInTheDocument();
       });
       
       await logger.test('VotingPage', 'Initial render test passed');
     } catch (error) {
       await logger.error('Initial render test failed', error);
       throw error;
     }
   });

   test('displays loading state initially', async () => {
     try {
       await logger.test('VotingPage', 'Testing loading state');
       renderWithProviders(<VotingPage />);
       
       expect(screen.getByRole('progressbar')).toBeInTheDocument();
       
       await logger.test('VotingPage', 'Loading state test passed');
     } catch (error) {
       await logger.error('Loading state test failed', error);
       throw error;
     }
   });
 });

 describe('Queue Management', () => {
   test('handles right swipe (add to main queue)', async () => {
     try {
       await logger.test('VotingPage', 'Testing main queue addition');
       renderWithProviders(<VotingPage />);
       
       await waitFor(() => {
         const movieCard = screen.getByTestId('movie-card');
         fireEvent.touchStart(movieCard, { touches: [{ clientX: 0 }] });
         fireEvent.touchMove(movieCard, { touches: [{ clientX: 200 }] });
         fireEvent.touchEnd(movieCard);
       });
       
       // Verify movie was added to main queue
       const mainQueue = JSON.parse(sessionStorageMock.getItem('mainQueue') || '[]');
       expect(mainQueue).toHaveLength(1);
       expect(mainQueue[0].id).toBe(mockMovies[0].id);
       
       await logger.test('VotingPage', 'Main queue addition test passed');
     } catch (error) {
       await logger.error('Main queue addition test failed', error);
       throw error;
     }
   });

   test('handles up/down swipe (maybe queue)', async () => {
     try {
       await logger.test('VotingPage', 'Testing maybe queue addition');
       renderWithProviders(<VotingPage />);
       
       await waitFor(() => {
         const movieCard = screen.getByTestId('movie-card');
         fireEvent.touchStart(movieCard, { touches: [{ clientY: 200 }] });
         fireEvent.touchMove(movieCard, { touches: [{ clientY: 0 }] });
         fireEvent.touchEnd(movieCard);
       });
       
       // Verify movie was added to maybe queue
       const maybeQueue = JSON.parse(sessionStorageMock.getItem('maybeQueue') || '[]');
       expect(maybeQueue).toHaveLength(1);
       expect(maybeQueue[0].id).toBe(mockMovies[0].id);
       
       await logger.test('VotingPage', 'Maybe queue addition test passed');
     } catch (error) {
       await logger.error('Maybe queue addition test failed', error);
       throw error;
     }
   });

   test('enforces queue size limits', async () => {
     try {
       await logger.test('VotingPage', 'Testing queue size limits');
       // Populate main queue with max items
       const fullMainQueue = Array(5).fill(mockMovies[0]);
       sessionStorageMock.setItem('mainQueue', JSON.stringify(fullMainQueue));
       
       renderWithProviders(<VotingPage />);
       
       await waitFor(() => {
         const movieCard = screen.getByTestId('movie-card');
         fireEvent.touchStart(movieCard, { touches: [{ clientX: 0 }] });
         fireEvent.touchMove(movieCard, { touches: [{ clientX: 200 }] });
         fireEvent.touchEnd(movieCard);
       });
       
       // Verify queue size hasn't changed
       const mainQueue = JSON.parse(sessionStorageMock.getItem('mainQueue') || '[]');
       expect(mainQueue).toHaveLength(5);
       
       await logger.test('VotingPage', 'Queue size limits test passed');
     } catch (error) {
       await logger.error('Queue size limits test failed', error);
       throw error;
     }
   });
 });

 describe('Voting Flow', () => {
   test('shows vote button when queues are full', async () => {
     try {
       await logger.test('VotingPage', 'Testing vote button appearance');
       const fullMainQueue = Array(5).fill(mockMovies[0]);
       const fullMaybeQueue = Array(2).fill(mockMovies[1]);
       
       sessionStorageMock.setItem('mainQueue', JSON.stringify(fullMainQueue));
       sessionStorageMock.setItem('maybeQueue', JSON.stringify(fullMaybeQueue));
       
       renderWithProviders(<VotingPage />);
       
       await waitFor(() => {
         expect(screen.getByRole('button', { name: /let's vote/i })).toBeInTheDocument();
       });
       
       await logger.test('VotingPage', 'Vote button appearance test passed');
     } catch (error) {
       await logger.error('Vote button appearance test failed', error);
       throw error;
     }
   });

   test('handles voting initiation', async () => {
     try {
       await logger.test('VotingPage', 'Testing voting initiation');
       // Set up full queues
       const fullMainQueue = Array(5).fill(mockMovies[0]);
       const fullMaybeQueue = Array(2).fill(mockMovies[1]);
       
       sessionStorageMock.setItem('mainQueue', JSON.stringify(fullMainQueue));
       sessionStorageMock.setItem('maybeQueue', JSON.stringify(fullMaybeQueue));
       
       renderWithProviders(<VotingPage />);
       
       await waitFor(() => {
         const voteButton = screen.getByRole('button', { name: /let's vote/i });
         fireEvent.click(voteButton);
       });
       
       // Verify transition to voting state
       expect(sessionStorageMock.getItem('votingState')).toBe('active');
       
       await logger.test('VotingPage', 'Voting initiation test passed');
     } catch (error) {
       await logger.error('Voting initiation test failed', error);
       throw error;
     }
   });
 });

 describe('Error Handling', () => {
   test('handles errors when loading movies', async () => {
     try {
       await logger.test('VotingPage', 'Testing movie loading error handling');
       vi.spyOn(plexService, 'fetchMediaByGenre')
         .mockRejectedValue(new Error('Failed to fetch movies'));
       
       renderWithProviders(<VotingPage />);
       
       await waitFor(() => {
         expect(screen.getByText(/error loading movies/i)).toBeInTheDocument();
       });
       
       await logger.test('VotingPage', 'Movie loading error test passed');
     } catch (error) {
       await logger.error('Movie loading error test failed', error);
       throw error;
     }
   });

   test('handles missing session data', async () => {
     try {
       await logger.test('VotingPage', 'Testing missing session data handling');
       sessionStorageMock.clear(); // Clear all session data
       
       renderWithProviders(<VotingPage />);
       
       await waitFor(() => {
         expect(screen.getByText(/invalid session/i)).toBeInTheDocument();
       });
       
       await logger.test('VotingPage', 'Missing session data test passed');
     } catch (error) {
       await logger.error('Missing session data test failed', error);
       throw error;
     }
   });
 });
});
