// src/types/index.ts
export interface User {
  id: string;
  plexId: string;
  email: string;
  username: string;
  avatar?: string;
  createdAt: Date;
}

export interface Session {
  id: string;
  name: string;
  ownerId: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  participants: User[];
  votes: Vote[];
  createdAt: Date;
  updatedAt: Date;
  endedAt?: Date;
  mediaType: 'MOVIE' | 'SHOW';
  maxVotes: number;
  mediaPool: PlexMediaItem[];
  winningMedia?: PlexMediaItem;
}

export interface Vote {
  id: string;
  sessionId: string;
  userId: string;
  mediaId: string;
  createdAt: Date;
}

// src/types/plex.ts
export interface PlexAuthResult {
  plexId: string;
  email: string;
  username: string;
  avatar?: string;
}

export interface PlexMediaItem {
  id: string;
  title: string;
  year?: number;
  thumb?: string;
  type: 'movie' | 'show';
  summary?: string;
}
