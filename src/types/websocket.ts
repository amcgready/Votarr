// Path: src/types/websocket.ts

import { Round, Media, User } from '@prisma/client';

export type WebSocketEvent = 
  | 'JOIN_SESSION'
  | 'LEAVE_SESSION'
  | 'USER_JOINED'
  | 'USER_LEFT'
  | 'ROUND_STARTED'
  | 'VOTE_SUBMITTED'
  | 'ROUND_COMPLETED';

export interface WSClientMessage {
  type: 'JOIN_SESSION' | 'LEAVE_SESSION';
  payload: {
    sessionId: string;
  };
}

export interface WSServerMessage {
  type: WebSocketEvent;
  payload: any;
}

export interface UserJoinedPayload {
  userId: string;
  username: string;
}

export interface UserLeftPayload {
  userId: string;
}

export interface RoundStartedPayload {
  round: Round & {
    mediaOptions: Media[];
  };
}

export interface VoteSubmittedPayload {
  roundId: string;
  votesSubmitted: number;
  totalExpected: number;
}

export interface RoundCompletedPayload {
  roundId: string;
  results: {
    winner: {
      mediaId: string;
      total: number;
      percentage: number;
    };
    allResults: {
      mediaId: string;
      total: number;
      percentage: number;
    }[];
    totalVotes: number;
  };
  winningMedia: Media;
}
