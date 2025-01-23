// src/controllers/sessionController.ts
import { Request, Response, NextFunction } from 'express';
import { SessionService } from '../services/sessionService';
import { WebSocketService } from '../services/websocketService';
import { AppError } from '../errors/AppError';
import { validateSessionCreate } from '../middleware/validation';
import { Session, SessionCreateParams } from '../types/session';
import { logger } from '../config/logger';

export class SessionController {
  private sessionService: SessionService;
  private wsService: WebSocketService;

  constructor() {
    this.sessionService = new SessionService();
    this.wsService = new WebSocketService();
  }

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionParams = validateSessionCreate(req.body as SessionCreateParams);
      const { userId } = req.user!;
      
      const session = await this.sessionService.createSession({
        ...sessionParams,
        hostId: userId
      });

      logger.info(`Session created: ${session.id} by user ${userId}`);
      res.status(201).json({ success: true, data: session });
    } catch (error) {
      next(new AppError('Failed to create session', 500, error));
    }
  };

  public join = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const { userId } = req.user!;

      const session = await this.sessionService.joinSession(sessionId, userId);
      this.wsService.notifySessionUpdate(sessionId, 'USER_JOINED', { userId });

      logger.info(`User ${userId} joined session ${sessionId}`);
      res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(new AppError('Failed to join session', 500, error));
    }
  };

  public leave = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const { userId } = req.user!;

      await this.sessionService.leaveSession(sessionId, userId);
      this.wsService.notifySessionUpdate(sessionId, 'USER_LEFT', { userId });

      logger.info(`User ${userId} left session ${sessionId}`);
      res.status(200).json({ success: true });
    } catch (error) {
      next(new AppError('Failed to leave session', 500, error));
    }
  };

  public getSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const session = await this.sessionService.getSession(sessionId);

      if (!session) {
        throw new AppError('Session not found', 404);
      }

      logger.info(`Session ${sessionId} details retrieved`);
      res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(new AppError('Failed to get session', 500, error));
    }
  };

  public updateSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const { settings } = req.body;
      const { userId } = req.user!;

      const session = await this.sessionService.updateSessionSettings(
        sessionId,
        userId,
        settings
      );

      this.wsService.notifySessionUpdate(sessionId, 'SETTINGS_UPDATED', { settings });
      
      logger.info(`Session ${sessionId} settings updated by ${userId}`);
      res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(new AppError('Failed to update session settings', 500, error));
    }
  };

  public end = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const { userId } = req.user!;

      await this.sessionService.endSession(sessionId, userId);
      this.wsService.notifySessionUpdate(sessionId, 'SESSION_ENDED');

      logger.info(`Session ${sessionId} ended by ${userId}`);
      res.status(200).json({ success: true });
    } catch (error) {
      next(new AppError('Failed to end session', 500, error));
    }
  };
}

export default new SessionController();
