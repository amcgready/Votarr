// src/services/__tests__/authService.test.ts
import { AuthService } from '../authService';
import { PlexService } from '../plexService';
import prisma from '../../lib/prisma';
import jwt from 'jsonwebtoken';
import { AppError } from '../../errors/AppError';
import { mockUser, mockPlexToken } from '../../utils/testHelpers';

jest.mock('../plexService');
jest.mock('../../lib/prisma');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  const mockPlexService = PlexService as jest.Mocked<typeof PlexService>;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('loginWithPlex', () => {
    const plexToken = mockPlexToken;

    it('should successfully authenticate a user with Plex', async () => {
      // Mock Plex service response
      mockPlexService.prototype.validateToken.mockResolvedValue(mockUser);
      (prisma.user.upsert as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

      const result = await authService.loginWithPlex(plexToken);

      expect(result).toEqual({
        token: 'mock-jwt-token',
        user: mockUser,
      });
      expect(mockPlexService.prototype.validateToken).toHaveBeenCalledWith(plexToken);
      expect(prisma.user.upsert).toHaveBeenCalled();
    });

    it('should throw an error if Plex token is invalid', async () => {
      mockPlexService.prototype.validateToken.mockRejectedValue(
        new Error('Invalid token')
      );

      await expect(authService.loginWithPlex(plexToken)).rejects.toThrow(AppError);
    });

    it('should handle database errors gracefully', async () => {
      mockPlexService.prototype.validateToken.mockResolvedValue(mockUser);
      (prisma.user.upsert as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await expect(authService.loginWithPlex(plexToken)).rejects.toThrow(AppError);
    });
  });

  describe('validateToken', () => {
    const mockToken = 'valid-jwt-token';

    it('should successfully validate a JWT token', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: mockUser.id });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.validateToken(mockToken);

      expect(result).toEqual(mockUser);
      expect(jwt.verify).toHaveBeenCalledWith(
        mockToken,
        process.env.JWT_SECRET
      );
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should throw an error for invalid JWT token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.validateToken(mockToken)).rejects.toThrow(AppError);
    });

    it('should throw an error if user not found', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'non-existent-id' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.validateToken(mockToken)).rejects.toThrow(AppError);
    });
  });

  describe('refreshToken', () => {
    const mockRefreshToken = 'valid-refresh-token';

    it('should successfully refresh a token', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: mockUser.id });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('new-jwt-token');

      const result = await authService.refreshToken(mockRefreshToken);

      expect(result).toEqual({
        token: 'new-jwt-token',
        user: mockUser,
      });
    });

    it('should throw an error for expired refresh token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Token expired');
      });

      await expect(authService.refreshToken(mockRefreshToken)).rejects.toThrow(
        AppError
      );
    });
  });

  describe('logout', () => {
    it('should successfully log out a user', async () => {
      const userId = 'test-user-id';
      (prisma.session.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      await authService.logout(userId);

      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should handle logout even if no active sessions exist', async () => {
      const userId = 'test-user-id';
      (prisma.session.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

      await authService.logout(userId);

      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });
});
