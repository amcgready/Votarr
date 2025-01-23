// src/tests/GenreSelectionPage.test.jsx
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GenreSelectionPage from '../../pages/GenreSelectionPage';
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

const mockGenres = [
  { id: '1', title: 'Action', count: 10 },
  { id: '2', title: 'Comedy', count: 15 },
  { id: '3', title: 'Drama', count: 20 }
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

describe('GenreSelectionPage', () => {
  beforeEach(async () => {
    try {
      await logger.test('GenreSelectionPage', 'Setting up test environment');
      sessionStorage.clear();
      vi.clearAllMocks();
      
      // Mock Plex service methods
      vi.spyOn(plexService, 'fetchLibrarySections').mockResolvedValue([
        { id: '1', title: 'Movies', type: 'movie' }
      ]);
      vi.spyOn(plexService, 'fetchGenres').mockResolvedValue(mockGenres);
    } catch (error) {
      await logger.error('GenreSelectionPage setup failed', error);
      throw error;
    }
  });

  test('renders media type selection', async () => {
    try {
      await logger.test('GenreSelectionPage', 'Testing media type selection render');
      renderWithProviders(<GenreSelectionPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/what would you like to watch/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /movies/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /tv shows/i })).toBeInTheDocument();
      });
      await logger.test('GenreSelectionPage', 'Media type selection render test passed');
    } catch (error) {
      await logger.error('Media type selection render test failed', error);
      throw error;
    }
  });

  test('loads genres when media type is selected', async () => {
    try {
      await logger.test('GenreSelectionPage', 'Testing genre loading');
      renderWithProviders(<GenreSelectionPage />);
      
      const moviesButton = screen.getByRole('button', { name: /movies/i });
      fireEvent.click(moviesButton);
      
      await waitFor(() => {
        mockGenres.forEach(genre => {
          expect(screen.getByText(genre.title)).toBeInTheDocument();
        });
      });
      await logger.test('GenreSelectionPage', 'Genre loading test passed');
    } catch (error) {
      await logger.error('Genre loading test failed', error);
      throw error;
    }
  });

  test('handles genre selection', async () => {
    try {
      await logger.test('GenreSelectionPage', 'Testing genre selection');
      renderWithProviders(<GenreSelectionPage />);
      
      const moviesButton = screen.getByRole('button', { name: /movies/i });
      fireEvent.click(moviesButton);
      
      await waitFor(async () => {
        const actionGenre = screen.getByText('Action');
        fireEvent.click(actionGenre);
        expect(actionGenre).toHaveClass('selected');
      });
      await logger.test('GenreSelectionPage', 'Genre selection test passed');
    } catch (error) {
      await logger.error('Genre selection test failed', error);
      throw error;
    }
  });

  test('handles errors when loading genres', async () => {
    try {
      await logger.test('GenreSelectionPage', 'Testing genre loading error handling');
      vi.spyOn(plexService, 'fetchGenres').mockRejectedValue(new Error('Failed to fetch genres'));
      
      renderWithProviders(<GenreSelectionPage />);
      
      const moviesButton = screen.getByRole('button', { name: /movies/i });
      fireEvent.click(moviesButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load genres/i)).toBeInTheDocument();
      });
      await logger.test('GenreSelectionPage', 'Genre loading error test passed');
    } catch (error) {
      await logger.error('Genre loading error test failed', error);
      throw error;
    }
  });

  test('navigates to voting page when continue is clicked', async () => {
    try {
      await logger.test('GenreSelectionPage', 'Testing navigation to voting page');
      const navigate = vi.fn();
      vi.mock('react-router-dom', () => ({
        ...vi.importActual('react-router-dom'),
        useNavigate: () => navigate
      }));

      renderWithProviders(<GenreSelectionPage />);
      
      const moviesButton = screen.getByRole('button', { name: /movies/i });
      fireEvent.click(moviesButton);
      
      await waitFor(async () => {
        const actionGenre = screen.getByText('Action');
        fireEvent.click(actionGenre);
        
        const continueButton = screen.getByRole('button', { name: /continue/i });
        fireEvent.click(continueButton);
        
        expect(navigate).toHaveBeenCalledWith('/voting');
      });
      await logger.test('GenreSelectionPage', 'Navigation test passed');
    } catch (error) {
      await logger.error('Navigation test failed', error);
      throw error;
    }
  });
});
