import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';
import { log } from '../config/logger.js';

// ─────────────────────────────────────────────────────────────────────────────
//  Prisma Client Singleton
//  Prevents multiple connections during hot-reload in development.
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
  });
}

export const prisma: PrismaClient =
  global.__prismaClient ?? createPrismaClient();

if (env.NODE_ENV !== 'production') {
  global.__prismaClient = prisma;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Database Health Check
// ─────────────────────────────────────────────────────────────────────────────

export interface DbHealthResult {
  connected: boolean;
  latencyMs?: number;
  error?: string;
}

export async function checkDatabaseHealth(): Promise<DbHealthResult> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    return { connected: true, latencyMs };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown database error';
    log.error('Database health check failed', { error: message });
    return { connected: false, error: message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Graceful Disconnect
// ─────────────────────────────────────────────────────────────────────────────

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  log.info('Database connection closed');
}
