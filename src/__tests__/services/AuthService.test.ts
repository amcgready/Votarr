// src/__tests__/services/AuthService.test.ts
import { AuthService } from '../../services/AuthService';
import { UserService } from '../../services/UserService';
import { PrismaClient } from '@prisma/client';
import { generateToken, verifyToken } from '../../utils/jwt';
import { hashPassword } from '../../utils/auth';
import { AuthenticationError, TokenExpiredError } from '../../errors';
import { User, LoginDto, RegisterDto } from '../../types';

// Mock dependencies
jest.mock('../../services/UserService');
jest.mock('../../utils/jwt');
jest.mock('../../utils/auth');
jest.mock('@prisma/client');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserService: jest.Mocked<UserService>;
  let mockPrisma: jest.Mocked<PrismaClient>;

  const mockUser: User = {
    id: 'user123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
    plexToken: null
  };

  const mockLoginDto: LoginDto = {
    email: 'test@example.com',
    password: 'password123'
  };

  const mockRegisterDto: RegisterDto = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  };

  const mockToken = 'mock-jwt-token';
  const mockRefreshToken = 'mock-refresh-token';

  beforeEach(() => {
    mockUserService = {
      createUser: jest.fn(),
      getUserByEmail: jest.fn(),
      validateCredentials: jest.fn(),
      updateUser: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    mockPrisma = {
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      }
    } as unknown as jest.Mocked<PrismaClient>;

    authService = new AuthService(mockUserService, mockPrisma);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockUserService.createUser.mockResolvedValue(mockUser);
      (generateToken as jest.Mock).mockReturnValue(mockToken);
      mockPrisma.refreshToken.create.mockResolvedValue({ token: mockRefreshToken });

      const result = await authService.register(mockRegisterDto);

      expect(result).toEqual({
        user: mockUser,
        accessToken: mockToken,
        refreshToken: mockRefreshToken
      });
      expect(mockUserService.createUser).toHaveBeenCalledWith({
        email: mockRegisterDto.email,
        password: mockRegisterDto.password,
        name: mockRegisterDto.name
      });
    });

    it('should throw error if email already exists', async () => {
      mockUserService.createUser.mockRejectedValue(new Error('Email already exists'));

      await expect(authService.register(mockRegisterDto))
        .rejects.toThrow('Email already exists');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      mockUserService.validateCredentials.mockResolvedValue(true);
      mockUserService.getUserByEmail.mockResolvedValue(mockUser);
      (generateToken as jest.Mock).mockReturnValue(mockToken);
      mockPrisma.refreshToken.create.mockResolvedValue({ token: mockRefreshToken });

      const result = await authService.login(mockLoginDto);

      expect(result).toEqual({
        user: mockUser,
        accessToken: mockToken,
        refreshToken: mockRefreshToken
      });
    });

    it('should throw error for invalid credentials', async () => {
      mockUserService.validateCredentials.mockResolvedValue(false);

      await expect(authService.login(mockLoginDto))
        .rejects.toThrow(AuthenticationError);
    });

    it('should throw error for non-existent user', async () => {
      mockUserService.getUserByEmail.mockResolvedValue(null);

      await expect(authService.login(mockLoginDto))
        .rejects.toThrow(AuthenticationError);
    });
  });

  describe('refreshToken', () => {
    const mockStoredRefreshToken = {
      id: 'token123',
      token: mockRefreshToken,
      userId: 'user123',
      expiresAt: new Date(Date.now() + 86400000), // tomorrow
      createdAt: new Date()
    };

    it('should refresh tokens successfully', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockStoredRefreshToken);
      mockUserService.getUser.mockResolvedValue(mockUser);
      (generateToken as jest.Mock).mockReturnValue(mockToken);
      mockPrisma.refreshToken.delete.mockResolvedValue(mockStoredRefreshToken);
      mockPrisma.refreshToken.create.mockResolvedValue({ 
        ...mockStoredRefreshToken,
        token: 'new-refresh-token'
      });

      const result = await authService.refreshToken(mockRefreshToken);

      expect(result).toEqual({
        accessToken: mockToken,
        refreshToken: 'new-refresh-token'
      });
    });

    it('should throw error for invalid refresh token', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(authService.refreshToken(mockRefreshToken))
        .rejects.toThrow(AuthenticationError);
    });

    it('should throw error for expired refresh token', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        ...mockStoredRefreshToken,
        expiresAt: new Date(Date.now() - 1000) // expired
      });

      await expect(authService.refreshToken(mockRefreshToken))
        .rejects.toThrow(TokenExpiredError);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await authService.logout('user123');

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user123' }
      });
    });
  });

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      (verifyToken as jest.Mock).mockReturnValue({ userId: 'user123' });
      mockUserService.getUser.mockResolvedValue(mockUser);

      const result = await authService.validateToken(mockToken);

      expect(result).toEqual(mockUser);
    });

    it('should throw error for invalid token', async () => {
      (verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.validateToken(mockToken))
        .rejects.toThrow(AuthenticationError);
    });

    it('should throw error for non-existent user', async () => {
      (verifyToken as jest.Mock).mockReturnValue({ userId: 'user123' });
      mockUserService.getUser.mockResolvedValue(null);

      await expect(authService.validateToken(mockToken))
        .rejects.toThrow(AuthenticationError);
    });
  });

  describe('validatePlexAuth', () => {
    it('should validate plex auth successfully', async () => {
      const mockPlexToken = 'plex-token-123';
      const mockPlexUser = {
        ...mockUser,
        plexToken: mockPlexToken
      };

      mockUserService.getUserByEmail.mockResolvedValue(mockPlexUser);
      mockUserService.updateUser.mockResolvedValue(mockPlexUser);
      (generateToken as jest.Mock).mockReturnValue(mockToken);
      mockPrisma.refreshToken.create.mockResolvedValue({ token: mockRefreshToken });

      const result = await authService.validatePlexAuth({
        email: 'test@example.com',
        plexToken: mockPlexToken
      });

      expect(result).toEqual({
        user: mockPlexUser,
        accessToken: mockToken,
        refreshToken: mockRefreshToken
      });
    });

    it('should create new user if not exists during plex auth', async () => {
      const mockPlexToken = 'plex-token-123';
      mockUserService.getUserByEmail.mockResolvedValue(null);
      mockUserService.createUser.mockResolvedValue(mockUser);
      (generateToken as jest.Mock).mockReturnValue(mockToken);
      mockPrisma.refreshToken.create.mockResolvedValue({ token: mockRefreshToken });

      const result = await authService.validatePlexAuth({
        email: 'test@example.com',
        plexToken: mockPlexToken,
        name: 'Test User'
      });

      expect(mockUserService.createUser).toHaveBeenCalled();
      expect(result).toEqual({
        user: mockUser,
        accessToken: mockToken,
        refreshToken: mockRefreshToken
      });
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      (generateToken as jest.Mock).mockReturnValue(mockToken);
      mockPrisma.refreshToken.create.mockResolvedValue({ token: mockRefreshToken });

      const result = await authService.generateTokens(mockUser);

      expect(result).toEqual({
        accessToken: mockToken,
        refreshToken: mockRefreshToken
      });
      expect(generateToken).toHaveBeenCalledWith({ userId: mockUser.id });
    });
  });
});
