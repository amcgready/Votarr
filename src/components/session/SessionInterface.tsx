// src/components/session/SessionInterface.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/components/auth/AuthContext';
import { cn } from '@/lib/utils';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';

// Icons
import { 
  Users, 
  Timer, 
  ThumbsUp, 
  ThumbsDown, 
  Crown,
  Film,
  Loader2,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowRight
} from 'lucide-react';

// Types
interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  avatarUrl?: string;
}

interface MediaItem {
  id: string;
  title: string;
  year: string;
  posterUrl: string;
  duration: string;
  rating: string;
  synopsis?: string;
  genre?: string[];
}

interface VoteResult {
  mediaId: string;
  votes: number;
  percentage: number;
}

interface SessionState {
  id: string;
  status: 'waiting' | 'voting' | 'results' | 'ended';
  participants: Participant[];
  currentRound: number;
  totalRounds: number;
  timeRemaining: number;
  mediaOptions?: MediaItem[];
  voteResults?: VoteResult[];
  winnerId?: string;
}

interface WebSocketMessage {
  type: string;
  payload: any;
}

const SessionInterface: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState<SessionState | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [isHost, setIsHost] = useState(false);

  const webSocketUrl = `${process.env.REACT_APP_WS_URL}/session/${sessionId}`;

  const { isConnected, lastMessage, sendMessage } = useWebSocket(webSocketUrl, {
    onOpen: () => {
      toast({
        title: "Connected to session",
        description: "You're now connected to the voting session",
      });
    },
    onClose: () => {
      toast({
        title: "Disconnected",
        description: "Lost connection to the session",
        variant: "destructive",
      });
    },
    onError: (error) => {
      setError('Connection error: ' + error.message);
    }
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }

    if (lastMessage) {
      try {
        const message = JSON.parse(lastMessage) as WebSocketMessage;
        switch (message.type) {
          case 'sessionUpdate':
            setSession(message.payload);
            setIsHost(message.payload.participants.find(
              (p: Participant) => p.isHost
            )?.id === user.id);
            break;

          case 'error':
            setError(message.payload.message);
            toast({
              title: "Error",
              description: message.payload.message,
              variant: "destructive",
            });
            break;

          case 'sessionEnded':
            toast({
              title: "Session Ended",
              description: message.payload.message || "The session has ended",
            });
            navigate('/');
            break;

          case 'roundComplete':
            setSelectedMedia([]);
            break;
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
        setError('Failed to process server message');
      }
    }
  }, [lastMessage, navigate, user]);

  useEffect(() => {
    if (session?.status === 'voting' && session.timeRemaining > 0) {
      const timer = setInterval(() => {
        setSession(prev => prev && {
          ...prev,
          timeRemaining: Math.max(0, prev.timeRemaining - 1)
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [session?.status, session?.timeRemaining]);

  const handleVote = (mediaId: string) => {
    if (session?.status !== 'voting') return;

    if (session.mediaOptions?.[0]?.id) {
      const newSelected = [...selectedMedia];
      const index = newSelected.indexOf(mediaId);

      if (index === -1) {
        newSelected.push(mediaId);
      } else {
        newSelected.splice(index, 1);
      }

      setSelectedMedia(newSelected);
      sendMessage({
        type: 'vote',
        payload: { 
          mediaId, 
          rank: newSelected.indexOf(mediaId) + 1,
          sessionId,
          userId: user?.id
        }
      });

      toast({
        title: "Vote recorded",
        description: `You voted for ${session.mediaOptions.find(m => m.id === mediaId)?.title}`,
      });
    }
  };

  const handleReady = () => {
    sendMessage({
      type: 'ready',
      payload: { 
        ready: true,
        sessionId,
        userId: user?.id
      }
    });
  };

  const handleStartSession = () => {
    if (!isHost) return;
    sendMessage({
      type: 'startSession',
      payload: { 
        sessionId,
        userId: user?.id
      }
    });
  };

  const handleNextRound = () => {
    if (!isHost) return;
    sendMessage({
      type: 'nextRound',
      payload: { 
        sessionId,
        userId: user?.id
      }
    });
  };

  const handleEndSession = () => {
    if (!isHost) return;
    sendMessage({
      type: 'endSession',
      payload: { 
        sessionId,
        userId: user?.id
      }
    });
  };

  const handleLeaveSession = () => {
    sendMessage({
      type: 'leave',
      payload: { 
        sessionId,
        userId: user?.id
      }
    });
    navigate('/');
  };

  const renderParticipantList = () => (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Participants
        </CardTitle>
        <CardDescription>
          {session?.participants.length} people in session
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {session?.participants.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center justify-between mb-4 last:mb-0"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={participant.avatarUrl} />
                  <AvatarFallback>
                    {participant.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{participant.name}</p>
                  <div className="flex gap-2">
                    {participant.isHost && (
                      <Badge variant="default">Host</Badge>
                    )}
                    {participant.isReady && session?.status === 'waiting' && (
                      <Badge variant="secondary">Ready</Badge>
                    )}
                  </div>
                </div>
              </div>
              {session?.status === 'waiting' && (
                participant.isReady ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-500" />
                )
              )}
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Voting Session</h1>
            <p className="text-gray-400">
              Round {session.currentRound} of {session.totalRounds}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              <span>{session.participants.length} participants</span>
            </div>
            {session.status === 'voting' && (
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-blue-400" />
                <span>{session.timeRemaining}s</span>
              </div>
            )}
            <Button
              variant="outline"
              onClick={handleLeaveSession}
            >
              Leave Session
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-9">
            {session.status === 'waiting' && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Waiting for participants...</CardTitle>
                  <CardDescription>
                    All participants must be ready to begin the session
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {!isHost && (
                      <Button 
                        onClick={handleReady}
                        disabled={session.participants.find(
                          p => p.id === user?.id
                        )?.isReady}
                      >
                        Ready to Start
                      </Button>
                    )}
                    {isHost && (
                      <Button 
                        onClick={handleStartSession}
                        disabled={!session.participants.every(p => p.isReady)}
                      >
                        Start Session
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {session.status === 'voting' && session.mediaOptions && (
              <div className="grid grid-cols-2 gap-4">
                {session.mediaOptions.map((media) => (
                  <Card 
                    key={media.id}
                    className={cn(
                      "bg-gray-800 border-gray-700 cursor-pointer transition-all",
                      selectedMedia.includes(media.id) && "ring-2 ring-blue-500"
                    )}
                    onClick={() => handleVote(media.id)}
                  >
                    <div className="aspect-video relative">
                      <img
                        src={media.posterUrl || "/api/placeholder/400/225"}
                        alt={media.title}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                      {selectedMedia.includes(media.id) && (
                        <div className="absolute top-2 right-2 bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center">
                          {selectedMedia.indexOf(media.id) + 1}
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{media.title}</h3>
                      <p className="text-sm text-gray-400">{media.year} • {media.duration}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Film className="h-4 w-4" />
                        <span className="text-sm">{media.rating}</span>
                      </div>
                      {media.synopsis && (
                        <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                          {media.synopsis}
                        </p>
                      )}
                      {media.genre && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {media.genre.map((g) => (
                            <Badge 
                              key={g} 
                              variant="secondary"
                              className="text-xs"
                            >
                              {g}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {session.status === 'results' && session.voteResults && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Round Results</CardTitle>
                    {isHost && session.currentRound < session.totalRounds && (
                      <Button onClick={handleNextRound}>
                        Next Round <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                    {isHost && session.currentRound === session.totalRounds && (
                      <Button onClick={handleEndSession}>
                        End Session <Trophy className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {session.voteResults.map((result, index) => {
                    const media = session.mediaOptions?.find(m => m.id === result.mediaId);
                    return (
                      <div 
                        key={result.mediaId}
                        className="mb-6 last:mb-0"
                      >
                        <div className="flex items-center gap-4 mb-2">
                          {index === 0 && <Crown className="h-5 w-5 text-yellow-500" />}
                          <div className="flex-1">
