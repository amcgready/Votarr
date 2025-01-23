// src/routes/auth.ts
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { AuthController } from '../controllers/authController';
import { validateRequest } from '../middleware/validateRequest';
import { plexAuthSchema } from '../schemas/authSchema';

const router = Router();
const authController = new AuthController();

router.post(
  '/plex/init',
  validateRequest(plexAuthSchema),
  authController.initPlexAuth
);

router.get(
  '/plex/callback',
  authController.handlePlexCallback
);

router.post(
  '/refresh',
  authController.refreshToken
);

router.post(
  '/logout',
  authenticate,
  authController.logout
);

router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
);

export { router as authRouter };
