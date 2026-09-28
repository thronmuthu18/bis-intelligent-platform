import type {
  NotificationPayload,
  NotificationResult,
  InAppNotificationRecord,
} from './notification.types.js';
import { InAppNotificationProvider } from './in-app-notification.provider.js';
import { EmailNotificationProvider } from './email-notification.provider.js';
import { logger } from '../../config/logger.js';

// ─────────────────────────────────────────────────────────────────────────────
//  NotificationService
//  Coordinates multi-channel notification dispatch
// ─────────────────────────────────────────────────────────────────────────────

export class NotificationService {
  private inAppProvider: InAppNotificationProvider;
  private emailProvider: EmailNotificationProvider;

  constructor(
    customInApp?: InAppNotificationProvider,
    customEmail?: EmailNotificationProvider
  ) {
    this.inAppProvider = customInApp || new InAppNotificationProvider();
    this.emailProvider = customEmail || new EmailNotificationProvider();
  }

  async notify(payload: NotificationPayload): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    // If channel is explicit, route to that channel
    if (payload.channel === 'EMAIL') {
      const emailRes = await this.emailProvider.send(payload);
      results.push(emailRes);
      return results;
    }

    if (payload.channel === 'IN_APP') {
      const inAppRes = await this.inAppProvider.send(payload);
      results.push(inAppRes);
      return results;
    }

    // Default: Always deliver in-app
    const inAppRes = await this.inAppProvider.send(payload);
    results.push(inAppRes);

    // If recipient email is provided and priority is HIGH or URGENT, also send email
    if (payload.recipientEmail && (payload.priority === 'HIGH' || payload.priority === 'URGENT')) {
      try {
        const emailRes = await this.emailProvider.send(payload);
        results.push(emailRes);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.warn(`Failed to dispatch notification email for event ${payload.eventType}: ${msg}`);
      }
    }

    return results;
  }

  async getInAppNotifications(
    userId: string,
    unreadOnly = false
  ): Promise<InAppNotificationRecord[]> {
    return this.inAppProvider.getForUser(userId, unreadOnly);
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    return this.inAppProvider.markAsRead(notificationId);
  }

  async markAllAsRead(userId: string): Promise<number> {
    return this.inAppProvider.markAllAsRead(userId);
  }

  getInAppProvider(): InAppNotificationProvider {
    return this.inAppProvider;
  }

  getEmailProvider(): EmailNotificationProvider {
    return this.emailProvider;
  }
}

let cachedNotificationService: NotificationService | null = null;

export function getNotificationService(): NotificationService {
  if (!cachedNotificationService) {
    cachedNotificationService = new NotificationService();
  }
  return cachedNotificationService;
}

export function setNotificationService(service: NotificationService | null): void {
  cachedNotificationService = service;
}
