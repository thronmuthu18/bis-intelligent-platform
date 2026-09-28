import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InMemoryJobQueueProvider } from '../src/services/jobs/in-memory-queue.provider.js';
import { getJobQueue, setJobQueue } from '../src/services/jobs/queue.factory.js';
import type { JobType } from '../src/services/jobs/job.types.js';

describe('InMemoryJobQueueProvider', () => {
  let queue: InMemoryJobQueueProvider;

  beforeEach(() => {
    queue = new InMemoryJobQueueProvider();
  });

  it('should enqueue a job with PENDING status and valid properties', async () => {
    const job = await queue.enqueue('DOCUMENT_OCR', { fileId: 'doc-1' });

    expect(job.id).toBeDefined();
    expect(job.type).toBe('DOCUMENT_OCR');
    expect(job.payload).toEqual({ fileId: 'doc-1' });
    expect(job.status).toBe('PENDING');
    expect(job.progress).toBe(0);
    expect(job.attempts).toBe(0);
    expect(job.maxRetries).toBe(3);
    expect(job.createdAt).toBeInstanceOf(Date);
  });

  it('should execute registered worker and update job to COMPLETED with result', async () => {
    const executed: any[] = [];
    queue.registerWorker('DOCUMENT_EXTRACTION', async (job, updateProgress) => {
      await updateProgress(50);
      executed.push(job.payload);
      return { extractedPages: 5, status: 'SUCCESS' };
    });

    const job = await queue.enqueue('DOCUMENT_EXTRACTION', { docId: '123' });

    // Wait a brief moment for asynchronous event loop processing
    await new Promise((resolve) => setTimeout(resolve, 50));

    const updated = await queue.getStatus(job.id);
    expect(updated?.status).toBe('COMPLETED');
    expect(updated?.progress).toBe(100);
    expect(updated?.result).toEqual({ extractedPages: 5, status: 'SUCCESS' });
    expect(executed).toHaveLength(1);
  });

  it('should track progress during job processing', async () => {
    let capturedProgress = 0;
    queue.registerWorker('EMBEDDING_GENERATION', async (_job, updateProgress) => {
      await updateProgress(45);
      capturedProgress = 45;
      return { embeddingsGenerated: 10 };
    });

    const job = await queue.enqueue('EMBEDDING_GENERATION', { standardId: 'IS-10322' });
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(capturedProgress).toBe(45);
    const completed = await queue.getStatus(job.id);
    expect(completed?.status).toBe('COMPLETED');
  });

  it('should support job cancellation before completion', async () => {
    // Delayed job so it stays pending
    const job = await queue.enqueue('TRANSLATION', { text: 'Hello' }, { delayMs: 5000 });
    expect(job.status).toBe('PENDING');

    const cancelled = await queue.cancel(job.id);
    expect(cancelled).toBe(true);

    const status = await queue.getStatus(job.id);
    expect(status?.status).toBe('CANCELLED');
  });

  it('should retry a failed job and eventually succeed or fail after maxRetries', async () => {
    let attempts = 0;
    queue.registerWorker('COMPLIANCE_RECALCULATION', async () => {
      attempts++;
      if (attempts < 2) {
        throw new Error('Transient database lock');
      }
      return { score: 95 };
    });

    const job = await queue.enqueue('COMPLIANCE_RECALCULATION', { productId: 'p-1' }, { maxRetries: 3 });

    // Allow time for initial attempt, backoff retry, and final completion
    await new Promise((resolve) => setTimeout(resolve, 300));

    const finalJob = await queue.getStatus(job.id);
    expect(finalJob?.status).toBe('COMPLETED');
    expect(finalJob?.result).toEqual({ score: 95 });
    expect(attempts).toBe(2);
  });

  it('should mark job as FAILED when exceeding maxRetries', async () => {
    queue.registerWorker('REGULATORY_CHANGE_PROCESSING', async () => {
      throw new Error('Fatal regulatory parser error');
    });

    const job = await queue.enqueue('REGULATORY_CHANGE_PROCESSING', { qcoId: 'qco-1' }, { maxRetries: 1 });
    await new Promise((resolve) => setTimeout(resolve, 150));

    const failedJob = await queue.getStatus(job.id);
    expect(failedJob?.status).toBe('FAILED');
    expect(failedJob?.error).toBe('Fatal regulatory parser error');
  });

  it('should support all standard platform background job types', async () => {
    const jobTypes: JobType[] = [
      'DOCUMENT_OCR',
      'DOCUMENT_EXTRACTION',
      'EMBEDDING_GENERATION',
      'TRANSLATION',
      'COMPLIANCE_RECALCULATION',
      'REGULATORY_CHANGE_PROCESSING',
      'NOTIFICATION_DISPATCH',
    ];

    for (const type of jobTypes) {
      const job = await queue.enqueue(type, { typeKey: type });
      expect(job.type).toBe(type);
      const fetched = await queue.getStatus(job.id);
      expect(fetched).not.toBeNull();
    }
  });

  it('should track active count and allow clearing', async () => {
    await queue.enqueue('NOTIFICATION_DISPATCH', { test: 1 }, { delayMs: 10000 });
    await queue.enqueue('NOTIFICATION_DISPATCH', { test: 2 }, { delayMs: 10000 });

    const activeCount = await queue.getActiveCount();
    expect(activeCount).toBe(2);

    await queue.clear();
    const afterClear = await queue.getActiveCount();
    expect(afterClear).toBe(0);
  });
});

describe('JobQueueFactory', () => {
  beforeEach(() => {
    setJobQueue(null);
  });

  it('should yield an InMemoryJobQueueProvider singleton', () => {
    const queue1 = getJobQueue();
    const queue2 = getJobQueue();
    expect(queue1).toBe(queue2);
    expect(queue1).toBeInstanceOf(InMemoryJobQueueProvider);
  });

  it('should allow setting custom queue provider for testing', () => {
    const mockQueue = {
      enqueue: vi.fn(),
      getStatus: vi.fn(),
      cancel: vi.fn(),
      retry: vi.fn(),
      registerWorker: vi.fn(),
      getActiveCount: vi.fn(),
      clear: vi.fn(),
    };

    setJobQueue(mockQueue as any);
    expect(getJobQueue()).toBe(mockQueue);

    setJobQueue(null);
    expect(getJobQueue()).toBeInstanceOf(InMemoryJobQueueProvider);
  });
});
