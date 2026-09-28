import { v4 as uuidv4 } from 'uuid';
import type { NotificationProvider } from './notification.interface.js';
import type {
  InAppNotificationRecord,
  NotificationPayload,
  NotificationResult,
} from './notification.types.js';

// ─────────────────────────────────────────────────────────────────────────────
//  InAppNotificationProvider
//  Manages persistent in-app notifications for users and administrators
// ─────────────────────────────────────────────────────────────────────────────

export class InAppNotificationProvider implements NotificationProvider {
  public readonly channel = 'IN_APP' as const;
  private notifications = new Map<string, InAppNotificationRecord>();

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const id = uuidv4();
    const record: InAppNotificationRecord = {
      id,
      recipientId: payload.recipientId,
      eventType: payload.eventType,
      title: payload.title,
      message: payload.message,
      priority: payload.priority || 'NORMAL',
      isRead: false,
      data: payload.data,
      createdAt: payload.createdAt || new Date(),
    };

    this.notifications.set(id, record);

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

  async getForUser(recipientId: string, unreadOnly = false): Promise<InAppNotificationRecord[]> {
    const userNotifications: InAppNotificationRecord[] = [];
    for (const record of this.notifications.values()) {
      if (record.recipientId === recipientId) {
        if (!unreadOnly || !record.isRead) {
          userNotifications.push({ ...record });
        }
      }
    }
    return userNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    const record = this.notifications.get(notificationId);
    if (!record) return false;
    record.isRead = true;
    record.readAt = new Date();
    return true;
  }

  async markAllAsRead(recipientId: string): Promise<number> {
    let count = 0;
    for (const record of this.notifications.values()) {
      if (record.recipientId === recipientId && !record.isRead) {
        record.isRead = true;
        record.readAt = new Date();
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.notifications.clear();
  }
}
