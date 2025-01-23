// src/controllers/voteController.ts
import { Request, Response, NextFunction } from 'express';
import { VoteService } from '../services/voteService';
import { WebSocketService } from '../services/websocketService';
import { AppError } from '../errors/AppError';
import { validateVote } from '../middleware/validation';
import { Vote, VoteCreateParams } from '../types/vote';
import { logger } from '../config/logger';

export class VoteController {
  private voteService: VoteService;
  private wsService: WebSocketService;

  constructor() {
    this.voteService = new VoteService();
    this.wsService = new WebSocketService();
  }

  public castVote = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const voteParams = validateVote(req.body as VoteCreateParams);
      const { userId } = req.user!;
      const { sessionId } = req.params;

      const vote = await this.voteService.castVote({
        ...voteParams,
        userId,
        sessionId
      });

      this.wsService.notifySessionUpdate(sessionId, 'VOTE_CAST', {
        userId,
        mediaId: voteParams.mediaId,
        vote: voteParams.value
      });

      logger.info(`Vote cast in session ${sessionId} by user ${userId}`);
      res.status(201).json({ success: true, data: vote });
    } catch (error) {
      next(new AppError('Failed to cast vote', 500, error));
    }
  };

  public getSessionVotes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const votes = await this.voteService.getVotesBySession(sessionId);

      logger.info(`Votes retrieved for session ${sessionId}`);
      res.status(200).json({ success: true, data: votes });
    } catch (error) {
      next(new AppError('Failed to get session votes', 500, error));
    }
  };

  public getUserVotes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const { userId } = req.user!;

      const votes = await this.voteService.getUserVotesInSession(sessionId, userId);

      logger.info(`User ${userId} votes retrieved for session ${sessionId}`);
      res.status(200).json({ success: true, data: votes });
    } catch (error) {
      next(new AppError('Failed to get user votes', 500, error));
    }
  };

  public updateVote = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { voteId } = req.params;
      const { value } = req.body;
      const { userId } = req.user!;

      const vote = await this.voteService.updateVote(voteId, userId, value);
      
      this.wsService.notifySessionUpdate(vote.sessionId, 'VOTE_UPDATED', {
        userId,
        voteId,
        newValue: value
      });

      logger.info(`Vote ${voteId} updated by user ${userId}`);
      res.status(200).json({ success: true, data: vote });
    } catch (error) {
      next(new AppError('Failed to update vote', 500, error));
    }
  };

  public getVoteResults = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const results = await this.voteService.calculateSessionResults(sessionId);

      logger.info(`Vote results calculated for session ${sessionId}`);
      res.status(200).json({ success: true, data: results });
    } catch (error) {
      next(new AppError('Failed to get vote results', 500, error));
    }
  };
}

export default new VoteController();
