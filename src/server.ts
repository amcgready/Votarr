// Path: src/server.ts

import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { PrismaClient } from '@prisma/client';

// Updated imports for configuration
import { CONFIG } from './config/environment';
import { logger } from './config/logger';
import { setupSwagger } from './config/swagger';
import { createRateLimiter } from './config/rateLimit';
import prisma from './lib/prisma';

// Service imports
import { WebSocketService } from './services/websocketService';
import { PlexService } from './services/plexService';
import { SessionService } from './services/sessionService';
import { VoteService } from './services/voteService';

// Route imports
import { createAuthRoutes } from './routes/auth';
import { createSessionRoutes } from './routes/session';
import { createMediaRoutes } from './routes/media';
import { createVoteRoutes } from './routes/vote';
import { errorHandler } from './middleware/errorHandler';

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize services
const wsService = new WebSocketService(server, logger);
const plexService = new PlexService(CONFIG.PLEX_CLIENT_IDENTIFIER, logger);
const sessionService = new SessionService(prisma, wsService, logger);
const voteService = new VoteService(prisma, wsService, logger);

// Middleware
app.use(helmet());
app.use(cors({
  origin: CONFIG.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(createRateLimiter());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', createAuthRoutes(plexService, prisma, logger));
app.use('/api/sessions', createSessionRoutes(sessionService, logger));
app.use('/api/media', createMediaRoutes(plexService, logger));
app.use('/api/votes', createVoteRoutes(voteService, plexService, logger));

// Swagger documentation
if (CONFIG.NODE_ENV !== 'production') {
  setupSwagger(app);
}

// Error handling
app.use(errorHandler(logger));

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down server...');
  
  try {
    await prisma.$disconnect();
    server.close();
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
server.listen(CONFIG.PORT, () => {
  logger.info(`Server is running on port ${CONFIG.PORT}`);
  logger.info(`Environment: ${CONFIG.NODE_ENV}`);
});

export default server;
