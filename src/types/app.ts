// Path: src/types/app.ts

import { User, Session, Round, Media, Vote } from '@prisma/client';

export interface AppState {
  isAuthenticated: boolean;
  user: User | null;
  currentSession: Session | null;
  currentRound: Round | null;
  error: Error | null;
  loading: boolean;
}

export interface AppContext {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export type AppAction =
  | { type: 'SET_AUTH'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_SESSION'; payload: Session | null }
  | { type: 'SET_ROUND'; payload: Round | null }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'SET_LOADING'; payload: boolean };

export interface MediaWithVotes extends Media {
  votes: Vote[];
  votePercentage: number;
}

export interface RoundWithDetails extends Round {
  mediaOptions: MediaWithVotes[];
  participants: User[];
  winner?: Media;
}

export interface SessionWithDetails extends Session {
  host: User;
  participants: User[];
  rounds: RoundWithDetails[];
  currentRound?: RoundWithDetails;
}
