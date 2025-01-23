// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { env } from '../config/environment';

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaOptions = {
  log: env.IS_PRODUCTION
    ? ['error']
    : ['query', 'error', 'warn'],
};

export const prisma = global.prisma || new PrismaClient(prismaOptions);

if (env.IS_DEV) {
  global.prisma = prisma;
}

// Handle shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
