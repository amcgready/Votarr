// Path: src/types/vote.ts

import { Media } from '@prisma/client';

export interface VoteSubmission {
  mediaId: string;
  weight?: number;
}

export interface VoteResults {
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
}

export interface RoundStatus {
  status: 'ACTIVE' | 'COMPLETED';
  results?: VoteResults;
  winningMedia?: Media;
}
