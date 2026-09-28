// ─────────────────────────────────────────────────────────────────────────────
//  Background Job Queue Types & Interface
//  Production-ready abstraction for asynchronous work (Redis/BullMQ ready)
// ─────────────────────────────────────────────────────────────────────────────

export type JobType =
  | 'DOCUMENT_OCR'
  | 'DOCUMENT_EXTRACTION'
  | 'EMBEDDING_GENERATION'
  | 'TRANSLATION'
  | 'COMPLIANCE_RECALCULATION'
  | 'REGULATORY_CHANGE_PROCESSING'
  | 'NOTIFICATION_DISPATCH';

export type JobStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface JobOptions {
  priority?: number; // Higher number = higher priority
  delayMs?: number; // Milliseconds to delay processing
  maxRetries?: number; // Default 3
  timeoutMs?: number; // Execution timeout
  metadata?: Record<string, unknown>;
}

export interface Job<T = unknown, R = unknown> {
  id: string;
  type: JobType;
  payload: T;
  status: JobStatus;
  progress: number; // 0 to 100
  result?: R;
  error?: string;
  attempts: number;
  maxRetries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, unknown>;
}

export type JobWorkerHandler<T = unknown, R = unknown> = (
  job: Job<T, R>,
  updateProgress: (progress: number) => Promise<void>
) => Promise<R>;

export interface JobQueueProvider {
  /**
   * Enqueues a new background job.
   */
  enqueue<T = unknown, R = unknown>(
    type: JobType,
    payload: T,
    options?: JobOptions
  ): Promise<Job<T, R>>;

  /**
   * Retrieves the current status and result of a job.
   */
  getStatus<T = unknown, R = unknown>(jobId: string): Promise<Job<T, R> | null>;

  /**
   * Cancels a pending or active job.
   */
  cancel(jobId: string): Promise<boolean>;

  /**
   * Retries a failed or cancelled job.
   */
  retry<T = unknown, R = unknown>(jobId: string): Promise<Job<T, R> | null>;

  /**
   * Registers a worker handler for a specific job type.
   */
  registerWorker<T = unknown, R = unknown>(
    type: JobType,
    handler: JobWorkerHandler<T, R>
  ): void;

  /**
   * Returns count of currently active or pending jobs.
   */
  getActiveCount(): Promise<number>;

  /**
   * Clears all jobs (useful for testing and reset).
   */
  clear(): Promise<void>;
}
