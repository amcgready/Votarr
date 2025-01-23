// src/services/sessionService.ts

import { PrismaClient, Session, SessionState, User } from '@prisma/client';
import { WebSocketService } from './websocketService';
import { IDBService } from './idbService';
import { Logger } from '../config/logger';
import { CustomError } from '../errors/CustomError';

interface SessionWithParticipants extends Session {
  participants: User[];
  host: User;
}

export class SessionService {
  private prisma: PrismaClient;
  private wsService: WebSocketService;
  private idbService: IDBService;
  private logger: Logger;
  private redis: Redis;

  constructor(
    prisma: PrismaClient,
    wsService: WebSocketService,
    idbService: IDBService,
    logger: Logger,
    redis: Redis
  ) {
    this.prisma = prisma;
    this.wsService = wsService;
    this.idbService = idbService;
    this.logger = logger;
    this.redis = redis;
  }

  async createSession(hostId: string, name: string): Promise<SessionWithParticipants> {
    try {
      const session = await this.prisma.session.create({
        data: {
          name,
          hostId,
          state: SessionState.CREATED,
          participants: {
            connect: { id: hostId }
          }
        },
        include: {
          participants: true,
          host: true
        }
      });

      // Cache session data for offline support
      await this.idbService.saveSession(session);
      
      // Notify relevant users via WebSocket
      this.wsService.broadcastToUsers(
        session.participants.map(p => p.id),
        'session:created',
        { sessionId: session.id }
      );

      return session;
    } catch (error) {
      this.logger.error('Failed to create session', { error, hostId, name });
      throw new CustomError('SessionCreationError', 'Failed to create session');
    }
  }

  async joinSession(sessionId: string, userId: string): Promise<SessionWithParticipants> {
    try {
      const session = await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          participants: {
            connect: { id: userId }
          }
        },
        include: {
          participants: true,
          host: true
        }
      });

      if (session.state === SessionState.ENDED) {
        throw new CustomError('SessionEndedError', 'Cannot join ended session');
      }

      // Update local cache
      await this.idbService.saveSession(session);

      // Notify participants
      this.wsService.broadcastToUsers(
        session.participants.map(p => p.id),
        'session:userJoined',
        { sessionId, userId }
      );

      return session;
    } catch (error) {
      this.logger.error('Failed to join session', { error, sessionId, userId });
      throw new CustomError('SessionJoinError', 'Failed to join session');
    }
  }

  async leaveSession(sessionId: string, userId: string): Promise<void> {
    try {
      const session = await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          participants: {
            disconnect: { id: userId }
          }
        },
        include: {
          participants: true,
          host: true
        }
      });

      // Remove user from Redis session membership
      await this.redis.srem(`session:${sessionId}:members`, userId);

      // Notify other session participants
      this.wsService.broadcastToSession(
        sessionId,
        {
          type: 'session:userLeft',
          payload: { userId, sessionId }
        },
        [userId]
      );

      // If the leaving user is the host, transfer host responsibilities to another participant
      if (session.hostId === userId) {
        const newHost = session.participants.find(p => p.id !== userId);
        if (newHost) {
          await this.prisma.session.update({
            where: { id: sessionId },
            data: { hostId: newHost.id }
          });
        }
      }

      // Update local cache
      await this.idbService.saveSession(session);
    } catch (error) {
      this.logger.error('Failed to leave session', { error, sessionId, userId });
      throw new CustomError('SessionLeaveError', 'Failed to leave session');
    }
  }

  async syncSessionState(sessionId: string): Promise<void> {
    try {
      const localSession = await this.idbService.getSession(sessionId);
      const remoteSession = await this.prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          participants: true,
          host: true
        }
      });

      if (!remoteSession) {
        throw new CustomError('SessionNotFoundError', 'Session not found');
      }

      // Compare timestamps and resolve conflicts
      if (localSession && localSession.updatedAt > remoteSession.updatedAt) {
        await this.prisma.session.update({
          where: { id: sessionId },
          data: {
            state: localSession.state,
            currentMediaId: localSession.currentMediaId,
            updatedAt: new Date()
          }
        });
      } else {
        await this.idbService.saveSession(remoteSession);
      }

      // Notify participants of sync
      this.wsService.broadcastToUsers(
        remoteSession.participants.map(p => p.id),
        'session:synced',
        { sessionId }
      );
    } catch (error) {
      this.logger.error('Failed to sync session state', { error, sessionId });
      throw new CustomError('SessionSyncError', 'Failed to sync session state');
    }
  }

  async updatePlaybackState(
    sessionId: string,
    mediaId: string,
    position: number,
    isPlaying: boolean
  ): Promise<void> {
    try {
      const session = await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          currentMediaId: mediaId,
          playbackPosition: position,
          isPlaying,
          updatedAt: new Date()
        },
        include: {
          participants: true
        }
      });

      // Update local cache
      await this.idbService.saveSession(session);

      // Notify participants of playback state change
      this.wsService.broadcastToUsers(
        session.participants.map(p => p.id),
        'session:playbackUpdate',
        { sessionId, mediaId, position, isPlaying }
      );
    } catch (error) {
      this.logger.error('Failed to update playback state', {
        error,
        sessionId,
        mediaId,
        position
      });
      throw new CustomError('PlaybackUpdateError', 'Failed to update playback state');
    }
  }

  async calculateVoteResults(sessionId: string): Promise<{
    mediaId: string;
    votes: number;
  }[]> {
    try {
      const votes = await this.prisma.vote.groupBy({
        by: ['mediaId'],
        where: {
          sessionId
        },
        _count: {
          mediaId: true
        },
        orderBy: {
          _count: {
            mediaId: 'desc'
          }
        }
      });

      const results = votes.map(vote => ({
        mediaId: vote.mediaId,
        votes: vote._count.mediaId
      }));

      // Cache results locally
      await this.idbService.saveVoteResults(sessionId, results);

      // Notify participants of results
      this.wsService.broadcastToUsers(
        (await this.getSessionParticipants(sessionId)).map(p => p.id),
        'session:voteResults',
        { sessionId, results }
      );

      return results;
    } catch (error) {
      this.logger.error('Failed to calculate vote results', { error, sessionId });
      throw new CustomError('VoteCalculationError', 'Failed to calculate vote results');
    }
  }

  private async getSessionParticipants(sessionId: string): Promise<User[]> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        participants: true
      }
    });
    return session?.participants || [];
  }

  async recoverSession(sessionId: string): Promise<SessionWithParticipants | null> {
    try {
      // Try to get session from local cache first
      const localSession = await this.idbService.getSession(sessionId);
      
      // If we have a local session, try to sync with server
      if (localSession) {
        await this.syncSessionState(sessionId);
      }

      // Get the latest session state
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          participants: true,
          host: true
        }
      });

      if (!session) {
        return null;
      }

      return session;
    } catch (error) {
      this.logger.error('Failed to recover session', { error, sessionId });
      // Return cached version if available during recovery failure
      return this.idbService.getSession(sessionId);
    }
  }

  async getSessionState(sessionId: string): Promise<{
    playback: {
      mediaId: string;
      position: number;
      isPlaying: boolean;
    } | null;
    voteResults: {
      mediaId: string;
      votes: number;
    }[];
  }> {
    try {
      const [playback, voteResults] = await Promise.all([
        this.redis.get(`session:${sessionId}:playback`),
        this.calculateVoteResults(sessionId)
      ]);

      return {
        playback: playback
          ? JSON.parse(playback)
          : null,
        voteResults
      };
    } catch (error) {
      this.logger.error('Failed to get session state', { error, sessionId });
      throw new CustomError('StateError', 'Failed to get session state');
    }
  }

  async updateSessionMetadata(
    sessionId: string,
    updates: Partial<Session>
  ): Promise<SessionWithParticipants> {
    try {
      const session = await this.prisma.session.update({
        where: { id: sessionId },
        data: updates,
        include: {
          participants: true,
          host: true
        }
      });

      // Update local cache
      await this.idbService.saveSession(session);

      // Notify participants about the changes
      this.wsService.broadcastToSession(
        sessionId,
        {
          type: 'session:updated',
          payload: { sessionId, updates }
        }
      );

      return session;
    } catch (error) {
      this.logger.error('Failed to update session metadata', { error, sessionId, updates });
      throw new CustomError('SessionUpdateError', 'Failed to update session metadata');
    }
  }
}
