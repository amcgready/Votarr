// src/components/SessionInterface.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { Session, User, Vote } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlayCircle, PauseCircle, ThumbsUp } from 'lucide-react';

interface VoteResult {
  mediaId: string;
  votes: number;
}

interface PlaybackState {
  mediaId: string;
  position: number;
  isPlaying: boolean;
}

export default function SessionInterface() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [voteResults, setVoteResults] = useState<VoteResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  const { 
    sendMessage, 
    lastMessage, 
    connectionStatus 
  } = useWebSocket(`/api/ws/session/${sessionId}`);

  const handlePlaybackUpdate = useCallback((newState: PlaybackState) => {
    setPlaybackState(newState);
    sendMessage({
      type: 'session:playbackUpdate',
      payload: newState
    });
  }, [sendMessage]);

  const handleVote = useCallback(async (mediaId: string) => {
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, mediaId })
      });
      
      if (!response.ok) throw new Error('Failed to submit vote');
      
      // Optimistically update UI
      setVoteResults(prev => {
        const updated = [...prev];
        const existingVote = updated.find(v => v.mediaId === mediaId);
        if (existingVote) {
          existingVote.votes++;
        } else {
          updated.push({ mediaId, votes: 1 });
        }
        return updated;
      });
    } catch (err) {
      setError('Failed to submit vote. It will be synced when connection is restored.');
    }
  }, [sessionId]);

  const reconnectSession = useCallback(async () => {
    setIsReconnecting(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/recover`);
      if (!response.ok) throw new Error('Failed to recover session');
      
      const data = await response.json();
      setSession(data.session);
      setParticipants(data.participants);
      setPlaybackState(data.playbackState);
      setVoteResults(data.voteResults);
      setError(null);
    } catch (err) {
      setError('Unable to reconnect to session. Retrying...');
      setTimeout(reconnectSession, 5000);
    } finally {
      setIsReconnecting(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (lastMessage) {
      const message = JSON.parse(lastMessage.data);
      switch (message.type) {
        case 'session:playbackUpdate':
          setPlaybackState(message.payload);
          break;
        case 'session:voteResults':
          setVoteResults(message.payload.results);
          break;
        case 'session:userJoined':
        case 'session:userLeft':
          setParticipants(message.payload.participants);
          break;
        case 'session:error':
          setError(message.payload.message);
          break;
      }
    }
  }, [lastMessage]);

  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      setError('Connection lost. Attempting to reconnect...');
      reconnectSession();
    }
  }, [connectionStatus, reconnectSession]);

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Progress />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{session.name}</span>
            {isReconnecting && <Progress className="w-24" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Playback Controls */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Now Playing</h3>
              {playbackState && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePlaybackUpdate({
                        ...playbackState,
                        isPlaying: !playbackState.isPlaying
                      })}
                    >
                      {playbackState.isPlaying ? <PauseCircle /> : <PlayCircle />}
                    </Button>
                    <Progress value={(playbackState.position / 100) * 100} className="flex-1" />
                  </div>
                </div>
              )}
            </div>

            {/* Vote Results */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Current Votes</h3>
              <div className="space-y-2">
                {voteResults.map((result) => (
                  <div key={result.mediaId} className="flex items-center justify-between">
                    <span>{result.mediaId}</span>
                    <div className="flex items-center space-x-2">
                      <span>{result.votes}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleVote(result.mediaId)}
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Participants</h3>
            <div className="flex flex-wrap gap-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="px-2 py-1 bg-secondary rounded-full text-sm"
                >
                  {participant.name}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
