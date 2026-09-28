// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Audit Logs Service
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '../../db/client.js';
import type { AdminAuditLogItem, AuditLogFilterParams } from '@bis/shared';

export class AdminAuditService {
  public static async getLogs(params: AuditLogFilterParams): Promise<{
    logs: AdminAuditLogItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 25));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.userId) {
      where.userId = params.userId;
    }
    if (params.action) {
      where.action = { contains: params.action, mode: 'insensitive' };
    }
    if (params.entityType) {
      where.entityType = params.entityType;
    }
    if (params.entityId) {
      where.entityId = params.entityId;
    }
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        where.createdAt.lte = new Date(params.endDate);
      }
    }

    const [total, items] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true, role: true },
          },
          product: {
            select: { name: true },
          },
        },
      }),
    ]);

    const logs: AdminAuditLogItem[] = items.map((l) => ({
      id: l.id,
      userId: l.userId,
      userName: l.user?.name,
      userEmail: l.user?.email,
      userRole: l.user?.role,
      productId: l.productId,
      productName: l.product?.name,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      metadata: l.metadata as Record<string, any>,
      ipAddress: l.ipAddress,
      userAgent: l.userAgent,
      createdAt: l.createdAt.toISOString(),
    }));

    return { logs, total, page, limit };
  }
}
