// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Consumer Services Management Service
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '../../db/client.js';
import { AppError } from '../../utils/AppError.js';
import { API_ERROR_CODES } from '@bis/shared';
import type { AdminConsumerServiceItem, CreateConsumerServiceInput, UpdateConsumerServiceInput } from '@bis/shared';

export class AdminConsumerService {
  public static async getServices(params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ services: AdminConsumerServiceItem[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.status) {
      where.status = params.status;
    }

    const [total, items] = await Promise.all([
      prisma.consumerService.count({ where }),
      prisma.consumerService.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const services: AdminConsumerServiceItem[] = items.map((s) => ({
      id: s.id,
      serviceType: s.serviceType,
      title: s.title,
      description: s.description,
      officialUrl: s.officialUrl || '',
      sourceAuthority: s.sourceAuthority,
      status: s.status,
      sourceDocumentId: s.sourceDocumentId,
      lastVerifiedAt: s.lastVerifiedAt ? s.lastVerifiedAt.toISOString() : null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    return { services, total, page, limit };
  }

  public static async createService(input: CreateConsumerServiceInput, userId: string): Promise<AdminConsumerServiceItem> {
    if (!input.title || !input.officialUrl || !input.serviceType) {
      throw new AppError('Title, serviceType, and officialUrl are required', 400, API_ERROR_CODES.VALIDATION_ERROR);
    }

    const created = await prisma.consumerService.create({
      data: {
        serviceType: input.serviceType as any,
        title: input.title,
        description: input.description,
        officialUrl: input.officialUrl,
        sourceAuthority: input.sourceAuthority || 'Bureau of Indian Standards (BIS)',
        status: input.status || 'ACTIVE',
        sourceDocumentId: input.sourceDocumentId,
        lastVerifiedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ADMIN_CREATE_CONSUMER_SERVICE',
        entityType: 'ConsumerService',
        entityId: created.id,
        metadata: { title: created.title, serviceType: created.serviceType },
      },
    });

    return {
      id: created.id,
      serviceType: created.serviceType,
      title: created.title,
      description: created.description,
      officialUrl: created.officialUrl || '',
      sourceAuthority: created.sourceAuthority,
      status: created.status,
      sourceDocumentId: created.sourceDocumentId,
      lastVerifiedAt: created.lastVerifiedAt?.toISOString() || null,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  public static async updateService(id: string, input: UpdateConsumerServiceInput, userId: string): Promise<AdminConsumerServiceItem> {
    const existing = await prisma.consumerService.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Consumer service not found', 404, API_ERROR_CODES.NOT_FOUND);
    }

    const updated = await prisma.consumerService.update({
      where: { id },
      data: {
        title: input.title ?? existing.title,
        description: input.description ?? existing.description,
        officialUrl: input.officialUrl ?? existing.officialUrl,
        sourceAuthority: input.sourceAuthority ?? existing.sourceAuthority,
        status: input.status ?? existing.status,
        sourceDocumentId: input.sourceDocumentId ?? existing.sourceDocumentId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ADMIN_UPDATE_CONSUMER_SERVICE',
        entityType: 'ConsumerService',
        entityId: id,
        metadata: { changes: input as any },
      },
    });

    return {
      id: updated.id,
      serviceType: updated.serviceType,
      title: updated.title,
      description: updated.description,
      officialUrl: updated.officialUrl || '',
      sourceAuthority: updated.sourceAuthority,
      status: updated.status,
      sourceDocumentId: updated.sourceDocumentId,
      lastVerifiedAt: updated.lastVerifiedAt ? updated.lastVerifiedAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
