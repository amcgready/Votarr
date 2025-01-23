// src/__tests__/services/SessionService.test.ts
import { SessionService } from '../../services/SessionService';
import { PrismaClient } from '@prisma/client';
import { Session, CreateSessionDto, SessionStatus } from '../../types';
import { WebSocketService } from '../../services/WebSocketService';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('../../services/WebSocketService');

describe('SessionService', () => {
  let sessionService: SessionService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockWebSocketService: jest.Mocked<WebSocketService>;

  const mockSession: Session = {
    id: 'session123',
    name: 'Movie Night',
    createdAt: new Date(),
    updatedAt: new Date(),
    status: SessionStatus.ACTIVE,
    ownerId: 'user123',
    currentRound: 1,
    maxRounds: 5
  };

  const mockCreateSessionDto: CreateSessionDto = {
    name: 'Movie Night',
    ownerId: 'user123',
    maxRounds: 5
  };

  beforeEach(() => {
    mockPrisma = {
      session: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      vote: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      }
    } as unknown as jest.Mocked<PrismaClient>;

    mockWebSocketService = {
      broadcastToSession: jest.fn(),
      notifySessionUpdate: jest.fn(),
    } as unknown as jest.Mocked<WebSocketService>;

    sessionService = new SessionService(mockPrisma, mockWebSocketService);
  });

  describe('createSession', () => {
    it('should create a session successfully', async () => {
      mockPrisma.session.create.mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user123', name: 'Test User' });

      const result = await sessionService.createSession(mockCreateSessionDto);

      expect(result).toEqual(mockSession);
      expect(mockPrisma.session.create).toHaveBeenCalledWith({
        data: {
          name: mockCreateSessionDto.name,
          ownerId: mockCreateSessionDto.ownerId,
          maxRounds: mockCreateSessionDto.maxRounds,
          status: SessionStatus.WAITING,
          currentRound: 1,
        }
      });
    });

    it('should throw error if owner does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(sessionService.createSession(mockCreateSessionDto))
        .rejects.toThrow('User not found');
    });
  });

  describe('getSession', () => {
    it('should return session by id', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(mockSession);

      const result = await sessionService.getSession('session123');

      expect(result).toEqual(mockSession);
      expect(mockPrisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: 'session123' }
      });
    });

    it('should throw error if session not found', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null);

      await expect(sessionService.getSession('session123'))
        .rejects.toThrow('Session not found');
    });
  });

  describe('getUserSessions', () => {
    it('should return all sessions for a user', async () => {
      const mockSessions = [mockSession];
      mockPrisma.session.findMany.mockResolvedValue(mockSessions);

      const result = await sessionService.getUserSessions('user123');

      expect(result).toEqual(mockSessions);
      expect(mockPrisma.session.findMany).toHaveBeenCalledWith({
        where: { ownerId: 'user123' }
      });
    });
  });

  describe('startSession', () => {
    it('should start session successfully', async () => {
      const startedSession = { ...mockSession, status: SessionStatus.ACTIVE };
      mockPrisma.session.findUnique.mockResolvedValue(mockSession);
      mockPrisma.session.update.mockResolvedValue(startedSession);

      const result = await sessionService.startSession('session123', 'user123');

      expect(result).toEqual(startedSession);
      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session123' },
        data: { status: SessionStatus.ACTIVE }
      });
      expect(mockWebSocketService.notifySessionUpdate).toHaveBeenCalled();
    });

    it('should throw error if user is not session owner', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(mockSession);

      await expect(sessionService.startSession('session123', 'wrongUser'))
        .rejects.toThrow('Unauthorized: Only session owner can perform this action');
    });
  });

  describe('advanceRound', () => {
    it('should advance to next round successfully', async () => {
      const currentSession = { ...mockSession, currentRound: 1 };
      const advancedSession = { ...mockSession, currentRound: 2 };
      mockPrisma.session.findUnique.mockResolvedValue(currentSession);
      mockPrisma.session.update.mockResolvedValue(advancedSession);
      mockPrisma.vote.findMany.mockResolvedValue([{ id: 'vote1' }]);

      const result = await sessionService.advanceRound('session123', 'user123');

      expect(result).toEqual(advancedSession);
      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session123' },
        data: { currentRound: 2 }
      });
      expect(mockWebSocketService.notifySessionUpdate).toHaveBeenCalled();
    });

    it('should complete session if max rounds reached', async () => {
      const finalRoundSession = { ...mockSession, currentRound: 5, maxRounds: 5 };
      const completedSession = { ...finalRoundSession, status: SessionStatus.COMPLETED };
      mockPrisma.session.findUnique.mockResolvedValue(finalRoundSession);
      mockPrisma.session.update.mockResolvedValue(completedSession);
      mockPrisma.vote.findMany.mockResolvedValue([{ id: 'vote1' }]);

      const result = await sessionService.advanceRound('session123', 'user123');

      expect(result).toEqual(completedSession);
      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session123' },
        data: { status: SessionStatus.COMPLETED }
      });
    });

    it('should throw error if no votes in current round', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(mockSession);
      mockPrisma.vote.findMany.mockResolvedValue([]);

      await expect(sessionService.advanceRound('session123', 'user123'))
        .rejects.toThrow('Cannot advance round: No votes in current round');
    });
  });

  describe('endSession', () => {
    it('should end session successfully', async () => {
      const endedSession = { ...mockSession, status: SessionStatus.COMPLETED };
      mockPrisma.session.findUnique.mockResolvedValue(mockSession);
      mockPrisma.session.update.mockResolvedValue(endedSession);

      const result = await sessionService.endSession('session123', 'user123');

      expect(result).toEqual(endedSession);
      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session123' },
        data: { status: SessionStatus.COMPLETED }
      });
      expect(mockWebSocketService.notifySessionUpdate).toHaveBeenCalled();
    });

    it('should clean up session votes when ended', async () => {
      const endedSession = { ...mockSession, status: SessionStatus.COMPLETED };
      mockPrisma.session.findUnique.mockResolvedValue(mockSession);
      mockPrisma.session.update.mockResolvedValue(endedSession);

      await sessionService.endSession('session123', 'user123');

      expect(mockPrisma.vote.deleteMany).toHaveBeenCalledWith({
        where: { sessionId: 'session123' }
      });
    });
  });

  describe('deleteSession', () => {
    it('should delete session successfully', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(mockSession);
      mockPrisma.session.delete.mockResolvedValue(mockSession);

      const result = await sessionService.deleteSession('session123', 'user123');

      expect(result).toEqual(mockSession);
      expect(mockPrisma.session.delete).toHaveBeenCalledWith({
        where: { id: 'session123' }
      });
    });

    it('should throw error if session not found', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null);

      await expect(sessionService.deleteSession('session123', 'user123'))
        .rejects.toThrow('Session not found');
    });
  });
});
