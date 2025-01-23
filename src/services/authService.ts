// src/services/authService.ts
import { prisma } from '../index';
import { PlexAuthResult } from '../types/plex';
import { generateTokens, verifyToken } from '../utils/jwt';
import { AppError } from '../errors/AppError';
import { logger } from '../utils/logger';

export class AuthService {
  async handlePlexAuth(plexAuthResult: PlexAuthResult) {
    const { plexId, email, username, avatar } = plexAuthResult;

    let user = await prisma.user.findUnique({
      where: { plexId }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          plexId,
          email,
          username,
          avatar
        }
      });
      logger.info(`New user created: ${user.id}`);
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          email,
          username,
          avatar
        }
      });
      logger.info(`User updated: ${user.id}`);
    }

    return generateTokens(user.id);
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await verifyToken(refreshToken);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId }
      });

      if (!user) {
        throw new AppError(401, 'User not found');
      }

      return generateTokens(user.id);
    } catch (error) {
      throw new AppError(401, 'Invalid refresh token');
    }
  }

  async logout(userId: string) {
    // Implement any necessary cleanup
    logger.info(`User logged out: ${userId}`);
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  }
}
