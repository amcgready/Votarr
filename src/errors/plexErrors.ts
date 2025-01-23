// Path: src/errors/plexErrors.ts

export class PlexAuthenticationError extends Error {
  constructor(message: string = 'Plex authentication failed') {
    super(message);
    this.name = 'PlexAuthenticationError';
  }
}

export class PlexAPIError extends Error {
  constructor(
    message: string = 'Plex API request failed',
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'PlexAPIError';
  }
}

export class SessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionError';
  }
}

export class VotingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VotingError';
  }
}

export class WebSocketError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebSocketError';
  }
}
