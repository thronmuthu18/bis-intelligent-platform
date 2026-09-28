// ─────────────────────────────────────────────────────────────────────────────
//  Notification Event Types & Data Structures
//  Production-ready abstraction for multi-channel notifications
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationEventType =
  | 'DOCUMENT_EXPIRING'
  | 'CALIBRATION_DUE'
  | 'STANDARD_AMENDED'
  | 'QCO_CHANGED'
  | 'COMPLIANCE_TASK_BLOCKED'
  | 'READINESS_CHANGED'
  | 'REGULATORY_IMPACT_DETECTED';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'WEBHOOK';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface NotificationPayload {
  eventType: NotificationEventType;
  recipientId: string;
  recipientEmail?: string;
  title: string;
  message: string;
  channel?: NotificationChannel;
  priority?: NotificationPriority;
  data?: Record<string, unknown>;
  createdAt?: Date;
}

export interface NotificationResult {
  id: string;
  success: boolean;
  channel: NotificationChannel;
  deliveredAt: Date;
  error?: string;
}

export interface InAppNotificationRecord {
  id: string;
  recipientId: string;
  eventType: NotificationEventType;
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  readAt?: Date;
  data?: Record<string, unknown>;
  createdAt: Date;
}
