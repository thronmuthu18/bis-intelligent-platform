// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Regulatory Changes Service
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '../../db/client.js';
import { AppError } from '../../utils/AppError.js';
import { API_ERROR_CODES } from '@bis/shared';
import type { AdminRegulatoryChangeEventItem, CreateRegulatoryChangeEventInput } from '@bis/shared';

export class AdminRegulatoryService {
  public static async getChanges(params: {
    search?: string;
    impactLevel?: string;
    page?: number;
    limit?: number;
  }): Promise<{ changes: AdminRegulatoryChangeEventItem[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { summary: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.regulatoryChangeEvent.count({ where }),
      prisma.regulatoryChangeEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { detectedAt: 'desc' },
        include: {
          _count: { select: { impacts: true } },
        },
      }),
    ]);

    const changes: AdminRegulatoryChangeEventItem[] = items.map((r) => ({
      id: r.id,
      eventType: r.changeType,
      title: r.title,
      description: r.summary || '',
      orderNumber: r.sourceUrl || null,
      gazetteNumber: null,
      publicationDate: r.detectedAt.toISOString(),
      effectiveDate: r.effectiveDate ? r.effectiveDate.toISOString() : null,
      enforcementDate: r.effectiveDate ? r.effectiveDate.toISOString() : null,
      impactLevel: 'HIGH',
      reviewStatus: r.status,
      sourceDocumentId: r.sourceDocumentId,
      affectedStandardsCount: Array.isArray(r.affectedStandards) ? (r.affectedStandards as any[]).length : 0,
      affectedProductsCount: (r as any)._count?.impacts || 0,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return { changes, total, page, limit };
  }

  public static async createChange(input: CreateRegulatoryChangeEventInput, userId: string): Promise<AdminRegulatoryChangeEventItem> {
    if (!input.title || !input.description || !input.eventType) {
      throw new AppError('Title, description, and eventType are required', 400, API_ERROR_CODES.VALIDATION_ERROR);
    }

    const created = await prisma.regulatoryChangeEvent.create({
      data: {
        changeType: (input.eventType as any) || 'OTHER',
        title: input.title,
        summary: input.description,
        effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : null,
        sourceDocumentId: input.sourceDocumentId,
        sourceUrl: input.orderNumber || input.gazetteNumber || null,
        status: 'PUBLISHED',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ADMIN_CREATE_REGULATORY_CHANGE',
        entityType: 'RegulatoryChangeEvent',
        entityId: created.id,
        metadata: { title: created.title, changeType: created.changeType },
      },
    });

    return {
      id: created.id,
      eventType: created.changeType,
      title: created.title,
      description: created.summary || '',
      orderNumber: created.sourceUrl || null,
      gazetteNumber: null,
      publicationDate: created.detectedAt.toISOString(),
      effectiveDate: created.effectiveDate?.toISOString() || null,
      enforcementDate: created.effectiveDate?.toISOString() || null,
      impactLevel: 'HIGH',
      reviewStatus: created.status,
      sourceDocumentId: created.sourceDocumentId,
      affectedStandardsCount: 0,
      affectedProductsCount: 0,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }
}
