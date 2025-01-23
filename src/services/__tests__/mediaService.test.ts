// src/services/__tests__/mediaService.test.ts
import { MediaService } from '../mediaService';
import { PlexService } from '../plexService';
import prisma from '../../lib/prisma';
import { AppError } from '../../errors/AppError';
import { mockMedia, mockSearchResults } from '../../utils/testHelpers';

jest.mock('../plexService');
jest.mock('../../lib/prisma');

describe('MediaService', () => {
  let mediaService: MediaService;
  const mockPlexService = PlexService as jest.Mocked<typeof PlexService>;

  beforeEach(() => {
    mediaService = new MediaService();
    jest.clearAllMocks();
  });

  describe('searchMedia', () => {
    const searchQuery = {
      query: 'test movie',
      type: 'movie',
      year: 2024
    };

    it('successfully searches media through Plex', async () => {
      mockPlexService.prototype.searchMedia.mockResolvedValue(mockSearchResults);

      const results = await mediaService.searchMedia(searchQuery);

      expect(results).toEqual(mockSearchResults);
      expect(mockPlexService.prototype.searchMedia).toHaveBeenCalledWith(
        searchQuery
      );
    });

    it('filters results by media type', async () => {
      const mixedResults = [
        { ...mockMedia, type: 'movie' },
        { ...mockMedia, type: 'show' }
      ];
      mockPlexService.prototype.searchMedia.mockResolvedValue(mixedResults);

      const results = await mediaService.searchMedia({
        ...searchQuery,
        type: 'movie'
      });

      expect(results.length).toBe(1);
      expect(results[0].type).toBe('movie');
    });

    it('handles search errors gracefully', async () => {
      mockPlexService.prototype.searchMedia.mockRejectedValue(
        new Error('Search failed')
      );

      await expect(mediaService.searchMedia(searchQuery))
        .rejects
        .toThrow(AppError);
    });

    it('caches search results', async () => {
      mockPlexService.prototype.searchMedia.mockResolvedValue(mockSearchResults);

      await mediaService.searchMedia(searchQuery);
      await mediaService.searchMedia(searchQuery);

      expect(mockPlexService.prototype.searchMedia).toHaveBeenCalledTimes(1);
    });
  });

  describe('getMediaDetails', () => {
    const mediaId = 'test-media-id';

    it('retrieves detailed media information', async () => {
      mockPlexService.prototype.getMediaDetails.mockResolvedValue(mockMedia);

      const result = await mediaService.getMediaDetails(mediaId);

      expect(result).toEqual(mockMedia);
      expect(mockPlexService.prototype.getMediaDetails).toHaveBeenCalledWith(
        mediaId
      );
    });

    it('includes watch history when requested', async () => {
      const mockWatchHistory = [
        { userId: 'user1', timestamp: new Date() }
      ];
      mockPlexService.prototype.getMediaDetails.mockResolvedValue(mockMedia);
      (prisma.watchHistory.findMany as jest.Mock).mockResolvedValue(mockWatchHistory);

      const result = await mediaService.getMediaDetails(mediaId, { 
        includeWatchHistory: true 
      });

      expect(result.watchHistory).toEqual(mockWatchHistory);
    });

    it('handles missing media gracefully', async () => {
      mockPlexService.prototype.getMediaDetails.mockResolvedValue(null);

      await expect(mediaService.getMediaDetails(mediaId))
        .rejects
        .toThrow('Media not found');
    });
  });

  describe('getSimilarMedia', () => {
    const mediaId = 'test-media-id';

    it('retrieves similar media recommendations', async () => {
      mockPlexService.prototype.getSimilarMedia.mockResolvedValue(mockSearchResults);

      const results = await mediaService.getSimilarMedia(mediaId);

      expect(results).toEqual(mockSearchResults);
      expect(mockPlexService.prototype.getSimilarMedia).toHaveBeenCalledWith(
        mediaId
      );
    });

    it('limits number of recommendations', async () => {
      const manyResults = Array(20).fill(mockMedia);
      mockPlexService.prototype.getSimilarMedia.mockResolvedValue(manyResults);

      const results = await mediaService.getSimilarMedia(mediaId, { limit: 5 });

      expect(results.length).toBe(5);
    });
  });

  describe('updateWatchStatus', () => {
    const watchData = {
      userId: 'test-user',
      mediaId: 'test-media',
      progress: 0.5
    };

    it('successfully updates watch status', async () => {
      (prisma.watchHistory.upsert as jest.Mock).mockResolvedValue({
        ...watchData,
        id: 'watch-1'
      });

      const result = await mediaService.updateWatchStatus(watchData);

      expect(result.progress).toBe(watchData.progress);
      expect(prisma.watchHistory.upsert).toHaveBeenCalled();
    });

    it('validates progress percentage', async () => {
      const invalidData = { ...watchData, progress: 1.5 };

      await expect(mediaService.updateWatchStatus(invalidData))
        .rejects
        .toThrow('Invalid progress value');
    });
  });

  describe('getRecommendations', () => {
    const userId = 'test-user';

    it('generates personalized recommendations', async () => {
      const mockWatchHistory = [{ mediaId: 'media1', rating: 5 }];
      (prisma.watchHistory.findMany as jest.Mock).mockResolvedValue(mockWatchHistory);
      mockPlexService.prototype.getSimilarMedia.mockResolvedValue(mockSearchResults);

      const recommendations = await mediaService.getRecommendations(userId);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(mockPlexService.prototype.getSimilarMedia).toHaveBeenCalled();
    });

    it('filters out already watched content', async () => {
      const watchedMedia = mockSearchResults[0];
      const mockWatchHistory = [{ mediaId: watchedMedia.id }];
      (prisma.watchHistory.findMany as jest.Mock).mockResolvedValue(mockWatchHistory);
      mockPlexService.prototype.getSimilarMedia.mockResolvedValue(mockSearchResults);

      const recommendations = await mediaService.getRecommendations(userId);

      expect(recommendations).not.toContainEqual(watchedMedia);
    });
  });
});
