// src/tests/pages/PlexAuthCallback.test.jsx
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '../utils/test-utils';
import PlexAuthCallback from '../../pages/PlexAuthCallback';
import { plexService } from '../../services/plexService';
import logger from '../../utils/logger';

// Mock the toast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock the ServerSelection component
vi.mock('@/components/ServerSelection', () => ({
  default: ({ open, onOpenChange }) => (
    <div data-testid="server-selection" data-open={open}>
      <button onClick={() => onOpenChange(false)}>Close</button>
    </div>
  )
}));

describe('PlexAuthCallback', () => {
  const mockNavigate = vi.fn();

  beforeEach(async () => {
    try {
      await logger.test('PlexAuthCallback', 'Setting up test environment');
      vi.clearAllMocks();
      localStorage.clear();
      sessionStorage.clear();
      
      // Mock Plex service methods
      vi.spyOn(plexService, 'handleCallback').mockResolvedValue({ success: true });
      
      await logger.test('PlexAuthCallback', 'Test environment setup complete');
    } catch (error) {
      await logger.error('PlexAuthCallback setup failed', error);
      throw error;
    }
  });

  afterEach(async () => {
    try {
      await logger.test('PlexAuthCallback', 'Cleaning up test environment');
    } catch (error) {
      await logger.error('PlexAuthCallback cleanup failed', error);
    }
  });

  describe('Authentication Flow', () => {
    test('handles successful authentication', async () => {
      try {
        await logger.test('PlexAuthCallback', 'Testing successful auth');
        render(<PlexAuthCallback />, {
          route: '/auth/callback?code=test_auth_code',
          mocks: { navigate: mockNavigate }
        });
        
        // Check loading state
        expect(screen.getByText(/completing login/i)).toBeInTheDocument();
        
        await waitFor(() => {
          expect(plexService.handleCallback).toHaveBeenCalledWith('test_auth_code');
          expect(screen.getByTestId('server-selection')).toHaveAttribute('data-open', 'true');
        });
        
        await logger.test('PlexAuthCallback', 'Successful auth test passed');
      } catch (error) {
        await logger.error('Successful auth test failed', error);
        throw error;
      }
    });

    test('handles authentication failure', async () => {
      try {
        await logger.test('PlexAuthCallback', 'Testing auth failure');
        vi.spyOn(plexService, 'handleCallback').mockRejectedValue(new Error('Auth failed'));
        
        render(<PlexAuthCallback />, {
          route: '/auth/callback?code=test_auth_code',
          mocks: { navigate: mockNavigate }
        });
        
        await waitFor(() => {
          expect(screen.getByText(/authentication error/i)).toBeInTheDocument();
        });
        
        // Verify navigation after error
        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith('/');
        });
        
        await logger.test('PlexAuthCallback', 'Auth failure test passed');
      } catch (error) {
        await logger.error('Auth failure test failed', error);
        throw error;
      }
    });

    test('handles missing auth code', async () => {
      try {
        await logger.test('PlexAuthCallback', 'Testing missing auth code');
        render(<PlexAuthCallback />, {
          route: '/auth/callback',
          mocks: { navigate: mockNavigate }
        });
        
        await waitFor(() => {
          expect(screen.getByText(/no authentication code provided/i)).toBeInTheDocument();
        });
        
        await logger.test('PlexAuthCallback', 'Missing auth code test passed');
      } catch (error) {
        await logger.error('Missing auth code test failed', error);
        throw error;
      }
    });
  });

  describe('Loading State', () => {
    test('displays loading state during authentication', async () => {
      try {
        await logger.test('PlexAuthCallback', 'Testing loading state');
        vi.spyOn(plexService, 'handleCallback').mockImplementation(
          () => new Promise(resolve => setTimeout(resolve, 100))
        );
        
        render(<PlexAuthCallback />, {
          route: '/auth/callback?code=test_auth_code',
          mocks: { navigate: mockNavigate }
        });
        
        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByText(/completing login/i)).toBeInTheDocument();
        
        await logger.test('PlexAuthCallback', 'Loading state test passed');
      } catch (error) {
        await logger.error('Loading state test failed', error);
        throw error;
      }
    });
  });

  describe('Server Selection', () => {
    test('handles server selection completion', async () => {
      try {
        await logger.test('PlexAuthCallback', 'Testing server selection completion');
        
        // Mock sessionStorage
        Object.defineProperty(window, 'sessionStorage', {
          value: {
            getItem: vi.fn().mockReturnValue('test-server-id'),
          },
        });

        render(<PlexAuthCallback />, {
          route: '/auth/callback?code=test_auth_code',
          mocks: { navigate: mockNavigate }
        });

        await waitFor(() => {
          expect(screen.getByTestId('server-selection')).toBeInTheDocument();
        });

        // Simulate server selection completion
        fireEvent.click(screen.getByText(/close/i));

        expect(mockNavigate).toHaveBeenCalledWith('/genre-selection');
        
        await logger.test('PlexAuthCallback', 'Server selection completion test passed');
      } catch (error) {
        await logger.error('Server selection completion test failed', error);
        throw error;
      }
    });

    test('handles missing server selection', async () => {
      try {
        await logger.test('PlexAuthCallback', 'Testing missing server selection');
        
        // Mock empty sessionStorage
        Object.defineProperty(window, 'sessionStorage', {
          value: {
            getItem: vi.fn().mockReturnValue(null),
          },
        });

        render(<PlexAuthCallback />, {
          route: '/auth/callback?code=test_auth_code',
          mocks: { navigate: mockNavigate }
        });

        await waitFor(() => {
          expect(screen.getByTestId('server-selection')).toBeInTheDocument();
        });

        // Simulate closing without selection
        fireEvent.click(screen.getByText(/close/i));

        expect(mockNavigate).toHaveBeenCalledWith('/');
        
        await logger.test('PlexAuthCallback', 'Missing server selection test passed');
      } catch (error) {
        await logger.error('Missing server selection test failed', error);
        throw error;
      }
    });
  });
});
