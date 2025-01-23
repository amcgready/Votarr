import { Router } from 'express';
import authRoutes from './auth';
import mediaRoutes from './media';
import sessionRoutes from './session';
import voteRoutes from './vote';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API version prefix
router.use('/api/v1', (req, res, next) => {
  // You could add version-specific middleware here
  next();
});

// Public routes
router.use('/api/v1/auth', authRoutes);

// Protected routes
router.use('/api/v1/media', authenticateUser, mediaRoutes);
router.use('/api/v1/sessions', authenticateUser, sessionRoutes);
router.use('/api/v1/votes', authenticateUser, voteRoutes);

export default router;
