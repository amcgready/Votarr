// src/tests/plex.test.js
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PlexProvider } from '../contexts/PlexContext';
import ServerSelection from '../components/ServerSelection';
import { plexService } from '../services/plexService';
import logger from '../utils/logger';

// Mock the toast hook
vi.mock('@/components/ui/use-toast', () => ({
 useToast: () => ({
   toast: vi.fn()
 })
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
 useNavigate: () => vi.fn(),
 useLocation: () => ({
   search: '?code=test_code'
 })
}));

// Mock localStorage
const localStorageMock = (() => {
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

Object.defineProperty(window, 'localStorage', {
 value: localStorageMock
});

describe('Plex Integration', () => {
 beforeEach(async () => {
   try {
     await logger.test('Plex Integration', 'Setting up test environment');
     localStorageMock.clear();
     vi.clearAllMocks();
     await logger.test('Plex Integration', 'Test environment setup complete');
   } catch (error) {
     await logger.error('Plex Integration setup failed', error);
     throw error;
   }
 });

 afterEach(async () => {
   try {
     await logger.test('Plex Integration', 'Cleaning up test environment');
   } catch (error) {
     await logger.error('Plex Integration cleanup failed', error);
   }
 });

 describe('Authentication Flow', () => {
   test('isAuthenticated returns correct state', async () => {
     try {
       await logger.test('Authentication', 'Testing authentication state check');
       expect(plexService.isAuthenticated()).toBe(false);
       
       localStorageMock.setItem('plexToken', 'test_token');
       expect(plexService.isAuthenticated()).toBe(true);
       
       await logger.test('Authentication', 'Authentication state check passed');
     } catch (error) {
       await logger.error('Authentication state check failed', error);
       throw error;
     }
   });

   test('initiateAuth sets up auth process correctly', async () => {
     try {
       await logger.test('Authentication', 'Testing auth initialization');
       const windowLocationSpy = vi.spyOn(window.location, 'href', 'set');
       
       await plexService.initiateAuth();
       
       expect(windowLocationSpy).toHaveBeenCalledWith(
         expect.stringContaining('app.plex.tv/auth')
       );
       expect(localStorageMock.setItem).toHaveBeenCalledWith(
         'plexAuthState',
         expect.any(String)
       );
       
       await logger.test('Authentication', 'Auth initialization passed');
     } catch (error) {
       await logger.error('Auth initialization failed', error);
       throw error;
     }
   });

   test('handleCallback processes auth token correctly', async () => {
     try {
       await logger.test('Authentication', 'Testing callback handling');
       const mockToken = 'test_access_token';
       global.fetch = vi.fn().mockResolvedValueOnce({
         ok: true,
         json: () => Promise.resolve({ access_token: mockToken })
       });

       await plexService.handleCallback('test_code');

       expect(localStorageMock.setItem).toHaveBeenCalledWith(
         'plexToken',
         mockToken
       );
       
       await logger.test('Authentication', 'Callback handling passed');
     } catch (error) {
       await logger.error('Callback handling failed', error);
       throw error;
     }
   });
 });

 describe('Server Operations', () => {
   beforeEach(async () => {
     try {
       await logger.test('Server Operations', 'Setting up server test environment');
       localStorageMock.setItem('plexToken', 'test_token');
     } catch (error) {
       await logger.error('Server test setup failed', error);
       throw error;
     }
   });

   test('getServers returns filtered server list', async () => {
     try {
       await logger.test('Server Operations', 'Testing server list retrieval');
       const mockServers = [
         { 
           provides: ['server'], 
           owned: true,
           name: 'Test Server'
         },
         { 
           provides: ['player'], 
           owned: true,
           name: 'Not a Server'
         }
       ];

       global.fetch = vi.fn().mockResolvedValueOnce({
         ok: true,
         json: () => Promise.resolve(mockServers)
       });

       const servers = await plexService.getServers();
       expect(servers).toHaveLength(1);
       expect(servers[0].name).toBe('Test Server');
       
       await logger.test('Server Operations', 'Server list retrieval passed');
     } catch (error) {
       await logger.error('Server list retrieval failed', error);
       throw error;
     }
   });

   test('initialize sets up server configuration', async () => {
     try {
       await logger.test('Server Operations', 'Testing server initialization');
       const serverUrl = 'http://test-server.com';
       const token = 'test_token';
       const serverId = 'test_server_id';

       plexService.initialize(serverUrl, token, serverId);

       expect(localStorageMock.setItem).toHaveBeenCalledWith('plexServerUrl', serverUrl);
       expect(localStorageMock.setItem).toHaveBeenCalledWith('plexServerId', serverId);
       expect(plexService.baseUrl).toBe(serverUrl);
       expect(plexService.serverId).toBe(serverId);
       
       await logger.test('Server Operations', 'Server initialization passed');
     } catch (error) {
       await logger.error('Server initialization failed', error);
       throw error;
     }
   });
 });

 describe('Error Handling', () => {
   test('handles auth errors correctly', async () => {
     try {
       await logger.test('Error Handling', 'Testing auth error handling');
       global.fetch = vi.fn().mockRejectedValueOnce(new Error('Auth failed'));
       
       await expect(plexService.handleCallback('invalid_code'))
         .rejects
         .toThrow('Authentication failed');
       
       await logger.test('Error Handling', 'Auth error handling passed');
     } catch (error) {
       await logger.error('Auth error handling failed', error);
       throw error;
     }
   });

   test('handles API errors correctly', async () => {
     try {
       await logger.test('Error Handling', 'Testing API error handling');
       localStorageMock.setItem('plexToken', 'test_token');
       global.fetch = vi.fn().mockResolvedValueOnce({
         ok: false,
         status: 500
       });

       await expect(plexService.getUserProfile())
         .rejects
         .toThrow('Failed to fetch user profile');
       
       await logger.test('Error Handling', 'API error handling passed');
     } catch (error) {
       await logger.error('API error handling failed', error);
       throw error;
     }
   });

   test('handles network errors correctly', async () => {
     try {
       await logger.test('Error Handling', 'Testing network error handling');
       localStorageMock.setItem('plexToken', 'test_token');
       global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

       await expect(plexService.getServers())
         .rejects
         .toThrow('Failed to fetch servers');
       
       await logger.test('Error Handling', 'Network error handling passed');
     } catch (error) {
       await logger.error('Network error handling failed', error);
       throw error;
     }
   });

   test('handles retry logic correctly', async () => {
     try {
       await logger.test('Error Handling', 'Testing retry logic');
       const fetch = vi.fn()
         .mockRejectedValueOnce(new Error('First attempt failed'))
         .mockRejectedValueOnce(new Error('Second attempt failed'))
         .mockResolvedValueOnce({
           ok: true,
           json: () => Promise.resolve({ data: 'success' })
         });
         
       global.fetch = fetch;
       
       await plexService.makeRequest('/test-endpoint');
       expect(fetch).toHaveBeenCalledTimes(3);
       
       await logger.test('Error Handling', 'Retry logic handling passed');
     } catch (error) {
       await logger.error('Retry logic handling failed', error);
       throw error;
     }
   });
 });

 describe('Server Selection Component', () => {
   const mockServers = [
     {
       name: 'Test Server',
       clientIdentifier: 'test123',
       owned: true,
       connections: [{ uri: 'http://test-server.com' }]
     }
   ];

   beforeEach(async () => {
     try {
       await logger.test('Server Selection', 'Setting up component test environment');
       localStorageMock.setItem('plexToken', 'test_token');
       vi.spyOn(plexService, 'getServers').mockResolvedValue(mockServers);
     } catch (error) {
       await logger.error('Component test setup failed', error);
       throw error;
     }
   });

   test('renders server selection dialog', async () => {
     try {
       await logger.test('Server Selection', 'Testing dialog render');
       render(
         <PlexProvider>
           <ServerSelection open={true} onOpenChange={() => {}} />
         </PlexProvider>
       );

       await waitFor(() => {
         expect(screen.getByText('Select Plex Server')).toBeInTheDocument();
         expect(screen.getByText('Test Server')).toBeInTheDocument();
       });
       
       await logger.test('Server Selection', 'Dialog render passed');
     } catch (error) {
       await logger.error('Dialog render failed', error);
       throw error;
     }
   });

   test('shows loading state while fetching servers', async () => {
     try {
       await logger.test('Server Selection', 'Testing loading state');
       render(
         <PlexProvider>
           <ServerSelection open={true} onOpenChange={() => {}} />
         </PlexProvider>
       );

       expect(screen.getByRole('progressbar')).toBeInTheDocument();
       
       await logger.test('Server Selection', 'Loading state test passed');
     } catch (error) {
       await logger.error('Loading state test failed', error);
       throw error;
     }
   });
 });
});
