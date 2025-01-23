// src/config/prisma.ts
import { PrismaClient } from '@prisma/client';
import { log } from './logger';

// Create Prisma client with logging
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e: any) => {
    log.debug('Query: ' + e.query);
    log.debug('Duration: ' + e.duration + 'ms');
  });
}

// Log errors
prisma.$on('error', (e: any) => {
  log.error('Prisma Error: ' + e.message);
});

export { prisma };
