// src/index.ts
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './middleware/errorHandler';
import { setupWebSocketHandlers } from './websocket/websocketHandler';
import { authRouter } from './routes/auth';
import { mediaRouter } from './routes/media';
import { sessionRouter } from './routes/session';
import { voteRouter } from './routes/vote';
import { validateEnv } from './utils/validateEnv';
import { logger } from './utils/logger';

// Validate environment variables
validateEnv();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
export const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/media', mediaRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/votes', voteRouter);

// WebSocket setup
setupWebSocketHandlers(wss);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received. Closing HTTP server');
  await prisma.$disconnect();
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});
