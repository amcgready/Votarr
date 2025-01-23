// src/tests/components/ServerSelection.test.jsx
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ServerSelection from '../../components/ServerSelection';
import { PlexContext } from '../../contexts/PlexContext';
import { plexService } from '../../services/plexService';
import logger from '../../utils/logger';

// Mock the UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }) => open ? <div role="dialog">{children}</div> : null,
  DialogContent: ({ children, className }) => (
    <div data-testid="dialog-content" className={className}>
      {children}
    </div>
  ),
  DialogHeader: ({ children }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }) => (
    <div data-testid="dialog-title" role="heading">
      {children}
    </div>
  ),
  DialogDescription: ({ children }) => (
    <div data-testid="dialog-description">{children}</div>
  )
}));

vi.mock('@/components/ui/radio-group', () => ({
  RadioGroup: ({ children, onValueChange }) => (
    <div 
      role="radiogroup" 
      data-testid="radio-group"
      onChange={e => onValueChange(e.target.value)}
    >
      {children}
    </div>
  ),
  RadioGroupItem: ({ value, children, id, className }) => (
    <input 
      type="radio" 
      value={value} 
      id={id}
      className={className}
      data-testid={`radio-item-${value}`}
    >
      {children}
    </input>
  )
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }) => (
    <div data-testid="scroll-area" className={className}>
      {children}
    </div>
  )
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-testid="button"
    >
      {children}
    </button>
  )
}));

// Mock the toast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const mockServers = [
  {
    name: 'Server 1',
    clientIdentifier: 'server1',
    owned: true,
    connections: [{ uri: 'http://server1:32400', local: true }]
  },
  {
    name: 'Server 2',
    clientIdentifier: 'server2',
    owned: false,
    connections: [{ uri: 'http://server2:32400', local: false }]
  }
];

const createWrapper = (props) => {
  const mockPlexContext = {
    selectServer: vi.fn(),
    token: 'mock-token',
    isAuthenticated: true,
    loading: false,
    error: null
  };

  return (
    <BrowserRouter>
      <PlexContext.Provider value={mockPlexContext}>
        <ServerSelection {...props} />
      </PlexContext.Provider>
    </BrowserRouter>
  );
};

describe('ServerSelection Component', () => {
  const mockProps = {
    open: true,
    onOpenChange: vi.fn()
  };

  beforeEach(async () => {
    try {
      await logger.test('ServerSelection', 'Setting up test environment');
      vi.clearAllMocks();
      vi.spyOn(plexService, 'getServers').mockResolvedValue(mockServers);
      vi.spyOn(plexService, 'initialize').mockImplementation(() => {});
      vi.spyOn(plexService, 'fetchLibrarySections').mockResolvedValue([]);
      await logger.test('ServerSelection', 'Test environment setup complete');
    } catch (error) {
      await logger.error('ServerSelection setup failed', error);
      throw error;
    }
  });

  afterEach(async () => {
    try {
      await logger.test('ServerSelection', 'Cleaning up test environment');
      vi.clearAllMocks();
      sessionStorage.clear();
    } catch (error) {
      await logger.error('ServerSelection cleanup failed', error);
    }
  });

  describe('Rendering', () => {
    test('displays server list correctly', async () => {
      try {
        await logger.test('ServerSelection', 'Testing server list render');
        render(createWrapper(mockProps));

        await waitFor(() => {
          mockServers.forEach(server => {
            expect(screen.getByText(server.name)).toBeInTheDocument();
            expect(screen.getByText(server.owned ? 'Owner' : 'Shared with you')).toBeInTheDocument();
          });
          expect(screen.getByTestId('scroll-area')).toBeInTheDocument();
          expect(screen.getByRole('radiogroup')).toBeInTheDocument();
        });
        
        await logger.test('ServerSelection', 'Server list render passed');
      } catch (error) {
        await logger.error('Server list render failed', error);
        throw error;
      }
    });

    test('shows loading state while fetching servers', async () => {
      try {
        await logger.test('ServerSelection', 'Testing loading state');
        vi.spyOn(plexService, 'getServers').mockImplementation(
          () => new Promise(resolve => setTimeout(() => resolve(mockServers), 100))
        );

        render(createWrapper(mockProps));
        
        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

        await logger.test('ServerSelection', 'Loading state test passed');
      } catch (error) {
        await logger.error('Loading state test failed', error);
        throw error;
      }
    });
  });

  describe('Server Selection', () => {
    test('handles server selection correctly', async () => {
      try {
        await logger.test('ServerSelection', 'Testing server selection');
        render(createWrapper(mockProps));

        await waitFor(() => {
          const serverRadio = screen.getByTestId('radio-item-server1');
          fireEvent.click(serverRadio);
        });

        const connectButton = screen.getByText('Connect');
        fireEvent.click(connectButton);

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith('/genre-selection');
          expect(mockProps.onOpenChange).toHaveBeenCalledWith(false);
          expect(plexService.initialize).toHaveBeenCalled();
        });
        
        await logger.test('ServerSelection', 'Server selection test passed');
      } catch (error) {
        await logger.error('Server selection test failed', error);
        throw error;
      }
    });

    test('prioritizes local connections', async () => {
      try {
        await logger.test('ServerSelection', 'Testing connection priority');
        const serversWithMultipleConnections = [{
          name: 'Multi Server',
          clientIdentifier: 'multi',
          owned: true,
          connections: [
            { uri: 'http://remote:32400', local: false },
            { uri: 'http://local:32400', local: true }
          ]
        }];

        vi.spyOn(plexService, 'getServers').mockResolvedValue(serversWithMultipleConnections);

        render(createWrapper(mockProps));

        await waitFor(() => {
          const serverRadio = screen.getByTestId('radio-item-multi');
          fireEvent.click(serverRadio);
        });

        const connectButton = screen.getByText('Connect');
        fireEvent.click(connectButton);

        await waitFor(() => {
          expect(plexService.initialize).toHaveBeenCalledWith(
            'http://local:32400',
            'mock-token',
            'multi'
          );
        });
        
        await logger.test('ServerSelection', 'Connection priority test passed');
      } catch (error) {
        await logger.error('Connection priority test failed', error);
        throw error;
      }
    });
  });

  describe('Error Handling', () => {
    test('displays error message when server fetch fails', async () => {
      try {
        await logger.test('ServerSelection', 'Testing error handling');
        vi.spyOn(plexService, 'getServers').mockRejectedValue(new Error('Failed to fetch'));

        render(createWrapper(mockProps));

        await waitFor(() => {
          expect(screen.getByText('Failed to fetch Plex servers. Please try again.')).toBeInTheDocument();
          expect(screen.getByTestId('error-message')).toBeInTheDocument();
          expect(screen.getByText('Retry')).toBeInTheDocument();
        });
        
        await logger.test('ServerSelection', 'Error handling test passed');
      } catch (error) {
        await logger.error('Error handling test failed', error);
        throw error;
      }
    });

    test('handles empty server list', async () => {
      try {
        await logger.test('ServerSelection', 'Testing empty server list');
        vi.spyOn(plexService, 'getServers').mockResolvedValue([]);

        render(createWrapper(mockProps));

        await waitFor(() => {
          expect(screen.getByTestId('radio-group')).toBeEmptyDOMElement();
          expect(screen.getByText('No servers available')).toBeInTheDocument();
        });
        
        await logger.test('ServerSelection', 'Empty server list test passed');
      } catch (error) {
        await logger.error('Empty server list test failed', error);
        throw error;
      }
    });
  });

  describe('Accessibility', () => {
    test('maintains dialog accessibility attributes', async () => {
      try {
        await logger.test('ServerSelection', 'Testing accessibility');
        render(createWrapper(mockProps));

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
          expect(screen.getByRole('heading', { name: /select plex server/i })).toBeInTheDocument();
          expect(screen.getByRole('radiogroup')).toBeInTheDocument();
        });
        
        await logger.test('ServerSelection', 'Accessibility test passed');
      } catch (error) {
        await logger.error('Accessibility test failed', error);
        throw error;
      }
    });
  });
});
