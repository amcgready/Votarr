// src/controllers/mediaController.ts
import { Request, Response, NextFunction } from 'express';
import { PlexService } from '../services/plexService';
import { AppError } from '../errors/AppError';
import { validateMediaRequest } from '../middleware/validation';
import { MediaSearchParams, MediaDetails } from '../types/media';
import { logger } from '../config/logger';

export class MediaController {
  private plexService: PlexService;

  constructor() {
    this.plexService = new PlexService();
  }

  public search = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const searchParams = validateMediaRequest(req.query as MediaSearchParams);
      const results = await this.plexService.searchMedia(searchParams);
      
      logger.info(`Media search performed with params: ${JSON.stringify(searchParams)}`);
      res.status(200).json({ success: true, data: results });
    } catch (error) {
      next(new AppError('Failed to search media', 500, error));
    }
  };

  public getDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { mediaId } = req.params;
      const details = await this.plexService.getMediaDetails(mediaId);
      
      if (!details) {
        throw new AppError('Media not found', 404);
      }

      logger.info(`Media details retrieved for ID: ${mediaId}`);
      res.status(200).json({ success: true, data: details });
    } catch (error) {
      next(new AppError('Failed to get media details', 500, error));
    }
  };

  public getSimilar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { mediaId } = req.params;
      const similar = await this.plexService.getSimilarMedia(mediaId);
      
      logger.info(`Similar media retrieved for ID: ${mediaId}`);
      res.status(200).json({ success: true, data: similar });
    } catch (error) {
      next(new AppError('Failed to get similar media', 500, error));
    }
  };

  public getRecommended = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const recommended = await this.plexService.getRecommendedMedia(userId);
      
      logger.info(`Recommended media retrieved for user: ${userId}`);
      res.status(200).json({ success: true, data: recommended });
    } catch (error) {
      next(new AppError('Failed to get recommendations', 500, error));
    }
  };

  public updateWatchStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { mediaId } = req.params;
      const { status, progress } = req.body;
      const { userId } = req.user!;

      await this.plexService.updateWatchStatus(userId, mediaId, status, progress);
      
      logger.info(`Watch status updated for media ${mediaId} by user ${userId}`);
      res.status(200).json({ success: true });
    } catch (error) {
      next(new AppError('Failed to update watch status', 500, error));
    }
  };
}

export default new MediaController();
