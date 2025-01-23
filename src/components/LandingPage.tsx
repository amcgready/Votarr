import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, Play, Users, Timer } from 'lucide-react';

const LandingPage = () => {
  const [sessionCode, setSessionCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCreateSession = () => {
    navigate('/create-session');
  };

  const handleJoinSession = (e) => {
    e.preventDefault();
    if (!sessionCode.trim()) {
      setError('Please enter a session code');
      return;
    }
    navigate(`/session/${sessionCode}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4">Votarr</h1>
          <p className="text-xl text-gray-300">Decide what to watch, together.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-2xl">Create Session</CardTitle>
              <CardDescription>Start a new voting session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Users className="h-6 w-6 text-blue-400" />
                  <p>Invite friends to join</p>
                </div>
                <div className="flex items-center gap-4">
                  <Play className="h-6 w-6 text-blue-400" />
                  <p>Browse your Plex library</p>
                </div>
                <div className="flex items-center gap-4">
                  <Timer className="h-6 w-6 text-blue-400" />
                  <p>Vote in real-time</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleCreateSession}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Create New Session
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-2xl">Join Session</CardTitle>
              <CardDescription>Enter a session code to join</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinSession} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter session code"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value)}
                  className="bg-gray-700 border-gray-600"
                />
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </form>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleJoinSession}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Join Session
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
