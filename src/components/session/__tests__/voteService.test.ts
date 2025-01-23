// src/services/__tests__/voteService.test.ts
import { VoteService } from '../voteService';
import prisma from '../../lib/prisma';
import { AppError } from '../../errors/AppError';

jest.mock('../../lib/prisma', () => ({
  vote: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
}));

describe('VoteService', () => {
  let voteService: VoteService;

  beforeEach(() => {
    voteService = new VoteService();
    jest.clearAllMocks();
  });

  describe('castVote', () => {
    const mockVoteData = {
      userId: 'test-user-id',
      sessionId: 'test-session-id',
      mediaId: 'test-media-id',
      value: 1
    };

    it('creates a new vote successfully', async () => {
      const mockCreatedVote = { ...mockVoteData, id: 'test-vote-id' };
      (prisma.vote.create as jest.Mock).mockResolvedValue(mockCreatedVote);

      const result = await voteService.castVote(mockVoteData);

      expect(result).toEqual(mockCreatedVote);
      expect(prisma.vote.create).toHaveBeenCalledWith({
        data: mockVoteData
      });
    });

    it('throws an error if vote creation fails', async () => {
      const mockError = new Error('Database error');
      (prisma.vote.create as jest.Mock).mockRejectedValue(mockError);

      await expect(voteService.castVote(mockVoteData))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('getVotesBySession', () => {
    const sessionId = 'test-session-id';

    it('retrieves all votes for a session', async () => {
      const mockVotes = [
        { id: 'vote-1', value: 1 },
        { id: 'vote-2', value: -1 }
      ];
      (prisma.vote.findMany as jest.Mock).mockResolvedValue(mockVotes);

      const result = await voteService.getVotesBySession(sessionId);

      expect(result).toEqual(mockVotes);
      expect(prisma.vote.findMany).toHaveBeenCalledWith({
        where: { sessionId }
      });
    });
  });

  describe('calculateSessionResults', () => {
    const sessionId = 'test-session-id';

    it('calculates correct vote results', async () => {
      const mockVotes = [
        { mediaId: 'media-1', value: 1 },
        { mediaId: 'media-1', value: 1 },
        { mediaId: 'media-2', value: -1 }
      ];
      (prisma.vote.findMany as jest.Mock).mockResolvedValue(mockVotes);

      const results = await voteService.calculateSessionResults(sessionId);

      expect(results).toEqual({
        'media-1': 2,
        'media-2': -1
      });
    });
  });
});
