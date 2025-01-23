// src/routes/session.ts
import { Router } from 'express';
import { SessionController } from '../controllers/sessionController';
import { authenticate } from '../middleware/authenticate';
import { validateRequest } from '../middleware/validateRequest';
import { createSessionSchema, updateSessionSchema } from '../schemas/sessionSchema';

const router = Router();
const sessionController = new SessionController();

router.post(
  '/',
  authenticate,
  validateRequest(createSessionSchema),
  sessionController.createSession
);

router.get(
  '/',
  authenticate,
  sessionController.getSessions
);

router.get(
  '/:sessionId',
  authenticate,
  sessionController.getSession
);

router.post(
  '/:sessionId/join',
  authenticate,
  sessionController.joinSession
);

router.post(
  '/:sessionId/leave',
  authenticate,
  sessionController.leaveSession
);

router.post(
  '/:sessionId/start',
  authenticate,
  sessionController.startSession
);

router.post(
  '/:sessionId/end',
  authenticate,
  sessionController.endSession
);

export { router as sessionRouter };
