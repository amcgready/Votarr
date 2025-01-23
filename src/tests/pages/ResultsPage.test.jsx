// src/tests/pages/ResultsPage.test.jsx
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResultsPage from '../../pages/ResultsPage';
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

const mockWinningMovie = {
  id: 'movie1',
  title: 'Winning Movie',
  year: 2024,
  summary: 'A great movie that won the vote',
  thumb: '/api/placeholder/300/450',
  genres: ['Action', 'Adventure'],
  rating: 8.5,
  contentRating: 'PG-13',
  plexUrl: 'http://plex.server/movie1'
};

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <PlexProvider>
        {component}
      </PlexProvider>
    </BrowserRouter>
  );
};

describe('ResultsPage', () => {
  beforeEach(async () => {
    try {
      await logger.test('ResultsPage', 'Setting up test environment');
      sessionStorageMock.clear();
      vi.clearAllMocks();

      // Set up session state
      sessionStorageMock.setItem('winningMovie', JSON.stringify(mockWinningMovie));
      sessionStorageMock.setItem('votingComplete', 'true');

      // Mock Plex service methods
      vi.spyOn(plexService, 'getStreamingUrl').mockResolvedValue(mockWinningMovie.plexUrl);
      
      await logger.test('ResultsPage', 'Test environment setup complete');
    } catch (error) {
      await logger.error('ResultsPage setup failed', error);
      throw error;
    }
  });

  afterEach(async () => {
    try {
      await logger.test('ResultsPage', 'Cleaning up test environment');
    } catch (error) {
      await logger.error('ResultsPage cleanup failed', error);
    }
  });

  describe('Rendering', () => {
    test('displays winning movie information correctly', async () => {
      try {
        await logger.test('ResultsPage', 'Testing winner display');
        renderWithProviders(<ResultsPage />);
        
        await waitFor(() => {
          expect(screen.getByText(mockWinningMovie.title)).toBeInTheDocument();
          expect(screen.getByText(mockWinningMovie.year.toString())).toBeInTheDocument();
          expect(screen.getByText(mockWinningMovie.summary)).toBeInTheDocument();
          expect(screen.getByText(/action, adventure/i)).toBeInTheDocument();
        });
        
        await logger.test('ResultsPage', 'Winner display test passed');
      } catch (error) {
        await logger.error('Winner display test failed', error);
        throw error;
      }
    });

    test('displays congratulatory message', async () => {
      try {
        await logger.test('ResultsPage', 'Testing congratulatory message');
        renderWithProviders(<ResultsPage />);
        
        expect(screen.getByText(/we have a winner/i)).toBeInTheDocument();
        
        await logger.test('ResultsPage', 'Congratulatory message test passed');
      } catch (error) {
        await logger.error('Congratulatory message test failed', error);
        throw error;
      }
    });
  });

  describe('Plex Integration', () => {
    test('displays Plex streaming link', async () => {
      try {
        await logger.test('ResultsPage', 'Testing Plex link');
        renderWithProviders(<ResultsPage />);
        
        await waitFor(() => {
          const plexLink = screen.getByRole('link', { name: /watch on plex/i });
          expect(plexLink).toHaveAttribute('href', mockWinningMovie.plexUrl);
        });
        
        await logger.test('ResultsPage', 'Plex link test passed');
      } catch (error) {
        await logger.error('Plex link test failed', error);
        throw error;
      }
    });

    test('handles Plex URL generation failure', async () => {
      try {
        await logger.test('ResultsPage', 'Testing Plex URL failure');
        vi.spyOn(plexService, 'getStreamingUrl').mockRejectedValue(new Error('Failed to get URL'));
        
        renderWithProviders(<ResultsPage />);
        
        await waitFor(() => {
          expect(screen.getByText(/unable to generate plex link/i)).toBeInTheDocument();
        });
        
        await logger.test('ResultsPage', 'Plex URL failure test passed');
      } catch (error) {
        await logger.error('Plex URL failure test failed', error);
        throw error;
      }
    });
  });

  describe('Navigation', () => {
    test('provides option to start new session', async () => {
      try {
        await logger.test('ResultsPage', 'Testing new session option');
        const navigate = vi.fn();
        vi.mock('react-router-dom', () => ({
          ...vi.importActual('react-router-dom'),
          useNavigate: () => navigate
        }));
        
        renderWithProviders(<ResultsPage />);
        
        const newSessionButton = screen.getByRole('button', { name: /start new session/i });
        fireEvent.click(newSessionButton);
        
        expect(navigate).toHaveBeenCalledWith('/');
        expect(sessionStorageMock.clear).toHaveBeenCalled();
        
        await logger.test('ResultsPage', 'New session option test passed');
      } catch (error) {
        await logger.error('New session option test failed', error);
        throw error;
      }
    });
  });

  describe('Error Handling', () => {
    test('handles missing winner data', async () => {
      try {
        await logger.test('ResultsPage', 'Testing missing winner handling');
        sessionStorageMock.removeItem('winningMovie');
        
        renderWithProviders(<ResultsPage />);
        
        expect(screen.getByText(/no winner found/i)).toBeInTheDocument();
        
        await logger.test('ResultsPage', 'Missing winner test passed');
      } catch (error) {
        await logger.error('Missing winner test failed', error);
        throw error;
      }
    });

    test('handles invalid session state', async () => {
      try {
        await logger.test('ResultsPage', 'Testing invalid session state');
        sessionStorageMock.setItem('votingComplete', 'false');
        
        renderWithProviders(<ResultsPage />);
        
        expect(screen.getByText(/voting not complete/i)).toBeInTheDocument();
        
        await logger.test('ResultsPage', 'Invalid session state test passed');
      } catch (error) {
        await logger.error('Invalid session state test failed', error);
        throw error;
      }
    });
  });
});
