// src/components/session/__tests__/CreateSession.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateSession } from '../CreateSession';
import { SessionService } from '../../../services/sessionService';
import { AuthContext } from '../../auth/AuthContext';

jest.mock('../../../services/sessionService');

describe('CreateSession Component', () => {
  const mockUser = {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com'
  };

  const mockAuthContext = {
    user: mockUser,
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the create session form', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <CreateSession />
      </AuthContext.Provider>
    );

    expect(screen.getByText(/create new session/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/session name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  it('handles session creation successfully', async () => {
    const mockCreateSession = jest.fn().mockResolvedValue({
      id: 'test-session-id',
      name: 'Test Session',
      hostId: mockUser.id
    });

    (SessionService as jest.Mocked<typeof SessionService>).prototype.createSession = mockCreateSession;

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <CreateSession />
      </AuthContext.Provider>
    );

    fireEvent.change(screen.getByLabelText(/session name/i), {
      target: { value: 'Test Session' }
    });

    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(mockCreateSession).toHaveBeenCalledWith({
        name: 'Test Session',
        hostId: mockUser.id
      });
    });
  });

  it('displays error message on session creation failure', async () => {
    const mockError = new Error('Failed to create session');
    const mockCreateSession = jest.fn().mockRejectedValue(mockError);

    (SessionService as jest.Mocked<typeof SessionService>).prototype.createSession = mockCreateSession;

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <CreateSession />
      </AuthContext.Provider>
    );

    fireEvent.change(screen.getByLabelText(/session name/i), {
      target: { value: 'Test Session' }
    });

    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to create session/i)).toBeInTheDocument();
    });
  });
});
