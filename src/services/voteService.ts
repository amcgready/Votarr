// src/services/voteService.ts

import { PrismaClient, Vote, Session, SessionState } from '@prisma/client';
import { WebSocketService } from './websocketService';
import { IDBService } from './idbService';
import { Logger } from '../config/logger';
import { CustomError } from '../errors/CustomError';

interface VoteResult {
  mediaId: string;
  title: string;
  votes: number;
  voters: string[];
}

interface SessionResults {
  winnerId: string;
  winningTitle: string;
  totalVotes: number;
  results: VoteResult[];
}

export class VoteService {
  private prisma: PrismaClient;
  private wsService: WebSocketService;
  private idbService: IDBService;
  private logger: Logger;

  constructor(
    prisma: PrismaClient,
    wsService: WebSocketService,
    idbService: IDBService,
    logger: Logger
  ) {
    this.prisma = prisma;
    this.wsService = wsService;
    this.idbService = idbService;
    this.logger = logger;
  }

  async submitVote(
    sessionId: string,
    userId: string,
    mediaId: string,
    mediaTitle: string
  ): Promise<Vote> {
    try {
      // Validate session state
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
        include: { participants: true }
      });

      if (!session) {
        throw new CustomError('SessionNotFound', 'Session not found');
      }

      if (session.state !== SessionState.VOTING) {
        throw new CustomError('InvalidSessionState', 'Session is not in voting state');
      }

      if (!session.participants.some(p => p.id === userId)) {
        throw new CustomError('NotSessionMember', 'User is not a member of this session');
      }

      // Check if user has already voted maximum times
      const userVoteCount = await this.prisma.vote.count({
        where: {
          sessionId,
          userId
        }
      });

      if (userVoteCount >= session.maxVotesPerUser) {
        throw new CustomError('MaxVotesReached', 'Maximum votes per user reached');
      }

      // Create vote
      const vote = await this.prisma.vote.create({
        data: {
          sessionId,
          userId,
          mediaId,
          mediaTitle
        }
      });

      // Cache vote locally
      await this.idbService.saveVote(vote);

      // Calculate and broadcast updated results
      const results = await this.calculateSessionResults(sessionId);
      this.wsService.broadcastToUsers(
        session.participants.map(p => p.id),
        'session:voteUpdate',
        { sessionId, results }
      );

      return vote;
    } catch (error) {
      this.logger.error('Failed to submit vote', { error, sessionId, userId, mediaId });
      throw error;
    }
  }

  async revokeVote(sessionId: string, userId: string, mediaId: string): Promise<void> {
    try {
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
        include: { participants: true }
      });

      if (!session || session.state !== SessionState.VOTING) {
        throw new CustomError('InvalidSession', 'Invalid session or session state');
      }

      await this.prisma.vote.deleteMany({
        where: {
          sessionId,
          userId,
          mediaId
        }
      });

      // Update local cache
      await this.idbService.removeVote(sessionId, userId, mediaId);

      // Broadcast updated results
      const results = await this.calculateSessionResults(sessionId);
      this.wsService.broadcastToUsers(
        session.participants.map(p => p.id),
        'session:voteUpdate',
        { sessionId, results }
      );
    } catch (error) {
      this.logger.error('Failed to remove vote', { error, sessionId, userId, mediaId });
      throw error;
    }
  }

  async getUserVotes(sessionId: string, userId: string): Promise<Vote[]> {
    try {
      const votes = await this.prisma.vote.findMany({
        where: {
          sessionId,
          userId
        }
      });

      // Cache votes locally
      await Promise.all(votes.map(vote => this.idbService.saveVote(vote)));

      return votes;
    } catch (error) {
      this.logger.error('Failed to get user votes', { error, sessionId, userId });
      throw error;
    }
  }

  async calculateSessionResults(sessionId: string): Promise<SessionResults> {
    try {
      const votes = await this.prisma.vote.groupBy({
        by: ['mediaId', 'mediaTitle'],
        where: { sessionId },
        _count: {
          mediaId: true
        }
      });

      // Get voters for each media item
      const votersPromises = votes.map(async (vote) => {
        const voters = await this.prisma.vote.findMany({
          where: {
            sessionId,
            mediaId: vote.mediaId
          },
          select: {
            userId: true
          }
        });
        return {
          mediaId: vote.mediaId,
          title: vote.mediaTitle,
          votes: vote._count.mediaId,
          voters: voters.map(v => v.userId)
        };
      });

      const results = await Promise.all(votersPromises);

      // Sort by vote count descending
      results.sort((a, b) => b.votes - a.votes);

      const winner = results[0] || null;
      const totalVotes = results.reduce((sum, result) => sum + result.votes, 0);

      return {
        winnerId: winner?.mediaId || '',
        winningTitle: winner?.title || '',
        totalVotes,
        results
      };
    } catch (error) {
      this.logger.error('Failed to calculate session results', { error, sessionId });
      throw new CustomError('CalculationError', 'Failed to calculate voting results');
    }
  }

  async finalizeSession(sessionId: string, hostId: string): Promise<SessionResults> {
    try {
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
        include: { participants: true }
      });

      if (!session) {
        throw new CustomError('SessionNotFound', 'Session not found');
      }

      if (session.hostId !== hostId) {
        throw new CustomError('NotSessionHost', 'Only the host can finalize the session');
      }

      if (session.state !== SessionState.VOTING) {
        throw new CustomError('InvalidSessionState', 'Session is not in voting state');
      }

      // Calculate final results
      const results = await this.calculateSessionResults(sessionId);

      // Update session with winner and change state
      await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          state: SessionState.COMPLETED,
          selectedMediaId: results.winnerId,
          completedAt: new Date()
        }
      });

      // Notify all participants
      this.wsService.broadcastToUsers(
        session.participants.map(p => p.id),
        'session:completed',
        { sessionId, results }
      );

      return results;
    } catch (error) {
      this.logger.error('Failed to finalize session', { error, sessionId });
      throw error;
    }
  }

  async getSessionVotes(sessionId: string, userId: string): Promise<Vote[]> {
    try {
      // Verify user is session participant
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
        include: { participants: true }
      });

      if (!session?.participants.some(p => p.id === userId)) {
        throw new CustomError('NotSessionMember', 'User is not a member of this session');
      }

      // Get all votes for the session
      const votes = await this.prisma.vote.findMany({
        where: { sessionId }
      });

      // Cache votes locally
      await Promise.all(votes.map(vote => this.idbService.saveVote(vote)));

      return votes;
    } catch (error) {
      this.logger.error('Failed to get session votes', { error, sessionId });
      throw error;
    }
  }
}
