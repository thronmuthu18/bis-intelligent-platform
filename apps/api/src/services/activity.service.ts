// ─────────────────────────────────────────────────────────────────────────────
//  Phase 16 — User Activity Service
//  Streams real audit log events for products/actions owned by the user.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '../db/client.js';
import { AppError } from '../utils/AppError.js';
import {
  API_ERROR_CODES,
  ActivityCategory,
  UserActivityItem,
  UserActivityFeedResponse,
  UserActivityQueryInput,
} from '@bis/shared';

export class UserActivityService {
  /**
   * Helper to map action string to UI activity category.
   */
  public static mapActionToCategory(action: string, entityType?: string | null): ActivityCategory {
    const act = (action || '').toUpperCase();
    const entity = (entityType || '').toUpperCase();

    if (act.includes('DOCUMENT') || entity === 'DOCUMENT' || entity === 'PRODUCT_DOCUMENT') {
      return 'DOCUMENT';
    }
    if (act.includes('COMPLIANCE') || act.includes('TASK') || act.includes('DOSSIER') || act.includes('ALERT') || entity === 'COMPLIANCE') {
      return 'COMPLIANCE';
    }
    if (act.includes('ASSISTANT') || act.includes('CHAT') || act.includes('CONVERSATION') || act.includes('AI_') || entity === 'AI_CONVERSATION') {
      return 'ASSISTANT';
    }
    if (act.includes('PRODUCT') || act.includes('STANDARD') || act.includes('TESTING') || act.includes('LAB') || entity === 'PRODUCT') {
      return 'PRODUCT';
    }
    return 'SYSTEM';
  }

  /**
   * Generates a clean human-readable title from audit action.
   */
  public static formatActivityTitle(action: string): string {
    return action
      .replace(/^USER_|^PRODUCT_|^DOCUMENT_|^COMPLIANCE_|^ADMIN_/, '')
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Generates a descriptive string for the activity.
   */
  public static formatActivityDescription(
    action: string,
    metadata?: Record<string, unknown> | null,
    productName?: string | null
  ): string {
    const meta = metadata || {};
    if (typeof meta.description === 'string' && meta.description.trim()) {
      return meta.description.trim();
    }
    if (typeof meta.title === 'string' && meta.title.trim()) {
      return meta.title.trim();
    }
    if (typeof meta.fileName === 'string') {
      return `File ${meta.fileName} was processed.`;
    }
    if (typeof meta.isNumber === 'string') {
      return `Standard ${meta.isNumber} evaluated for compliance.`;
    }
    if (typeof meta.schemeName === 'string') {
      return `Scheme ${meta.schemeName} evaluated.`;
    }
    if (typeof meta.query === 'string') {
      return `AI assistant queried: "${meta.query.slice(0, 60)}${meta.query.length > 60 ? '...' : ''}"`;
    }
    if (productName) {
      return `Action completed for product ${productName}.`;
    }
    return `Action ${action} recorded in audit timeline.`;
  }

  /**
   * Logs a user/product activity to the audit trail.
   */
  public static async recordActivity(params: {
    userId?: string;
    productId?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: params.userId,
          productId: params.productId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch {
      // Audit log recording is non-blocking
    }
  }

  /**
   * Retrieves paginated activity feed for the authenticated user across all their owned products.
   */
  public static async getUserActivityFeed(
    userId: string,
    query: UserActivityQueryInput = {}
  ): Promise<UserActivityFeedResponse> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    // Find all products owned by the user to ensure data isolation
    const userProducts = await prisma.product.findMany({
      where: { userId, isActive: true },
      select: { id: true },
    });
    const userProductIds = userProducts.map((p) => p.id);

    // Filter audit logs strictly to:
    // 1) Logs explicitly created by this userId
    // 2) Logs linked to products owned by this user
    const where: any = {
      OR: [
        { userId },
        ...(userProductIds.length > 0 ? [{ productId: { in: userProductIds } }] : []),
      ],
    };

    if (query.productId) {
      // Enforce product ownership before scoping to productId
      if (!userProductIds.includes(query.productId)) {
        throw new AppError('Product not found or access denied.', 404, API_ERROR_CODES.NOT_FOUND);
      }
      where.productId = query.productId;
    }

    const [total, items] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    const activities: UserActivityItem[] = items.map((item) => {
      const category = this.mapActionToCategory(item.action, item.entityType);
      const meta = item.metadata as Record<string, unknown> | null;
      const title = this.formatActivityTitle(item.action);
      const description = this.formatActivityDescription(item.action, meta, item.product?.name);

      return {
        id: item.id,
        userId: item.userId,
        productId: item.productId,
        productName: item.product?.name || null,
        category,
        action: item.action,
        title,
        description,
        entityType: item.entityType,
        entityId: item.entityId,
        metadata: meta || undefined,
        timestamp: item.createdAt.toISOString(),
      };
    });

    // Optional category filtering in memory if requested
    let filteredActivities = activities;
    if (query.category && query.category !== 'ALL') {
      filteredActivities = activities.filter((a) => a.category === query.category);
    }

    return {
      activities: filteredActivities,
      total,
      page,
      limit,
      hasMore: skip + items.length < total,
    };
  }

  /**
   * Retrieves activity feed strictly for a specific product owned by the user.
   */
  public static async getProductActivity(
    userId: string,
    productId: string,
    query: UserActivityQueryInput = {}
  ): Promise<UserActivityFeedResponse> {
    return this.getUserActivityFeed(userId, {
      ...query,
      productId,
    });
  }
}
