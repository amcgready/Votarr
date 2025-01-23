// src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { PlexService } from '../services/plexService';
import { AppError } from '../errors/AppError';
import { asyncHandler } from '../utils/asyncHandler';

export class AuthController {
  private authService: AuthService;
  private plexService: PlexService;

  constructor() {
    this.authService = new AuthService();
    this.plexService = new PlexService();
  }

  initPlexAuth = asyncHandler(async (req: Request, res: Response) => {
    const { clientId, product, platform } = req.body;
    const authUrl = await this.plexService.getAuthUrl(clientId, product, platform);
    res.json({ authUrl });
  });

  handlePlexCallback = asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.query;
    
    if (!code || typeof code !== 'string') {
      throw new AppError(400, 'Invalid authorization code');
    }

    const authResult = await this.plexService.authenticateWithCode(code);
    const tokens = await this.authService.handlePlexAuth(authResult);

    res.json(tokens);
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new AppError(400, 'Refresh token is required');
    }

    const tokens = await this.authService.refreshTokens(refreshToken);
    res.json(tokens);
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    await this.authService.logout(req.user.id);
    res.status(200).json({ message: 'Logged out successfully' });
  });

  getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.authService.getCurrentUser(req.user.id);
    res.json(user);
  });
}
