import { v4 as uuidv4 } from 'uuid';
import type { NotificationProvider } from './notification.interface.js';
import type {
  NotificationPayload,
  NotificationResult,
} from './notification.types.js';
import { logger } from '../../config/logger.js';

export interface SentEmailRecord {
  id: string;
  recipientEmail: string;
  subject: string;
  body: string;
  sentAt: Date;
  metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
//  EmailNotificationProvider
//  Abstracted email provider ready for AWS SES / SendGrid / SMTP integration
// ─────────────────────────────────────────────────────────────────────────────

export class EmailNotificationProvider implements NotificationProvider {
  public readonly channel = 'EMAIL' as const;
  private sentEmails: SentEmailRecord[] = [];

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const id = uuidv4();
    const recipientEmail = payload.recipientEmail || `${payload.recipientId}@example.com`;

    const record: SentEmailRecord = {
      id,
      recipientEmail,
      subject: `[BIS Platform] ${payload.title}`,
      body: payload.message,
      sentAt: new Date(),
      metadata: payload.data,
    };

    this.sentEmails.push(record);
    logger.info(`[EmailNotificationProvider] Email dispatched to ${recipientEmail}: ${payload.title}`);

    return {
      id,
      success: true,
      channel: this.channel,
      deliveredAt: new Date(),
    };
  }

  async sendBatch(payloads: NotificationPayload[]): Promise<NotificationResult[]> {
    return Promise.all(payloads.map((p) => this.send(p)));
  }

  getSentEmails(): SentEmailRecord[] {
    return [...this.sentEmails];
  }

  clear(): void {
    this.sentEmails = [];
  }
}
