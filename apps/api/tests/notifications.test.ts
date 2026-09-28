import { describe, it, expect, beforeEach } from 'vitest';
import {
  InAppNotificationProvider,
  EmailNotificationProvider,
  NotificationService,
  getNotificationService,
  setNotificationService,
  type NotificationEventType,
} from '../src/services/notifications/index.js';

describe('InAppNotificationProvider', () => {
  let provider: InAppNotificationProvider;

  beforeEach(() => {
    provider = new InAppNotificationProvider();
  });

  it('should deliver in-app notifications and record them for recipients', async () => {
    const res = await provider.send({
      eventType: 'DOCUMENT_EXPIRING',
      recipientId: 'user-1',
      title: 'Document Expiring Soon',
      message: 'Your calibration certificate expires in 15 days.',
    });

    expect(res.success).toBe(true);
    expect(res.channel).toBe('IN_APP');
    expect(res.id).toBeDefined();

    const notifications = await provider.getForUser('user-1');
    expect(notifications).toHaveLength(1);
    expect(notifications[0].title).toBe('Document Expiring Soon');
    expect(notifications[0].isRead).toBe(false);
  });

  it('should allow marking notifications as read', async () => {
    const res = await provider.send({
      eventType: 'CALIBRATION_DUE',
      recipientId: 'user-1',
      title: 'Calibration Due',
      message: 'Equipment XYZ calibration is due tomorrow.',
    });

    let unread = await provider.getForUser('user-1', true);
    expect(unread).toHaveLength(1);

    const marked = await provider.markAsRead(res.id);
    expect(marked).toBe(true);

    unread = await provider.getForUser('user-1', true);
    expect(unread).toHaveLength(0);

    const all = await provider.getForUser('user-1', false);
    expect(all[0].isRead).toBe(true);
    expect(all[0].readAt).toBeInstanceOf(Date);
  });

  it('should mark all notifications as read for a recipient', async () => {
    await provider.send({
      eventType: 'STANDARD_AMENDED',
      recipientId: 'user-2',
      title: 'Standard IS 10322 Amended',
      message: 'New amendment 2 released.',
    });
    await provider.send({
      eventType: 'QCO_CHANGED',
      recipientId: 'user-2',
      title: 'QCO Mandatory Order',
      message: 'Effective date updated.',
    });

    const count = await provider.markAllAsRead('user-2');
    expect(count).toBe(2);

    const unread = await provider.getForUser('user-2', true);
    expect(unread).toHaveLength(0);
  });
});

describe('EmailNotificationProvider', () => {
  let provider: EmailNotificationProvider;

  beforeEach(() => {
    provider = new EmailNotificationProvider();
  });

  it('should format and record dispatched emails', async () => {
    const res = await provider.send({
      eventType: 'REGULATORY_IMPACT_DETECTED',
      recipientId: 'user-3',
      recipientEmail: 'compliance@example.com',
      title: 'Regulatory Impact Detected',
      message: 'Your product requires testing under new IS standard.',
    });

    expect(res.success).toBe(true);
    expect(res.channel).toBe('EMAIL');

    const sent = provider.getSentEmails();
    expect(sent).toHaveLength(1);
    expect(sent[0].recipientEmail).toBe('compliance@example.com');
    expect(sent[0].subject).toContain('Regulatory Impact Detected');
  });
});

describe('NotificationService Coordinator', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
    setNotificationService(null);
  });

  it('should deliver in-app by default and also email when priority is HIGH with recipientEmail', async () => {
    const results = await service.notify({
      eventType: 'COMPLIANCE_TASK_BLOCKED',
      recipientId: 'user-4',
      recipientEmail: 'auditor@example.com',
      title: 'Compliance Task Blocked',
      message: 'Missing lab test report is blocking certification readiness.',
      priority: 'HIGH',
    });

    // Both IN_APP and EMAIL channels dispatched
    expect(results).toHaveLength(2);
    expect(results.some((r) => r.channel === 'IN_APP')).toBe(true);
    expect(results.some((r) => r.channel === 'EMAIL')).toBe(true);
  });

  it('should only deliver in-app when priority is NORMAL without email demand', async () => {
    const results = await service.notify({
      eventType: 'READINESS_CHANGED',
      recipientId: 'user-5',
      title: 'Readiness Score Updated',
      message: 'Product readiness increased to 85%.',
      priority: 'NORMAL',
    });

    expect(results).toHaveLength(1);
    expect(results[0].channel === 'IN_APP').toBe(true);
  });

  it('should route explicitly when channel is specified', async () => {
    const results = await service.notify({
      eventType: 'DOCUMENT_EXPIRING',
      recipientId: 'user-6',
      recipientEmail: 'test@example.com',
      title: 'Document Alert',
      message: 'Test message',
      channel: 'EMAIL',
    });

    expect(results).toHaveLength(1);
    expect(results[0].channel).toBe('EMAIL');
  });

  it('should support all 7 mandatory regulatory & compliance event types', async () => {
    const eventTypes: NotificationEventType[] = [
      'DOCUMENT_EXPIRING',
      'CALIBRATION_DUE',
      'STANDARD_AMENDED',
      'QCO_CHANGED',
      'COMPLIANCE_TASK_BLOCKED',
      'READINESS_CHANGED',
      'REGULATORY_IMPACT_DETECTED',
    ];

    for (const eventType of eventTypes) {
      const results = await service.notify({
        eventType,
        recipientId: 'user-all',
        title: `Test for ${eventType}`,
        message: 'Notification content',
      });
      expect(results[0].success).toBe(true);
    }

    const inAppList = await service.getInAppNotifications('user-all');
    expect(inAppList).toHaveLength(7);
  });

  it('should maintain singleton instance through getNotificationService', () => {
    const s1 = getNotificationService();
    const s2 = getNotificationService();
    expect(s1).toBe(s2);
  });
});
