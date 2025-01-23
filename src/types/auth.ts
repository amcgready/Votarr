// src/types/auth.ts
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  plexId?: string;
}

export interface JWTPayload {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface PlexAuthRequest {
  plexToken: string;
  clientId?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
  };
  token: string;
  expiresIn: number;
}

export interface TokenValidationResponse {
  valid: boolean;
  user?: AuthenticatedUser;
  error?: string;
}

export interface APIKey {
  id: string;
  key: string;
  name: string;
  userId: string;
  permissions: string[];
  rateLimit: number;
  expiresAt?: Date;
}

export enum AuthProvider {
  PLEX = 'PLEX',
  LOCAL = 'LOCAL'
}

export interface AuthenticationError {
  code: string;
  message: string;
  details?: any;
}

export enum Permission {
  READ_SESSIONS = 'READ_SESSIONS',
  CREATE_SESSIONS = 'CREATE_SESSIONS',
  MANAGE_SESSIONS = 'MANAGE_SESSIONS',
  VOTE = 'VOTE',
  MANAGE_USERS = 'MANAGE_USERS',
  ADMIN = 'ADMIN'
}

export interface RefreshTokenPayload {
  userId: string;
  tokenFamily: string;
}
