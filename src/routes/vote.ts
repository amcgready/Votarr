// src/routes/vote.ts
import { Router } from 'express';
import { VoteController } from '../controllers/voteController';
import { authenticate } from '../middleware/authenticate';
import { validateRequest } from '../middleware/validateRequest';
import { createVoteSchema } from '../schemas/voteSchema';

const router = Router();
const voteController = new VoteController();

router.post(
  '/',
  authenticate,
  validateRequest(createVoteSchema),
  voteController.createVote
);

router.get(
  '/session/:sessionId',
  authenticate,
  voteController.getSessionVotes
);

router.delete(
  '/:voteId',
  authenticate,
  voteController.removeVote
);

export { router as voteRouter };
