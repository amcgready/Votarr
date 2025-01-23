// src/tests/fixtures/testData.js
export const mockPlexData = {
  servers: [
    {
      id: 'server1',
      name: 'Test Server',
      clientIdentifier: 'test123',
      connections: [{
        uri: 'http://test-server.com'
      }]
    }
  ],
  movies: [
    {
      id: 'movie1',
      title: 'Test Movie 1',
      year: 2024,
      type: 'movie',
      thumb: '/thumb/path',
      summary: 'Test summary',
      genre: 'Action',
      rating: 85,
      duration: 7200000, // 2 hours in milliseconds
      plexUrl: 'http://test-server.com/web/movie1'
    },
    // Add more mock movies...
  ],
  user: {
    id: 'user1',
    username: 'testuser',
    email: 'test@example.com',
    thumb: '/user/thumb'
  }
};

export const mockTMDBData = {
  movieDetails: {
    id: 'tmdb1',
    title: 'Test Movie 1',
    vote_average: 8.5,
    genres: [{ id: 28, name: 'Action' }],
    overview: 'Test overview'
  }
};

export const mockSessionData = {
  sessionId: 'test-session-123',
  hostId: 'user1',
  maxUsers: 2,
  currentUsers: 1,
  status: 'waiting',
  votedUsers: [],
  timestamp: Date.now()
};

export const mockQueues = {
  mainQueue: [
    {
      id: 'movie1',
      title: 'Test Movie 1',
      votes: 0
    }
  ],
  maybeQueue: [
    {
      id: 'movie2',
      title: 'Test Movie 2',
      votes: 0
    }
  ]
};
