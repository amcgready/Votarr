// src/tests/LandingPage.test.jsx
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LandingPage from '../../pages/LandingPage';
import { PlexProvider } from '../../contexts/PlexContext';
import { BrowserRouter } from 'react-router-dom';
import logger from '../../utils/logger';

// Mock the toast hook
vi.mock('@/components/ui/use-toast', () => ({
 useToast: () => ({
   toast: vi.fn()
 })
}));

const renderWithProviders = (component) => {
 return render(
   <BrowserRouter>
     <PlexProvider>
       {component}
     </PlexProvider>
   </BrowserRouter>
 );
};

describe('LandingPage', () => {
 beforeEach(async () => {
   try {
     await logger.test('LandingPage', 'Setting up test environment');
     sessionStorage.clear();
     vi.clearAllMocks();
     await logger.test('LandingPage', 'Test environment setup complete');
   } catch (error) {
     await logger.error('LandingPage setup failed', error);
     throw error;
   }
 });

 test('renders logo and user count selection', async () => {
   try {
     await logger.test('LandingPage', 'Testing initial render');
     renderWithProviders(<LandingPage />);
     
     expect(screen.getByAltText(/MovieMatcher/i)).toBeInTheDocument();
     expect(screen.getByRole('combobox')).toBeInTheDocument();
     
     await logger.test('LandingPage', 'Initial render test passed');
   } catch (error) {
     await logger.error('Initial render test failed', error);
     throw error;
   }
 });

 test('handles user count selection', async () => {
   try {
     await logger.test('LandingPage', 'Testing user count selection');
     renderWithProviders(<LandingPage />);
     
     const select = screen.getByRole('combobox');
     fireEvent.change(select, { target: { value: '2' } });
     
     await waitFor(() => {
       expect(sessionStorage.getItem('userCount')).toBe('2');
     });
     
     await logger.test('LandingPage', 'User count selection test passed');
   } catch (error) {
     await logger.error('User count selection test failed', error);
     throw error;
   }
 });

 test('initiates Plex login when button clicked', async () => {
   try {
     await logger.test('LandingPage', 'Testing Plex login initiation');
     renderWithProviders(<LandingPage />);
     
     const loginButton = screen.getByRole('button', { name: /continue with plex/i });
     fireEvent.click(loginButton);
     
     await waitFor(() => {
       expect(window.location.href).toContain('plex.tv/auth');
     });
     
     await logger.test('LandingPage', 'Plex login initiation test passed');
   } catch (error) {
     await logger.error('Plex login initiation test failed', error);
     throw error;
   }
 });

 test('displays error message when login fails', async () => {
   try {
     await logger.test('LandingPage', 'Testing login failure handling');
     // Suppress console error but log it to our logger
     vi.spyOn(console, 'error').mockImplementation((error) => {
       logger.error('Console error during test:', { consoleError: error });
     });
     
     renderWithProviders(<LandingPage />);
     
     const loginButton = screen.getByRole('button', { name: /continue with plex/i });
     fireEvent.click(loginButton);
     
     await waitFor(() => {
       expect(screen.getByText(/failed to connect/i)).toBeInTheDocument();
     });
     
     await logger.test('LandingPage', 'Login failure test passed');
   } catch (error) {
     await logger.error('Login failure test failed', error);
     throw error;
   }
 });

 // Additional error cases
 test('handles network errors during login', async () => {
   try {
     await logger.test('LandingPage', 'Testing network error handling');
     // Mock a network error
     global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));
     
     renderWithProviders(<LandingPage />);
     
     const loginButton = screen.getByRole('button', { name: /continue with plex/i });
     fireEvent.click(loginButton);
     
     await waitFor(() => {
       expect(screen.getByText(/unable to connect/i)).toBeInTheDocument();
     });
     
     await logger.test('LandingPage', 'Network error test passed');
   } catch (error) {
     await logger.error('Network error test failed', error);
     throw error;
   }
 });

 test('handles invalid user count selection', async () => {
   try {
     await logger.test('LandingPage', 'Testing invalid user count handling');
     renderWithProviders(<LandingPage />);
     
     const select = screen.getByRole('combobox');
     fireEvent.change(select, { target: { value: '-1' } }); // Invalid value
     
     await waitFor(() => {
       expect(screen.getByText(/invalid user count/i)).toBeInTheDocument();
     });
     
     await logger.test('LandingPage', 'Invalid user count test passed');
   } catch (error) {
     await logger.error('Invalid user count test failed', error);
     throw error;
   }
 });
});
