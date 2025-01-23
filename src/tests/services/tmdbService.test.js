// src/tests/services/tmdbService.test.js
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { tmdbService } from '../../services/tmdbService';
import logger from '../../utils/logger';

// Mock the environment variables
vi.mock('../../config/env', () => ({
  TMDB_API_KEY: 'test-api-key',
  TMDB_BASE_URL: 'https://api.themoviedb.org/3'
}));

describe('TMDB Service', () => {
  beforeEach(async () => {
    try {
      await logger.test('TMDBService', 'Setting up test environment');
      vi.clearAllMocks();
      global.fetch = vi.fn();
      await logger.test('TMDBService', 'Test environment setup complete');
    } catch (error) {
      await logger.error('TMDBService setup failed', error);
      throw error;
    }
  });

  afterEach(async () => {
    try {
      await logger.test('TMDBService', 'Cleaning up test environment');
      vi.restoreAllMocks();
    } catch (error) {
      await logger.error('TMDBService cleanup failed', error);
    }
  });

  describe('Movie Information', () => {
    test('fetches movie details successfully', async () => {
      try {
        await logger.test('TMDBService', 'Testing movie details fetch');
        const mockMovieData = {
          id: 123,
          title: 'Test Movie',
          overview: 'A test movie description',
          release_date: '2024-01-01',
          vote_average: 8.5,
          genres: [{ id: 1, name: 'Action' }],
          runtime: 120,
          poster_path: '/poster.jpg',
          backdrop_path: '/backdrop.jpg'
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMovieData)
        });

        const result = await tmdbService.getMovieDetails('123');
        
        expect(result).toEqual(mockMovieData);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/movie/123'),
          expect.any(Object)
        );
        
        await logger.test('TMDBService', 'Movie details fetch test passed');
      } catch (error) {
        await logger.error('Movie details fetch test failed', error);
        throw error;
      }
    });

    test('handles missing movie data', async () => {
      try {
        await logger.test('TMDBService', 'Testing missing movie handling');
        global.fetch.mockResolvedValueOnce({
          ok: false,
          status: 404
        });

        await expect(tmdbService.getMovieDetails('999')).rejects.toThrow('Movie not found');
        
        await logger.test('TMDBService', 'Missing movie test passed');
      } catch (error) {
        await logger.error('Missing movie test failed', error);
        throw error;
      }
    });
  });

  describe('Search Functionality', () => {
    test('performs movie search successfully', async () => {
      try {
        await logger.test('TMDBService', 'Testing movie search');
        const mockSearchResults = {
          results: [
            { 
              id: 1, 
              title: 'Movie 1',
              release_date: '2024-01-01',
              vote_average: 7.5,
              poster_path: '/poster1.jpg'
            },
            { 
              id: 2, 
              title: 'Movie 2',
              release_date: '2024-02-01',
              vote_average: 8.0,
              poster_path: '/poster2.jpg'
            }
          ],
          total_pages: 1,
          total_results: 2
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSearchResults)
        });

        const results = await tmdbService.searchMovies('test query');
        
        expect(results.results).toHaveLength(2);
        expect(results.total_pages).toBe(1);
        expect(results.total_results).toBe(2);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/search/movie'),
          expect.any(Object)
        );
        
        await logger.test('TMDBService', 'Movie search test passed');
      } catch (error) {
        await logger.error('Movie search test failed', error);
        throw error;
      }
    });

    test('handles empty search results', async () => {
      try {
        await logger.test('TMDBService', 'Testing empty search results');
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ results: [], total_pages: 0, total_results: 0 })
        });

        const results = await tmdbService.searchMovies('nonexistent');
        
        expect(results.results).toHaveLength(0);
        expect(results.total_pages).toBe(0);
        expect(results.total_results).toBe(0);
        
        await logger.test('TMDBService', 'Empty search results test passed');
      } catch (error) {
        await logger.error('Empty search results test failed', error);
        throw error;
      }
    });

    test('handles search with pagination', async () => {
      try {
        await logger.test('TMDBService', 'Testing search pagination');
        const mockPagedResults = {
          results: [{ id: 3, title: 'Movie 3' }],
          total_pages: 2,
          total_results: 3,
          page: 2
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPagedResults)
        });

        const results = await tmdbService.searchMovies('test', 2);
        
        expect(results.page).toBe(2);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('page=2'),
          expect.any(Object)
        );
        
        await logger.test('TMDBService', 'Search pagination test passed');
      } catch (error) {
        await logger.error('Search pagination test failed', error);
        throw error;
      }
    });
  });

  describe('Recommendations', () => {
    test('fetches movie recommendations successfully', async () => {
      try {
        await logger.test('TMDBService', 'Testing recommendations fetch');
        const mockRecommendations = {
          results: [
            { 
              id: 1, 
              title: 'Recommended 1',
              vote_average: 7.5,
              release_date: '2024-01-01' 
            },
            { 
              id: 2, 
              title: 'Recommended 2',
              vote_average: 8.0,
              release_date: '2024-02-01'
            }
          ],
          total_pages: 1
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRecommendations)
        });

        const results = await tmdbService.getMovieRecommendations('123');
        
        expect(results.results).toHaveLength(2);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/movie/123/recommendations'),
          expect.any(Object)
        );
        
        await logger.test('TMDBService', 'Recommendations fetch test passed');
      } catch (error) {
        await logger.error('Recommendations fetch test failed', error);
        throw error;
      }
    });

    test('handles movies with no recommendations', async () => {
      try {
        await logger.test('TMDBService', 'Testing empty recommendations');
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ results: [], total_pages: 0 })
        });

        const results = await tmdbService.getMovieRecommendations('123');
        expect(results.results).toHaveLength(0);
        
        await logger.test('TMDBService', 'Empty recommendations test passed');
      } catch (error) {
        await logger.error('Empty recommendations test failed', error);
        throw error;
      }
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      try {
        await logger.test('TMDBService', 'Testing API error handling');
        global.fetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        });

        await expect(tmdbService.getMovieDetails('123'))
          .rejects.toThrow('API request failed: Internal Server Error');
        
        await logger.test('TMDBService', 'API error handling test passed');
      } catch (error) {
        await logger.error('API error handling test failed', error);
        throw error;
      }
    });

    test('handles network errors', async () => {
      try {
        await logger.test('TMDBService', 'Testing network error handling');
        global.fetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(tmdbService.getMovieDetails('123'))
          .rejects.toThrow('Network error');
        
        await logger.test('TMDBService', 'Network error handling test passed');
      } catch (error) {
        await logger.error('Network error handling test failed', error);
        throw error;
      }
    });

    test('handles rate limiting', async () => {
      try {
        await logger.test('TMDBService', 'Testing rate limit handling');
        global.fetch.mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers({
            'Retry-After': '30'
          })
        });

        await expect(tmdbService.getMovieDetails('123'))
          .rejects.toThrow('Rate limit exceeded. Try again in 30 seconds');
        
        await logger.test('TMDBService', 'Rate limit handling test passed');
      } catch (error) {
        await logger.error('Rate limit handling test failed', error);
        throw error;
      }
    });

    test('handles invalid API responses', async () => {
      try {
        await logger.test('TMDBService', 'Testing invalid response handling');
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(null)
        });

        await expect(tmdbService.getMovieDetails('123'))
          .rejects.toThrow('Invalid API response');
        
        await logger.test('TMDBService', 'Invalid response handling test passed');
      } catch (error) {
        await logger.error('Invalid response handling test failed', error);
        throw error;
      }
    });
  });

  describe('Configuration and Authentication', () => {
    test('includes API key in requests', async () => {
      try {
        await logger.test('TMDBService', 'Testing API key inclusion');
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({})
        });

        await tmdbService.getMovieDetails('123');
        
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('api_key=test-api-key'),
          expect.any(Object)
        );
        
        await logger.test('TMDBService', 'API key inclusion test passed');
      } catch (error) {
        await logger.error('API key inclusion test failed', error);
        throw error;
      }
    });

    test('validates configuration on initialization', async () => {
      try {
        await logger.test('TMDBService', 'Testing configuration validation');
        expect(tmdbService.isConfigured()).toBe(true);
        expect(tmdbService.getBaseUrl()).toBe('https://api.themoviedb.org/3');
        
        await logger.test('TMDBService', 'Configuration validation test passed');
      } catch (error) {
        await logger.error('Configuration validation test failed', error);
        throw error;
      }
    });

    test('handles missing configuration', async () => {
      try {
        await logger.test('TMDBService', 'Testing missing configuration handling');
        vi.mock('../../config/env', () => ({}));
        
        expect(() => tmdbService.validateConfig()).toThrow('TMDB configuration is incomplete');
        
        await logger.test('TMDBService', 'Missing configuration test passed');
      } catch (error) {
        await logger.error('Missing configuration test failed', error);
        throw error;
      }
    });
  });

  describe('Image URLs', () => {
    test('generates correct image URLs', async () => {
      try {
        await logger.test('TMDBService', 'Testing image URL generation');
        const posterPath = '/poster.jpg';
        const backdropPath = '/backdrop.jpg';
        
        expect(tmdbService.getImageUrl(posterPath, 'poster'))
          .toBe('https://image.tmdb.org/t/p/w500/poster.jpg');
        
        expect(tmdbService.getImageUrl(backdropPath, 'backdrop'))
          .toBe('https://image.tmdb.org/t/p/original/backdrop.jpg');
        
        await logger.test('TMDBService', 'Image URL generation test passed');
      } catch (error) {
        await logger.error('Image URL generation test failed', error);
        throw error;
      }
    });

    test('handles missing image paths', async () => {
      try {
        await logger.test('TMDBService', 'Testing missing image handling');
        expect(tmdbService.getImageUrl(null, 'poster')).toBeNull();
        expect(tmdbService.getImageUrl(undefined, 'backdrop')).toBeNull();
        
        await logger.test('TMDBService', 'Missing image handling test passed');
      } catch (error) {
        await logger.error('Missing image handling test failed', error);
        throw error;
      }
    });
  });
});
