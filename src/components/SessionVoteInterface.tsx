// src/components/SessionVoteInterface.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { Session, Vote, SessionState } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ThumbsUp, Award, Timer, Users } from 'lucide-react';

interface VoteResult {
  mediaId: string;
  title: string;
  votes: number;
  voters: string[];
}

interface SessionResults {
  winnerId: string;
  winningTitle: string;
  totalVotes: number;
  results: VoteResult[];
}

export default function SessionVoteInterface() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [results, setResults] = useState<SessionResults | null>(null);
  const [userVotes, setUserVotes] = useState<Vote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { sendMessage, lastMessage, connectionStatus } = useWebSocket(
    `/api/ws/session/${sessionId}`
  );

  const loadSession = useCallback(async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (!response.ok) throw new Error('Failed to load session');
      
      const data = await response.json();
      setSession(data);
      
      // Load user votes
      const votesResponse = await fetch(`/api/votes/user/${sessionId}`);
      if (votesResponse.ok) {
        setUserVotes(await votesResponse.json());
      }
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load session data');
      setLoading(false);
    }
  }, [sessionId]);

  const handleVote = useCallback(async (mediaId: string, mediaTitle: string) => {
    try {
      if (!session) return;
      
      if (userVotes.length >= session.maxVotesPerUser) {
        setError(`Maximum ${session.maxVotesPerUser} votes allowed`);
        return;
      }

      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, mediaId, mediaTitle })
      });
      
      if (!response.ok) throw new Error('Failed to submit vote');
      
      const vote = await response.json();
      setUserVotes(prev => [...prev, vote]);
      setError(null);
    } catch (err) {
      setError('Failed to submit vote');
    }
  }, [sessionId, session, userVotes]);

  const handleRemoveVote = useCallback(async (mediaId: string) => {
    try {
      const response = await fetch(`/api/votes/${sessionId}/${mediaId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to remove vote');
      
      setUserVotes(prev => prev.filter(v => v.mediaId !== mediaId));
      setError(null);
    } catch (err) {
      setError('Failed to remove vote');
    }
  }, [sessionId]);

  const handleFinalizeSession = useCallback(async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/finalize`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to finalize session');
      
      const results = await response.json();
      setResults(results);
      setError(null);
    } catch (err) {
      setError('Failed to finalize session');
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (lastMessage) {
      const message = JSON.parse(lastMessage.data);
      switch (message.type) {
        case 'session:voteUpdate':
          setResults(message.payload.results);
          break;
        case 'session:completed':
          setResults(message.payload.results);
          setSession(prev => prev ? { ...prev, state: SessionState.COMPLETED } : null);
          break;
        case 'error':
          setError(message.payload.message);
          break;
      }
    }
  }, [lastMessage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Progress />
      </div>
    );
  }

  if (!session) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Session not found</AlertDescription>
      </Alert>
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
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{results?.totalVotes || 0} votes</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {session.state === SessionState.COMPLETED ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Award className="h-6 w-6 text-yellow-500" />
                <span className="text-lg font-semibold">Winner: {results?.winningTitle}</span>
              </div>
              <div className="space-y-2">
                {results?.results.map((result) => (
                  <div key={result.mediaId} className="flex items-center justify-between">
                    <span>{result.title}</span>
                    <div className="flex items-center space-x-2">
                      <span>{result.votes} votes</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Timer className="h-4 w-4" />
                  <span>Your votes: {userVotes.length}/{session.maxVotesPerUser}</span>
                </div>
                {session.hostId === 'current-user-id' && ( // Replace with actual user ID check
                  <Button
                    onClick={handleFinalizeSession}
                    disabled={session.state !== SessionState.VOTING}
                  >
                    Fin
