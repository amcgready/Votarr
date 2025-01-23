// src/routes/__tests__/session.test.ts
import request from 'supertest';
import { app } from '../../server';
import { SessionService } from '../../services/sessionService';
import { generateTestToken } from '../../utils/test-helpers';

jest.mock('../../services/sessionService');

describe('Session API Routes', () => {
  const mockUser = {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com'
  };

  const authToken = generateTestToken(mockUser);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/sessions', () => {
    it('creates a new session successfully', async () => {
      const mockSession = {
        id: 'test-session-id',
        name: 'Test Session',
        hostId: mockUser.id
      };

      (SessionService.prototype.createSession as jest.Mock)
        .mockResolvedValue(mockSession);

      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Session' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: mockSession
      });
    });

    it('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({ name: 'Test Session' });

      expect(response.status).toBe(401);
    });

    it('returns 400 for invalid session data', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/sessions/:sessionId', () => {
    it('retrieves session details successfully', async () => {
      const mockSession = {
        id: 'test-session-id',
        name: 'Test Session',
        hostId: mockUser.id,
        participants: []
      };

      (SessionService.prototype.getSession as jest.Mock)
        .mockResolvedValue(mockSession);

      const response = await request(app)
        .get('/api/sessions/test-session-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockSession
      });
    });

    it('returns 404 for non-existent session', async () => {
      (SessionService.prototype.getSession as jest.Mock)
        .mockResolvedValue(null);

      const response = await request(app)
        .get('/api/sessions/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
