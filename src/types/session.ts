// Path: src/types/session.ts

import { Session, User, Round, Media } from '@prisma/client';

export interface CreateSessionDTO {
  hostId: string;
  maxParticipants: number;
  mediaType: 'movie' | 'show' | 'any';
  description?: string;
}

export interface SessionWithDetails extends Session {
  host: User;
  participants: User[];
  rounds: (Round & {
    mediaOptions: Media[];
    winningMedia?: Media;
  })[];
}

export interface SessionState {
  activeParticipants: number;
  currentRound?: Round & {
    mediaOptions: Media[];
    votes: {
      userId: string;
      mediaId: string;
    }[];
  };
}
