// src/services/idbService.ts
import { Session, User, Vote } from '@prisma/client';
import { openDB, IDBPDatabase } from 'idb';
import { Logger } from '../config/logger';
import { CustomError } from '../errors/CustomError';

interface VoteResult {
  mediaId: string;
  votes: number;
}

export class IDBService {
  private dbName = 'votarr-offline';
  private version = 1;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  private async getDB(): Promise<IDBPDatabase> {
    try {
      return await openDB(this.dbName, this.version, {
        upgrade(db) {
          // Create stores if they don't exist
          if (!db.objectStoreNames.contains('sessions')) {
            db.createObjectStore('sessions', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('votes')) {
            db.createObjectStore('votes', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('voteResults')) {
            db.createObjectStore('voteResults', { keyPath: 'sessionId' });
          }
          if (!db.objectStoreNames.contains('users')) {
            db.createObjectStore('users', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('syncQueue')) {
            db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          }
        }
      });
    } catch (error) {
      this.logger.error('Failed to initialize IndexedDB', { error });
      throw new CustomError('IDBInitError', 'Failed to initialize offline storage');
    }
  }

  async saveSession(session: Session): Promise<void> {
    try {
      const db = await this.getDB();
      await db.put('sessions', session);
    } catch (error) {
      this.logger.error('Failed to save session to IndexedDB', { error, sessionId: session.id });
      throw new CustomError('IDBSaveError', 'Failed to save session data offline');
    }
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    try {
      const db = await this.getDB();
      return await db.get('sessions', sessionId);
    } catch (error) {
      this.logger.error('Failed to get session from IndexedDB', { error, sessionId });
      throw new CustomError('IDBGetError', 'Failed to retrieve offline session data');
    }
  }

  async saveVote(vote: Vote): Promise<void> {
    try {
      const db = await this.getDB();
      await db.put('votes', vote);
      // Add to sync queue for when we're back online
      await db.put('syncQueue', {
        type: 'vote',
        data: vote,
        timestamp: new Date()
      });
    } catch (error) {
      this.logger.error('Failed to save vote to IndexedDB', { error, voteId: vote.id });
      throw new CustomError('IDBSaveError', 'Failed to save vote data offline');
    }
  }

  async getVotesForSession(sessionId: string): Promise<Vote[]> {
    try {
      const db = await this.getDB();
      const votes = await db.getAllFromIndex('votes', 'sessionId', sessionId);
      return votes;
    } catch (error) {
      this.logger.error('Failed to get votes from IndexedDB', { error, sessionId });
      throw new CustomError('IDBGetError', 'Failed to retrieve offline vote data');
    }
  }

  async saveVoteResults(sessionId: string, results: VoteResult[]): Promise<void> {
    try {
      const db = await this.getDB();
      await db.put('voteResults', {
        sessionId,
        results,
        timestamp: new Date()
      });
    } catch (error) {
      this.logger.error('Failed to save vote results to IndexedDB', { error, sessionId });
      throw new CustomError('IDBSaveError', 'Failed to save vote results offline');
    }
  }

  async getVoteResults(sessionId: string): Promise<VoteResult[] | undefined> {
    try {
      const db = await this.getDB();
      const entry = await db.get('voteResults', sessionId);
      return entry?.results;
    } catch (error) {
      this.logger.error('Failed to get vote results from IndexedDB', { error, sessionId });
      throw new CustomError('IDBGetError', 'Failed to retrieve offline vote results');
    }
  }

  async saveUser(user: User): Promise<void> {
    try {
      const db = await this.getDB();
      await db.put('users', user);
    } catch (error) {
      this.logger.error('Failed to save user to IndexedDB', { error, userId: user.id });
      throw new CustomError('IDBSaveError', 'Failed to save user data offline');
    }
  }

  async getUser(userId: string): Promise<User | undefined> {
    try {
      const db = await this.getDB();
      return await db.get('users', userId);
    } catch (error) {
      this.logger.error('Failed to get user from IndexedDB', { error, userId });
      throw new CustomError('IDBGetError', 'Failed to retrieve offline user data');
    }
  }

  async getSyncQueue(): Promise<{ id: number; type: string; data: any; timestamp: Date }[]> {
    try {
      const db = await this.getDB();
      return await db.getAll('syncQueue');
    } catch (error) {
      this.logger.error('Failed to get sync queue from IndexedDB', { error });
      throw new CustomError('IDBGetError', 'Failed to retrieve offline sync queue');
    }
  }

  async clearSyncQueue(): Promise<void> {
    try {
      const db = await this.getDB();
      await db.clear('syncQueue');
    } catch (error) {
      this.logger.error('Failed to clear sync queue in IndexedDB', { error });
      throw new CustomError('IDBClearError', 'Failed to clear offline sync queue');
    }
  }

  async clearAll(): Promise<void> {
    try {
      const db = await this.getDB();
      await Promise.all([
        db.clear('sessions'),
        db.clear('votes'),
        db.clear('voteResults'),
        db.clear('users'),
        db.clear('syncQueue')
      ]);
    } catch (error) {
      this.logger.error('Failed to clear IndexedDB stores', { error });
      throw new CustomError('IDBClearError', 'Failed to clear offline storage');
    }
  }
}
