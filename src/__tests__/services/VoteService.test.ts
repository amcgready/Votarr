// src/__tests__/services/VoteService.test.ts
import { VoteService } from '../../services/VoteService';
import { PrismaClient } from '@prisma/client';
import { Vote, VoteType, Session } from '../../types';

// Mock PrismaClient
jest.mock('@prisma/client');

describe('VoteService', () => {
  let voteService: VoteService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  const mockSession: Session = {
    id: '123',
    name: 'Test Session',
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'active',
    ownerId: 'user123',
    currentRound: 1,
    maxRounds: 5
  };

  const mockVote: Vote = {
    id: 'vote123',
    sessionId: '123',
    userId: 'user123',
    voteType: VoteType.UPVOTE,
    round: 1,
    createdAt: new Date(),
    mediaId: 'media123'
  };

  beforeEach(() => {
    mockPrisma = {
      vote: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      },
      session: {
        findUnique: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaClient>;

    voteService = new VoteService(mockPrisma);
  });

  describe('createVote', () => {
    it('should create a vote successfully', async () => {
      mockPrisma.vote.create.mockResolvedValue(mockVote);
      mockPrisma.session.findUnique.mockResolvedValue(mockSession);

      const result = await voteService.createVote({
        sessionId: '123',
        userId: 'user123',
        voteType: VoteType.UPVOTE,
        mediaId: 'media123'
      });

      expect(result).toEqual(mockVote);
      expect(mockPrisma.vote.create).toHaveBeenCalledWith({
        data: {
          sessionId: '123',
          userId: 'user123',
          voteType: VoteType.UPVOTE,
          round: 1,
          mediaId: 'media123'
        }
      });
    });

    it('should throw error if session does not exist', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null);

      await expect(voteService.createVote({
        sessionId: '123',
        userId: 'user123',
        voteType: VoteType.UPVOTE,
        mediaId: 'media123'
      })).rejects.toThrow('Session not found');
    });

    it('should throw error if user has already voted in current round', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(mockSession);
      mockPrisma.vote.findFirst.mockResolvedValue(mockVote);

      await expect(voteService.createVote({
        sessionId: '123',
        userId: 'user123',
        voteType: VoteType.UPVOTE,
        mediaId: 'media123'
      })).rejects.toThrow('User has already voted in this round');
    });
  });

  describe('getVotesBySession', () => {
    it('should return all votes for a session', async () => {
      const mockVotes = [mockVote];
      mockPrisma.vote.findMany.mockResolvedValue(mockVotes);

      const result = await voteService.getVotesBySession('123');

      expect(result).toEqual(mockVotes);
      expect(mockPrisma.vote.findMany).toHaveBeenCalledWith({
        where: { sessionId: '123' }
      });
    });
  });

  describe('getVotesByRound', () => {
    it('should return votes for a specific round', async () => {
      const mockVotes = [mockVote];
      mockPrisma.vote.findMany.mockResolvedValue(mockVotes);

      const result = await voteService.getVotesByRound('123', 1);

      expect(result).toEqual(mockVotes);
      expect(mockPrisma.vote.findMany).toHaveBeenCalledWith({
        where: { 
          sessionId: '123',
          round: 1
        }
      });
    });
  });

  describe('deleteVote', () => {
    it('should delete a vote successfully', async () => {
      mockPrisma.vote.delete.mockResolvedValue(mockVote);

      const result = await voteService.deleteVote('vote123');

      expect(result).toEqual(mockVote);
      expect(mockPrisma.vote.delete).toHaveBeenCalledWith({
        where: { id: 'vote123' }
      });
    });

    it('should throw error if vote does not exist', async () => {
      mockPrisma.vote.delete.mockRejectedValue(new Error('Vote not found'));

      await expect(voteService.deleteVote('vote123')).rejects.toThrow('Vote not found');
    });
  });
});
