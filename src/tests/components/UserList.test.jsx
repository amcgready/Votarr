// src/tests/components/UserList.test.jsx
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import UserList from '../../components/UserList';
import { RealtimeContext } from '../../contexts/RealtimeContext';
import logger from '../../utils/logger';

// Mock the UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  )
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  )
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }) => (
    <div className={className} data-testid="scroll-area">
      {children}
    </div>
  )
}));

vi.mock('lucide-react', () => ({
  Crown: (props) => <div data-testid="crown-icon" {...props} />,
  CheckCircle2: () => <div data-testid="check-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  User: () => <div data-testid="user-icon" />
}));

describe('UserList Component', () => {
  const mockUsers = [
    { id: '1', username: 'user1' },
    { id: '2', username: 'user2' },
    { id: '3', username: 'user3' }
  ];

  const mockSessionState = {
    status: 'voting',
    votedUsers: ['1', '2']
  };

  const mockContextValue = {
    connectedUsers: mockUsers,
    sessionState: mockSessionState,
    isHost: true,
    wsConnected: true,
    error: null
  };

  const renderWithContext = (contextOverrides = {}) => {
    const value = {
      ...mockContextValue,
      ...contextOverrides
    };

    return render(
      <RealtimeContext.Provider value={value}>
        <UserList />
      </RealtimeContext.Provider>
    );
  };

  beforeEach(async () => {
    try {
      await logger.test('UserList', 'Setting up test environment');
      vi.clearAllMocks();
    } catch (error) {
      await logger.error('UserList setup failed', error);
      throw error;
    }
  });

  afterEach(async () => {
    try {
      await logger.test('UserList', 'Cleaning up test environment');
    } catch (error) {
      await logger.error('UserList cleanup failed', error);
    }
  });

  describe('Rendering', () => {
    test('renders all users correctly', async () => {
      try {
        await logger.test('UserList', 'Testing basic render');
        renderWithContext();

        expect(screen.getByTestId('card')).toBeInTheDocument();
        expect(screen.getByTestId('scroll-area')).toBeInTheDocument();

        mockUsers.forEach(user => {
          const userElement = screen.getByTestId(`user-${user.id}`);
          expect(userElement).toBeInTheDocument();
          expect(within(userElement).getByText(user.username)).toBeInTheDocument();
          expect(screen.getByTestId(`user-status-${user.id}`)).toBeInTheDocument();
        });

        // Verify total users count
        expect(screen.getByText(`${mockUsers.length} users in session`)).toBeInTheDocument();

        await logger.test('UserList', 'Basic render passed');
      } catch (error) {
        await logger.error('UserList render failed', error);
        throw error;
      }
    });

    test('displays host indicator correctly', async () => {
      try {
        await logger.test('UserList', 'Testing host indicator');
        renderWithContext();

        // First user should have host crown
        expect(screen.getByTestId('host-indicator-1')).toBeInTheDocument();
        // Other users should not have host crown
        expect(screen.queryByTestId('host-indicator-2')).not.toBeInTheDocument();
        expect(screen.queryByTestId('host-indicator-3')).not.toBeInTheDocument();

        await logger.test('UserList', 'Host indicator passed');
      } catch (error) {
        await logger.error('UserList host indicator failed', error);
        throw error;
      }
    });

    test('renders empty state correctly', async () => {
      try {
        await logger.test('UserList', 'Testing empty state');
        renderWithContext({ connectedUsers: [] });

        expect(screen.getByText('No users in session')).toBeInTheDocument();
        expect(screen.getByText('0 users in session')).toBeInTheDocument();
        expect(screen.getByTestId('user-icon')).toBeInTheDocument();

        await logger.test('UserList', 'Empty state passed');
      } catch (error) {
        await logger.error('UserList empty state failed', error);
        throw error;
      }
    });
  });

  describe('Status Updates', () => {
    test('reflects user status changes', async () => {
      try {
        await logger.test('UserList', 'Testing status updates');
        const { rerender } = renderWithContext();

        // Check initial states
        expect(within(screen.getByTestId('user-status-1')).getByText('Voted')).toBeInTheDocument();
        expect(within(screen.getByTestId('user-status-3')).getByText('Waiting')).toBeInTheDocument();

        // Update session state
        const updatedSessionState = {
          ...mockSessionState,
          votedUsers: ['1', '2', '3']
        };

        rerender(
          <RealtimeContext.Provider value={{
            ...mockContextValue,
            sessionState: updatedSessionState
          }}>
            <UserList />
          </RealtimeContext.Provider>
        );

        // Verify updated states
        expect(within(screen.getByTestId('user-status-3')).getByText('Voted')).toBeInTheDocument();
        expect(screen.getByTestId('check-icon')).toBeInTheDocument();

        await logger.test('UserList', 'Status updates passed');
      } catch (error) {
        await logger.error('UserList status updates failed', error);
        throw error;
      }
    });
  });

  describe('Accessibility', () => {
    test('has correct ARIA labels', async () => {
      try {
        await logger.test('UserList', 'Testing accessibility');
        renderWithContext();

        expect(screen.getByRole('list')).toHaveAttribute('aria-label', 'Session Users');
        mockUsers.forEach(user => {
          const userElement = screen.getByTestId(`user-${user.id}`);
          expect(userElement).toHaveAttribute('role', 'listitem');
        });

        await logger.test('UserList', 'Accessibility passed');
      } catch (error) {
        await logger.error('UserList accessibility failed', error);
        throw error;
      }
    });
  });
});
