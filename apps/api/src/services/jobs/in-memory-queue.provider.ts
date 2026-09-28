import { v4 as uuidv4 } from 'uuid';
import type {
  Job,
  JobOptions,
  JobQueueProvider,
  JobType,
  JobWorkerHandler,
} from './job.types.js';
import { logger } from '../../config/logger.js';

// ─────────────────────────────────────────────────────────────────────────────
//  InMemoryJobQueueProvider
//  In-memory background job processor for development, tests, and single-instance
//  Adheres to the same contract required by future Redis/BullMQ distributed runners
// ─────────────────────────────────────────────────────────────────────────────

export class InMemoryJobQueueProvider implements JobQueueProvider {
  private jobs = new Map<string, Job>();
  private workers = new Map<JobType, JobWorkerHandler<any, any>>();
  private timers = new Map<string, NodeJS.Timeout>();

  async enqueue<T = unknown, R = unknown>(
    type: JobType,
    payload: T,
    options: JobOptions = {}
  ): Promise<Job<T, R>> {
    const id = uuidv4();
    const job: Job<T, R> = {
      id,
      type,
      payload,
      status: 'PENDING',
      progress: 0,
      attempts: 0,
      maxRetries: options.maxRetries ?? 3,
      createdAt: new Date(),
      metadata: options.metadata,
    };

    this.jobs.set(id, job as Job<unknown, unknown>);

    const delay = options.delayMs ?? 0;
    if (delay > 0) {
      const timer = setTimeout(() => {
        this.timers.delete(id);
        this.processJob(id);
      }, delay);
      this.timers.set(id, timer);
    } else {
      // Execute asynchronously on the next event loop tick
      setImmediate(() => {
        this.processJob(id);
      });
    }

    return job;
  }

  async getStatus<T = unknown, R = unknown>(jobId: string): Promise<Job<T, R> | null> {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    return { ...job } as Job<T, R>;
  }

  async cancel(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (job.status === 'COMPLETED' || job.status === 'FAILED') {
      return false;
    }

    const timer = this.timers.get(jobId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(jobId);
    }

    job.status = 'CANCELLED';
    job.completedAt = new Date();
    return true;
  }

  async retry<T = unknown, R = unknown>(jobId: string): Promise<Job<T, R> | null> {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    if (job.status !== 'FAILED' && job.status !== 'CANCELLED') {
      return job as Job<T, R>;
    }

    job.status = 'PENDING';
    job.error = undefined;
    job.progress = 0;

    setImmediate(() => {
      this.processJob(jobId);
    });

    return job as Job<T, R>;
  }

  registerWorker<T = unknown, R = unknown>(
    type: JobType,
    handler: JobWorkerHandler<T, R>
  ): void {
    this.workers.set(type, handler);
  }

  async getActiveCount(): Promise<number> {
    let count = 0;
    for (const job of this.jobs.values()) {
      if (job.status === 'PENDING' || job.status === 'ACTIVE') {
        count++;
      }
    }
    return count;
  }

  async clear(): Promise<void> {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.jobs.clear();
  }

  private async processJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job || job.status === 'CANCELLED') return;

    const worker = this.workers.get(job.type);
    if (!worker) {
      // No worker registered yet; remain in PENDING state
      return;
    }

    job.status = 'ACTIVE';
    job.startedAt = new Date();
    job.attempts++;

    const updateProgress = async (progress: number): Promise<void> => {
      if (job.status === 'ACTIVE') {
        job.progress = Math.max(0, Math.min(100, progress));
      }
    };

    try {
      const result = await worker(job, updateProgress);
      job.status = 'COMPLETED';
      job.progress = 100;
      job.result = result;
      job.completedAt = new Date();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error(`Job [${job.id} - ${job.type}] attempt ${job.attempts} failed: ${errorMsg}`);

      if (job.attempts < job.maxRetries) {
        job.status = 'PENDING';
        job.error = `Attempt ${job.attempts} failed: ${errorMsg}`;
        // Exponential backoff retry: 50ms * 2^(attempts)
        const backoff = 50 * Math.pow(2, job.attempts);
        const timer = setTimeout(() => {
          this.timers.delete(job.id);
          this.processJob(job.id);
        }, backoff);
        this.timers.set(job.id, timer);
      } else {
        job.status = 'FAILED';
        job.error = errorMsg;
        job.completedAt = new Date();
      }
    }
  }
}
