import type { JobQueueProvider } from './job.types.js';
import { InMemoryJobQueueProvider } from './in-memory-queue.provider.js';
import { logger } from '../../config/logger.js';

// ─────────────────────────────────────────────────────────────────────────────
//  Job Queue Provider Factory
//  Yields InMemoryJobQueueProvider today, ready for Redis/BullMQ in the future
// ─────────────────────────────────────────────────────────────────────────────

let cachedQueueProvider: JobQueueProvider | null = null;

export function getJobQueue(): JobQueueProvider {
  if (cachedQueueProvider) {
    return cachedQueueProvider;
  }

  logger.info('Initializing InMemoryJobQueueProvider for asynchronous background tasks');
  cachedQueueProvider = new InMemoryJobQueueProvider();
  return cachedQueueProvider;
}

/**
 * Allows setting or overriding the job queue provider (useful for unit testing).
 */
export function setJobQueue(provider: JobQueueProvider | null): void {
  cachedQueueProvider = provider;
}
