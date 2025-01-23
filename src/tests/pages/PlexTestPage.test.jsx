// src/tests/pages/PlexTestPage.test.jsx
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PlexTestPage from '../../pages/PlexTestPage';
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

const mockPlexServer = {
  name: 'Test Server',
  address: 'http://test-server:32400',
  version: '1.32.5',
  libraries: [
    { id: '1', name: 'Movies', type: 'movie' },
    { id: '2', name: 'TV Shows', type: 'show' }
  ]
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

describe('PlexTestPage', () => {
  beforeEach(async () => {
    try {
      await logger.test('PlexTestPage', 'Setting up test environment');
      vi.clearAllMocks();
      localStorage.clear();
      
      // Mock Plex service methods
      vi.spyOn(plexService, 'getServerInfo').mockResolvedValue(mockPlexServer);
      vi.spyOn(plexService, 'testConnection').mockResolvedValue(true);
      vi.spyOn(plexService, 'getLibraries').mockResolvedValue(mockPlexServer.libraries);
      
      await logger.test('PlexTestPage', 'Test environment setup complete');
    } catch (error) {
      await logger.error('PlexTestPage setup failed', error);
      throw error;
    }
  });

  afterEach(async () => {
    try {
      await logger.test('PlexTestPage', 'Cleaning up test environment');
    } catch (error) {
      await logger.error('PlexTestPage cleanup failed', error);
    }
  });

  describe('Server Information', () => {
    test('displays server details correctly', async () => {
      try {
        await logger.test('PlexTestPage', 'Testing server info display');
        renderWithProviders(<PlexTestPage />);
        
        await waitFor(() => {
          expect(screen.getByText(mockPlexServer.name)).toBeInTheDocument();
          expect(screen.getByText(mockPlexServer.version)).toBeInTheDocument();
          expect(screen.getByText(mockPlexServer.address)).toBeInTheDocument();
        });
        
        await logger.test('PlexTestPage', 'Server info display test passed');
      } catch (error) {
        await logger.error('Server info display test failed', error);
        throw error;
      }
    });

    test('displays library information', async () => {
      try {
        await logger.test('PlexTestPage', 'Testing library info display');
        renderWithProviders(<PlexTestPage />);
        
        await waitFor(() => {
          mockPlexServer.libraries.forEach(library => {
            expect(screen.getByText(library.name)).toBeInTheDocument();
            expect(screen.getByText(library.type)).toBeInTheDocument();
          });
        });
        
        await logger.test('PlexTestPage', 'Library info display test passed');
      } catch (error) {
        await logger.error('Library info display test failed', error);
        throw error;
      }
    });
  });

  describe('Connection Testing', () => {
    test('performs connection test successfully', async () => {
      try {
        await logger.test('PlexTestPage', 'Testing connection test');
        renderWithProviders(<PlexTestPage />);
        
        const testButton = screen.getByRole('button', { name: /test connection/i });
        fireEvent.click(testButton);
        
        await waitFor(() => {
          expect(screen.getByText(/connection successful/i)).toBeInTheDocument();
        });
        
        await logger.test('PlexTestPage', 'Connection test passed');
      } catch (error) {
        await logger.error('Connection test failed', error);
        throw error;
      }
    });

    test('handles connection test failure', async () => {
      try {
        await logger.test('PlexTestPage', 'Testing connection failure');
        vi.spyOn(plexService, 'testConnection').mockResolvedValue(false);
        
        renderWithProviders(<PlexTestPage />);
        
        const testButton = screen.getByRole('button', { name: /test connection/i });
        fireEvent.click(testButton);
        
        await waitFor(() => {
          expect(screen.getByText(/connection failed/i)).toBeInTheDocument();
        });
        
        await logger.test('PlexTestPage', 'Connection failure test passed');
      } catch (error) {
        await logger.error('Connection failure test failed', error);
        throw error;
      }
    });
  });

  describe('Error Handling', () => {
    test('handles server info fetch failure', async () => {
      try {
        await logger.test('PlexTestPage', 'Testing server info fetch failure');
        vi.spyOn(plexService, 'getServerInfo').mockRejectedValue(new Error('Failed to fetch'));
        
        renderWithProviders(<PlexTestPage />);
        
        await waitFor(() => {
          expect(screen.getByText(/error loading server information/i)).toBeInTheDocument();
        });
        
        await logger.test('PlexTestPage', 'Server info fetch failure test passed');
      } catch (error) {
        await logger.error('Server info fetch failure test failed', error);
        throw error;
      }
    });

    test('handles library fetch failure', async () => {
      try {
        await logger.test('PlexTestPage', 'Testing library fetch failure');
        vi.spyOn(plexService, 'getLibraries').mockRejectedValue(new Error('Failed to fetch'));
        
        renderWithProviders(<PlexTestPage />);
        
        await waitFor(() => {
          expect(screen.getByText(/error loading libraries/i)).toBeInTheDocument();
        });
        
        await logger.test('PlexTestPage', 'Library fetch failure test passed');
      } catch (error) {
        await logger.error('Library fetch failure test failed', error);
        throw error;
      }
    });
  });

  describe('Refresh Functionality', () => {
    test('allows manual refresh of server information', async () => {
      try {
        await logger.test('PlexTestPage', 'Testing manual refresh');
        renderWithProviders(<PlexTestPage />);
        
        const refreshButton = screen.getByRole('button', { name: /refresh/i });
        fireEvent.click(refreshButton);
        
        await waitFor(() => {
          expect(plexService.getServerInfo).toHaveBeenCalledTimes(2); // Initial + refresh
          expect(plexService.getLibraries).toHaveBeenCalledTimes(2);
        });
        
        await logger.test('PlexTestPage', 'Manual refresh test passed');
      } catch (error) {
        await logger.error('Manual refresh test failed', error);
        throw error;
      }
    });
  });
});
