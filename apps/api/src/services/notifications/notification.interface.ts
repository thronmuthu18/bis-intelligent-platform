import type {
  NotificationChannel,
  NotificationPayload,
  NotificationResult,
} from './notification.types.js';

// ─────────────────────────────────────────────────────────────────────────────
//  NotificationProvider Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface NotificationProvider {
  readonly channel: NotificationChannel;

  /**
   * Sends a single notification.
   */
  send(payload: NotificationPayload): Promise<NotificationResult>;

  /**
   * Sends multiple notifications in a batch.
   */
  sendBatch(payloads: NotificationPayload[]): Promise<NotificationResult[]>;
}
