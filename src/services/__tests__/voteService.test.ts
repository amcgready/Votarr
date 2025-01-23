// src/services/__tests__/voteService.test.ts
import { VoteService } from '../voteService';
import { WebSocketService } from '../websocketService';
import prisma from '../../lib/prisma';
import { AppError } from '../../errors/AppError';
import { mockVote, mockSession, mockUser } from '../../utils/testHelpers';

jest.mock('../websocketService');
jest.mock('../../lib/prisma');

describe('VoteService', () => {
  let voteService: VoteService;

  beforeEach(() => {
    voteService = new VoteService();
    jest.clearAllMocks();
  });

  describe('castVote', () => {
    const voteData = {
      sessionId: 'test-session',
      userId: 'test-user',
      mediaId: 'test-media',
      value: 1
    };

    it('successfully casts a new vote', async () => {
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prisma.vote.create as jest.Mock).mockResolvedValue(mockVote);

      const result = await voteService.castVote(voteData);

      expect(result).toEqual(mockVote);
      expect(prisma.vote.create).toHaveBeenCalledWith({
        data: voteData
      });
    });

    it('prevents duplicate votes from same user for same media', async () => {
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prisma.vote.findFirst as jest.Mock).mockResolvedValue(mockVote);

      await expect(voteService.castVote(voteData))
        .rejects
        .toThrow(AppError);
    });

    it('prevents voting in closed sessions', async () => {
      const closedSession = { ...mockSession, status: 'CLOSED' };
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(closedSession);

      await expect(voteService.castVote(voteData))
        .rejects
        .toThrow('Cannot vote in closed session');
    });

    it('validates vote value range', async () => {
      const invalidVote = { ...voteData, value: 5 };

      await expect(voteService.castVote(invalidVote))
        .rejects
        .toThrow('Invalid vote value');
    });
  });

  describe('calculateSessionResults', () => {
    const sessionId = 'test-session';

    it('correctly calculates vote totals', async () => {
      const mockVotes = [
        { mediaId: 'media1', value: 1 },
        { mediaId: 'media1', value: 1 },
        { mediaId: 'media2', value: -1 }
      ];

      (prisma.vote.findMany as jest.Mock).mockResolvedValue(mockVotes);

      const results = await voteService.calculateSessionResults(sessionId);

      expect(results).toEqual({
        'media1': 2,
        'media2': -1
      });
    });

    it('handles empty vote set', async () => {
      (prisma.vote.findMany as jest.Mock).mockResolvedValue([]);

      const results = await voteService.calculateSessionResults(sessionId);

      expect(results).toEqual({});
    });

    it('calculates weighted votes correctly', async () => {
      const mockVotes = [
        { mediaId: 'media1', value: 1, weight: 2 },
        { mediaId: 'media1', value: 1, weight: 1 },
        { mediaId: 'media2', value: -1, weight: 1 }
      ];

      (prisma.vote.findMany as jest.Mock).mockResolvedValue(mockVotes);

      const results = await voteService.calculateSessionResults(sessionId, true);

      expect(results).toEqual({
        'media1': 3,
        'media2': -1
      });
    });
  });

  describe('getVoteStats', () => {
    const sessionId = 'test-session';

    it('calculates correct vote statistics', async () => {
      const mockVotes = [
        { value: 1, userId: 'user1' },
        { value: 1, userId: 'user2' },
        { value: -1, userId: 'user3' }
      ];

      (prisma.vote.findMany as jest.Mock).mockResolvedValue(mockVotes);

      const stats = await voteService.getVoteStats(sessionId);

      expect(stats).toEqual({
        totalVotes: 3,
        positiveVotes: 2,
        negativeVotes: 1,
        uniqueVoters: 3,
        averageVote: 0.33
      });
    });

    it('handles session with no votes', async () => {
      (prisma.vote.findMany as jest.Mock).mockResolvedValue([]);

      const stats = await voteService.getVoteStats(sessionId);

      expect(stats).toEqual({
        totalVotes: 0,
        positiveVotes: 0,
        negativeVotes: 0,
        uniqueVoters: 0,
        averageVote: 0
      });
    });
  });

  describe('getUserVoteHistory', () => {
    const userId = 'test-user';

    it('retrieves user vote history with pagination', async () => {
      const mockVoteHistory = [mockVote];
      (prisma.vote.findMany as jest.Mock).mockResolvedValue(mockVoteHistory);

      const result = await voteService.getUserVoteHistory(userId, { page: 1, limit: 10 });

      expect(result.votes).toEqual(mockVoteHistory);
      expect(prisma.vote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
          skip: 0,
          take: 10
        })
      );
    });

    it('includes media details in vote history', async () => {
      const mockVoteWithMedia = {
        ...mockVote,
        media: { title: 'Test Movie', year: 2024 }
      };
      (prisma.vote.findMany as jest.Mock).mockResolvedValue([mockVoteWithMedia]);

      const result = await voteService.getUserVoteHistory(userId, { 
        page: 1, 
        limit: 10,
        includeMedia: true 
      });

      expect(result.votes[0].media).toBeDefined();
      expect(result.votes[0].media.title).toBe('Test Movie');
    });
  });
});
