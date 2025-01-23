// src/__tests__/services/MediaService.test.ts
import { MediaService } from '../../services/MediaService';
import { PlexAPI } from '../../lib/PlexAPI';
import { UserService } from '../../services/UserService';
import { Media, MediaType, PlexLibrary, SearchResult } from '../../types';
import { MediaNotFoundError, PlexAuthenticationError } from '../../errors';

// Mock dependencies
jest.mock('../../lib/PlexAPI');
jest.mock('../../services/UserService');

describe('MediaService', () => {
  let mediaService: MediaService;
  let mockPlexAPI: jest.Mocked<PlexAPI>;
  let mockUserService: jest.Mocked<UserService>;

  const mockMedia: Media = {
    id: 'media123',
    title: 'Test Movie',
    year: 2024,
    type: MediaType.MOVIE,
    thumbnailUrl: 'http://example.com/thumb.jpg',
    plexRatingKey: 'plex123',
    duration: 7200000, // 2 hours in ms
    summary: 'A test movie',
    genres: ['Action', 'Drama'],
    directors: ['Test Director'],
    rating: 'PG-13'
  };

  const mockPlexLibrary: PlexLibrary = {
    id: 'lib123',
    name: 'Movies',
    type: MediaType.MOVIE,
    count: 100
  };

  beforeEach(() => {
    mockPlexAPI = {
      authenticate: jest.fn(),
      getLibraries: jest.fn(),
      getLibraryContent: jest.fn(),
      searchMedia: jest.fn(),
      getMediaDetails: jest.fn(),
    } as unknown as jest.Mocked<PlexAPI>;

    mockUserService = {
      validatePlexToken: jest.fn(),
      getUser: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    mediaService = new MediaService(mockPlexAPI, mockUserService);
  });

  describe('getLibraries', () => {
    it('should return libraries for authenticated user', async () => {
      const userId = 'user123';
      const mockLibraries = [mockPlexLibrary];
      
      mockUserService.validatePlexToken.mockResolvedValue(true);
      mockPlexAPI.getLibraries.mockResolvedValue(mockLibraries);

      const result = await mediaService.getLibraries(userId);

      expect(result).toEqual(mockLibraries);
      expect(mockUserService.validatePlexToken).toHaveBeenCalledWith(userId);
    });

    it('should throw error for unauthenticated user', async () => {
      const userId = 'user123';
      mockUserService.validatePlexToken.mockResolvedValue(false);

      await expect(mediaService.getLibraries(userId))
        .rejects.toThrow(PlexAuthenticationError);
    });
  });

  describe('getLibraryContent', () => {
    const libraryId = 'lib123';
    const userId = 'user123';

    it('should return paginated library content', async () => {
      const mockContent = {
        items: [mockMedia],
        total: 100,
        offset: 0,
        limit: 20
      };

      mockUserService.validatePlexToken.mockResolvedValue(true);
      mockPlexAPI.getLibraryContent.mockResolvedValue(mockContent);

      const result = await mediaService.getLibraryContent(userId, libraryId, 0, 20);

      expect(result).toEqual(mockContent);
      expect(mockPlexAPI.getLibraryContent).toHaveBeenCalledWith(
        libraryId,
        0,
        20
      );
    });

    it('should handle sorting and filtering', async () => {
      const mockContent = {
        items: [mockMedia],
        total: 100,
        offset: 0,
        limit: 20
      };

      mockUserService.validatePlexToken.mockResolvedValue(true);
      mockPlexAPI.getLibraryContent.mockResolvedValue(mockContent);

      const result = await mediaService.getLibraryContent(
        userId,
        libraryId,
        0,
        20,
        'title',
        'asc',
        { year: 2024 }
      );

      expect(result).toEqual(mockContent);
      expect(mockPlexAPI.getLibraryContent).toHaveBeenCalledWith(
        libraryId,
        0,
        20,
        'title',
        'asc',
        { year: 2024 }
      );
    });
  });

  describe('searchMedia', () => {
    const userId = 'user123';
    const query = 'test movie';

    it('should return search results', async () => {
      const mockResults: SearchResult = {
        items: [mockMedia],
        total: 1
      };

      mockUserService.validatePlexToken.mockResolvedValue(true);
      mockPlexAPI.searchMedia.mockResolvedValue(mockResults);

      const result = await mediaService.searchMedia(userId, query);

      expect(result).toEqual(mockResults);
      expect(mockPlexAPI.searchMedia).toHaveBeenCalledWith(query);
    });

    it('should filter by media type', async () => {
      const mockResults: SearchResult = {
        items: [mockMedia],
        total: 1
      };

      mockUserService.validatePlexToken.mockResolvedValue(true);
      mockPlexAPI.searchMedia.mockResolvedValue(mockResults);

      const result = await mediaService.searchMedia(userId, query, MediaType.MOVIE);

      expect(result).toEqual(mockResults);
      expect(mockPlexAPI.searchMedia).toHaveBeenCalledWith(query, MediaType.MOVIE);
    });
  });

  describe('getMediaDetails', () => {
    const userId = 'user123';
    const mediaId = 'media123';

    it('should return detailed media information', async () => {
      mockUserService.validatePlexToken.mockResolvedValue(true);
      mockPlexAPI.getMediaDetails.mockResolvedValue(mockMedia);

      const result = await mediaService.getMediaDetails(userId, mediaId);

      expect(result).toEqual(mockMedia);
      expect(mockPlexAPI.getMediaDetails).toHaveBeenCalledWith(mediaId);
    });

    it('should throw error for non-existent media', async () => {
      mockUserService.validatePlexToken.mockResolvedValue(true);
      mockPlexAPI.getMediaDetails.mockRejectedValue(new Error('Media not found'));

      await expect(mediaService.getMediaDetails(userId, mediaId))
        .rejects.toThrow(MediaNotFoundError);
    });
  });

  describe('validateMediaAccess', () => {
    const userId = 'user123';
    const mediaIds = ['media123', 'media456'];

    it('should validate access to multiple media items', async () => {
      mockUserService.validatePlexToken.mockResolvedValue(true);
      mockPlexAPI.getMediaDetails.mockResolvedValue(mockMedia);

      const result = await mediaService.validateMediaAccess(userId, mediaIds);

      expect(result).toBe(true);
      expect(mockPlexAPI.getMediaDetails).toHaveBeenCalledTimes(mediaIds.length);
    });

    it('should return false if any media item is not accessible', async () => {
      mockUserService.validatePlexToken.mockResolvedValue(true);
      mockPlexAPI.getMediaDetails
        .mockResolvedValueOnce(mockMedia)
        .mockRejectedValueOnce(new Error('Media not found'));

      const result = await mediaService.validateMediaAccess(userId, mediaIds);

      expect(result).toBe(false);
    });
  });

  describe('getMediaMetadata', () => {
    const userId = 'user123';
    const mediaId = 'media123';

    it('should return media metadata', async () => {
      const mockMetadata = {
        duration: 7200000,
        bitrate: '2000 kbps',
        resolution: '1080p',
        audioChannels: '5.1',
        subtitles: ['English', 'Spanish']
      };

      mockUserService.validatePlexToken.mockResolvedValue(true);
      mockPlexAPI.getMediaDetails.mockResolvedValue({
        ...mockMedia,
        metadata: mockMetadata
      });

      const result = await mediaService.getMediaMetadata(userId, mediaId);

      expect(result).toEqual(mockMetadata);
    });

    it('should throw error if metadata is not available', async () => {
      mockUserService.validatePlexToken.mockResolvedValue(true);
      mockPlexAPI.getMediaDetails.mockResolvedValue(mockMedia);

      await expect(mediaService.getMediaMetadata(userId, mediaId))
        .rejects.toThrow('Metadata not available');
    });
  });

  describe('getSimilarMedia', () => {
    const userId = 'user123';
    const mediaId = 'media123';

    it('should return similar media items', async () => {
      const mockSimilar = [mockMedia];
      mockUserService.validatePlexToken.mockResolvedValue(true);
      mockPlexAPI.getMediaDetails.mockResolvedValue(mockMedia);
      mockPlexAPI.searchMedia.mockResolvedValue({ items: mockSimilar, total: 1 });

      const result = await mediaService.getSimilarMedia(userId, mediaId);

      expect(result).toEqual(mockSimilar);
    });

    it('should filter out the original media from results', async () => {
      const similarMedia = { ...mockMedia, id: 'media456' };
      mockUserService.validatePlexToken.mockResolvedValue(true);
      mockPlexAPI.getMediaDetails.mockResolvedValue(mockMedia);
      mockPlexAPI.searchMedia.mockResolvedValue({
        items: [mockMedia, similarMedia],
        total: 2
      });

      const result = await mediaService.getSimilarMedia(userId, mediaId);

      expect(result).toEqual([similarMedia]);
    });
  });
});
