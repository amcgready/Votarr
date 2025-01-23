// src/routes/media.ts
import { Router } from 'express';
import { MediaController } from '../controllers/mediaController';
import { authenticate } from '../middleware/authenticate';
import { validateRequest } from '../middleware/validateRequest';
import { searchMediaSchema } from '../schemas/mediaSchema';

const router = Router();
const mediaController = new MediaController();

router.get(
  '/search',
  authenticate,
  validateRequest(searchMediaSchema),
  mediaController.searchMedia
);

router.get(
  '/:mediaId',
  authenticate,
  mediaController.getMediaDetails
);

router.get(
  '/popular/:type',
  authenticate,
  mediaController.getPopularMedia
);

router.get(
  '/recent/:type',
  authenticate,
  mediaController.getRecentMedia
);

router.get(
  '/ondeck',
  authenticate,
  mediaController.getOnDeckMedia
);

export { router as mediaRouter };
