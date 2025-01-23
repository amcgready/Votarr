// src/components/auth/PlexAuth.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

const PLEX_CLIENT_ID = process.env.REACT_APP_PLEX_CLIENT_ID;
const PLEX_OAUTH_URL = 'https://app.plex.tv/auth';

const PlexAuth: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { login, error, isLoading, clearError } = useAuth();
  const [authUrl, setAuthUrl] = useState('');

  useEffect(() => {
    // Generate state parameter for security
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem('plexAuthState', state);

    // Construct Plex auth URL
    const params = new URLSearchParams({
      clientID: PLEX_CLIENT_ID!,
      redirectURI: `${window.location.origin}/auth/callback`,
      state,
      forwardUrl: `${window.location.origin}/dashboard`,
    });

    setAuthUrl(`${PLEX_OAUTH_URL}#?${params.toString()}`);

    // Handle OAuth callback
    const plexCode = searchParams.get('code');
    const returnedState = searchParams.get('state');
    
    if (plexCode && returnedState) {
      const savedState = localStorage.getItem('plexAuthState');
      if (returnedState === savedState) {
        handlePlexCallback(plexCode);
      } else {
        console.error('State mismatch in OAuth flow');
      }
    }
  }, [searchParams]);

  const handlePlexCallback = async (code: string) => {
    try {
      const response = await fetch('/api/auth/plex/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate with Plex');
      }

      const { plexToken } = await response.json();
      await login(plexToken);
    } catch (err) {
      console.error('Plex authentication error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Connect with Plex</CardTitle>
          <CardDescription>
            Sign in with your Plex account to start voting
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="text-center space-y-4">
            <img 
              src="/plex-logo.png" 
              alt="Plex Logo" 
              className="h-16 mx-auto"
            />
            <p className="text-gray-400">
              We'll connect to your Plex Media Server to show available content for voting
            </p>
          </div>
        </CardContent>

        <CardFooter>
          <Button 
            className="w-full bg-orange-600 hover:bg-orange-700"
            onClick={() => {
              clearError();
              window.location.href = authUrl;
            }}
          >
            Sign in with Plex
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PlexAuth;
