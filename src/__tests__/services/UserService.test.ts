// src/__tests__/services/UserService.test.ts
import { UserService } from '../../services/UserService';
import { PrismaClient } from '@prisma/client';
import { User, CreateUserDto, UpdateUserDto } from '../../types';
import { hashPassword, comparePasswords } from '../../utils/auth';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('../../utils/auth');

describe('UserService', () => {
  // ... [Previous test setup and other test suites remain the same]

  describe('validateCredentials', () => {
    it('should return true for valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: 'hashed-password'
      });
      (comparePasswords as jest.Mock).mockResolvedValue(true);

      const result = await userService.validateCredentials('test@example.com', 'correct-password');

      expect(result).toBe(true);
      expect(comparePasswords).toHaveBeenCalledWith('correct-password', 'hashed-password');
    });

    it('should return false for invalid password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: 'hashed-password'
      });
      (comparePasswords as jest.Mock).mockResolvedValue(false);

      const result = await userService.validateCredentials('test@example.com', 'wrong-password');

      expect(result).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.validateCredentials('nonexistent@example.com', 'password');

      expect(result).toBe(false);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.delete.mockResolvedValue(mockUser);

      const result = await userService.deleteUser('user123');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user123' }
      });
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(userService.deleteUser('user123'))
        .rejects.toThrow('User not found');
    });
  });

  describe('searchUsers', () => {
    it('should search users by name', async () => {
      const mockUsers = [mockUser];
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await userService.searchUsers('Test');

      expect(result).toEqual(mockUsers);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'Test', mode: 'insensitive' } },
            { email: { contains: 'Test', mode: 'insensitive' } }
          ]
        }
      });
    });

    it('should return empty array when no matches found', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await userService.searchUsers('NonexistentUser');

      expect(result).toEqual([]);
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      const oldHashedPassword = 'old-hashed-password';
      const newHashedPassword = 'new-hashed-password';
      
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: oldHashedPassword
      });
      (comparePasswords as jest.Mock).mockResolvedValue(true);
      (hashPassword as jest.Mock).mockResolvedValue(newHashedPassword);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        password: newHashedPassword
      });

      const result = await userService.updatePassword('user123', 'oldPassword', 'newPassword');

      expect(result).toBeTruthy();
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user123' },
        data: { password: newHashedPassword }
      });
    });

    it('should throw error if old password is incorrect', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: 'hashed-password'
      });
      (comparePasswords as jest.Mock).mockResolvedValue(false);

      await expect(userService.updatePassword('user123', 'wrongPassword', 'newPassword'))
        .rejects.toThrow('Invalid current password');
    });
  });

  describe('validatePlexToken', () => {
    it('should return true for valid plex token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        plexToken: 'valid-token'
      });

      const result = await userService.validatePlexToken('user123');

      expect(result).toBe(true);
    });

    it('should return false for missing plex token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        plexToken: null
      });

      const result = await userService.validatePlexToken('user123');

      expect(result).toBe(false);
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(userService.validatePlexToken('user123'))
        .rejects.toThrow('User not found');
    });
  });
});
