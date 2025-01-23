// src/__tests__/services/IndexedDBService.test.ts
import { IndexedDBService } from '../../services/IndexedDBService';
import { IDBFactory, IDBDatabase, IDBObjectStore } from 'fake-indexeddb';
import { Media, Session, Vote } from '../../types';

// Mock IndexedDB
const indexedDB = new IDBFactory();
(global as any).indexedDB = indexedDB;

describe('IndexedDBService', () => {
  let indexedDBService: IndexedDBService;

  const mockMedia: Media = {
    id: 'media123',
    title: 'Test Movie',
    year: 2024,
    type: 'MOVIE',
    thumbnailUrl: 'http://example.com/thumb.jpg',
    plexRatingKey: 'plex123',
    duration: 7200000
  };

  const mockSession: Session = {
    id: 'session123',
    name: 'Test Session',
    ownerId: 'user123',
    status: 'active',
    currentRound: 1,
    maxRounds: 5,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockVote: Vote = {
    id: 'vote123',
    sessionId: 'session123',
    userId: 'user123',
    mediaId: 'media123',
    round: 1,
    voteType: 'UPVOTE',
    createdAt: new Date()
  };

  beforeEach(async () => {
    indexedDBService = new IndexedDBService();
    await indexedDBService.initialize();
  });

  afterEach(async () => {
    await indexedDBService.clear();
  });

  describe('initialization', () => {
    it('should create database and object stores', async () => {
      const db = await indexedDBService.getDatabase();
      const storeNames = Array.from(db.objectStoreNames);

      expect(storeNames).toContain('media');
      expect(storeNames).toContain('sessions');
      expect(storeNames).toContain('votes');
    });

    it('should handle version updates', async () => {
      // Simulate version update
      await indexedDBService.close();
      const newService = new IndexedDBService();
      await newService.initialize(2); // New version

      const db = await newService.getDatabase();
      expect(db.version).toBe(2);
    });
  });

  describe('media operations', () => {
    it('should store and retrieve media', async () => {
      await indexedDBService.setMedia(mockMedia);
      const result = await indexedDBService.getMedia(mockMedia.id);
      expect(result).toEqual(mockMedia);
    });

    it('should update existing media', async () => {
      await indexedDBService.setMedia(mockMedia);
      const updatedMedia = { ...mockMedia, title: 'Updated Title' };
      await indexedDBService.setMedia(updatedMedia);
      
      const result = await indexedDBService.getMedia(mockMedia.id);
      expect(result).toEqual(updatedMedia);
    });

    it('should delete media', async () => {
      await indexedDBService.setMedia(mockMedia);
      await indexedDBService.deleteMedia(mockMedia.id);
      
      const result = await indexedDBService.getMedia(mockMedia.id);
      expect(result).toBeNull();
    });

    it('should get all media', async () => {
      const media2 = { ...mockMedia, id: 'media456' };
      await indexedDBService.setMedia(mockMedia);
      await indexedDBService.setMedia(media2);
      
      const result = await indexedDBService.getAllMedia();
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(mockMedia);
      expect(result).toContainEqual(media2);
    });
  });

  describe('session operations', () => {
    it('should store and retrieve session', async () => {
      await indexedDBService.setSession(mockSession);
      const result = await indexedDBService.getSession(mockSession.id);
      expect(result).toEqual(mockSession);
    });

    it('should update existing session', async () => {
      await indexedDBService.setSession(mockSession);
      const updatedSession = { ...mockSession, currentRound: 2 };
      await indexedDBService.setSession(updatedSession);
      
      const result = await indexedDBService.getSession(mockSession.id);
      expect(result).toEqual(updatedSession);
    });

    it('should delete session', async () => {
      await indexedDBService.setSession(mockSession);
      await indexedDBService.deleteSession(mockSession.id);
      
      const result = await indexedDBService.getSession(mockSession.id);
      expect(result).toBeNull();
    });

    it('should get recent sessions', async () => {
      const session2 = { ...mockSession, id: 'session456' };
      await indexedDBService.setSession(mockSession);
      await indexedDBService.setSession(session2);
      
      const result = await indexedDBService.getRecentSessions(5);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(mockSession);
      expect(result).toContainEqual(session2);
    });
  });

  describe('vote operations', () => {
    it('should store and retrieve vote', async () => {
      await indexedDBService.setVote(mockVote);
      const result = await indexedDBService.getVote(mockVote.id);
      expect(result).toEqual(mockVote);
    });

    it('should get votes by session', async () => {
      const vote2 = { ...mockVote, id: 'vote456' };
      await indexedDBService.setVote(mockVote);
      await indexedDBService.setVote(vote2);
      
      const result = await indexedDBService.getVotesBySession(mockSession.id);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(mockVote);
      expect(result).toContainEqual(vote2);
    });

    it('should get votes by round', async () => {
      const vote2 = { ...mockVote, round: 2 };
      await indexedDBService.setVote(mockVote);
      await indexedDBService.setVote(vote2);
      
      const result = await indexedDBService.getVotesByRound(mockSession.id, 1);
      expect(result).toHaveLength(1);
      expect(result).toContainEqual(mockVote);
    });

    it('should delete vote', async () => {
      await indexedDBService.setVote(mockVote);
      await indexedDBService.deleteVote(mockVote.id);
      
      const result = await indexedDBService.getVote(mockVote.id);
      expect(result).toBeNull();
    });
  });

  describe('batch operations', () => {
    it('should clear all stores', async () => {
      await indexedDBService.setMedia(mockMedia);
      await indexedDBService.setSession(mockSession);
      await indexedDBService.setVote(mockVote);
      
      await indexedDBService.clear();
      
      const media = await indexedDBService.getAllMedia();
      const sessions = await indexedDBService.getRecentSessions(10);
      const votes = await indexedDBService.getVotesBySession(mockSession.id);
      
      expect(media).toHaveLength(0);
      expect(sessions).toHaveLength(0);
      expect(votes).toHaveLength(0);
    });

    it('should handle bulk operations', async () => {
      const mediaItems = [mockMedia, { ...mockMedia, id: 'media456' }];
      await indexedDBService.setMediaBulk(mediaItems);
      
      const result = await indexedDBService.getAllMedia();
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(mediaItems[0]);
      expect(result).toContainEqual(mediaItems[1]);
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors', async () => {
      await indexedDBService.close();
      // Simulate connection error
      (global as any).indexedDB = null;
      
      await expect(indexedDBService.initialize())
        .rejects.toThrow('IndexedDB not supported');
    });

    it('should handle transaction errors', async () => {
      const db = await indexedDBService.getDatabase();
      jest.spyOn(db, 'transaction').mockImplementation(() => {
        throw new Error('Transaction failed');
      });

      await expect(indexedDBService.setMedia(mockMedia))
        .rejects.toThrow('Transaction failed');
    });
  });
});
