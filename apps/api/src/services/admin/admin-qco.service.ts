// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin QCO Management Service
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '../../db/client.js';
import { AppError } from '../../utils/AppError.js';
import { API_ERROR_CODES } from '@bis/shared';
import type { AdminQcoItem, CreateQcoInput, UpdateQcoInput } from '@bis/shared';

export class AdminQcoService {
  /**
   * List QCOs with mapped standards and pagination.
   */
  public static async getQcos(params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ qcos: AdminQcoItem[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { orderNumber: { contains: params.search, mode: 'insensitive' } },
        { ministry: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.status) {
      where.status = params.status;
    }

    const [total, items] = await Promise.all([
      prisma.qCO.count({ where }),
      prisma.qCO.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          sourceDocument: {
            select: { id: true, title: true, url: true },
          },
          standardMappings: {
            include: {
              standard: {
                select: { id: true, isNumber: true, title: true },
              },
            },
          },
        },
      }),
    ]);

    const qcos: AdminQcoItem[] = items.map((q) => ({
      id: q.id,
      name: q.name,
      orderNumber: q.orderNumber,
      ministry: q.ministry,
      notificationDate: q.notificationDate ? q.notificationDate.toISOString() : null,
      effectiveDate: q.effectiveDate ? q.effectiveDate.toISOString() : null,
      status: q.status,
      documentUrl: q.documentUrl,
      sourceDocumentId: q.sourceDocumentId,
      sourceDocument: q.sourceDocument
        ? {
            id: q.sourceDocument.id,
            title: q.sourceDocument.title,
            url: q.sourceDocument.url,
          }
        : null,
      standardsCount: q.standardMappings.length,
      mappedStandards: q.standardMappings.map((m) => ({
        id: m.standard.id,
        isNumber: m.standard.isNumber,
        title: m.standard.title,
      })),
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
    }));

    return { qcos, total, page, limit };
  }

  /**
   * Get single QCO by ID.
   */
  public static async getQcoById(id: string): Promise<AdminQcoItem> {
    const q = await prisma.qCO.findUnique({
      where: { id },
      include: {
        sourceDocument: true,
        standardMappings: {
          include: {
            standard: true,
          },
        },
      },
    });

    if (!q) {
      throw new AppError('QCO not found', 404, API_ERROR_CODES.NOT_FOUND);
    }

    return {
      id: q.id,
      name: q.name,
      orderNumber: q.orderNumber,
      ministry: q.ministry,
      notificationDate: q.notificationDate ? q.notificationDate.toISOString() : null,
      effectiveDate: q.effectiveDate ? q.effectiveDate.toISOString() : null,
      status: q.status,
      documentUrl: q.documentUrl,
      sourceDocumentId: q.sourceDocumentId,
      sourceDocument: q.sourceDocument
        ? {
            id: q.sourceDocument.id,
            title: q.sourceDocument.title,
            url: q.sourceDocument.url,
          }
        : null,
      standardsCount: q.standardMappings.length,
      mappedStandards: q.standardMappings.map((m) => ({
        id: m.standard.id,
        isNumber: m.standard.isNumber,
        title: m.standard.title,
      })),
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
    };
  }

  /**
   * Create QCO with source provenance check and standard mappings.
   */
  public static async createQco(input: CreateQcoInput, userId: string): Promise<AdminQcoItem> {
    if (!input.name || !input.orderNumber) {
      throw new AppError('QCO name and order number are required', 400, API_ERROR_CODES.VALIDATION_ERROR);
    }

    if (!input.sourceDocumentId) {
      throw new AppError(
        'Provenance Error: Every QCO requires an authoritative source document reference.',
        400,
        API_ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const source = await prisma.sourceDocument.findUnique({ where: { id: input.sourceDocumentId } });
    if (!source) {
      throw new AppError('Referenced source document not found', 400, API_ERROR_CODES.VALIDATION_ERROR);
    }

    const existing = await prisma.qCO.findUnique({ where: { orderNumber: input.orderNumber } });
    if (existing) {
      throw new AppError(`QCO with order number "${input.orderNumber}" already exists`, 409, API_ERROR_CODES.CONFLICT);
    }

    const created = await prisma.qCO.create({
      data: {
        name: input.name,
        orderNumber: input.orderNumber,
        ministry: input.ministry,
        notificationDate: input.notificationDate ? new Date(input.notificationDate) : null,
        effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : null,
        documentUrl: input.documentUrl,
        sourceDocumentId: input.sourceDocumentId,
        status: 'IN_FORCE',
        standardMappings: input.standardIds && input.standardIds.length > 0
          ? {
              create: input.standardIds.map((stdId) => ({
                standardId: stdId,
              })),
            }
          : undefined,
      },
      include: {
        sourceDocument: true,
        standardMappings: {
          include: {
            standard: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ADMIN_CREATE_QCO',
        entityType: 'QCO',
        entityId: created.id,
        metadata: { orderNumber: created.orderNumber, name: created.name },
      },
    });

    return {
      id: created.id,
      name: created.name,
      orderNumber: created.orderNumber,
      ministry: created.ministry,
      notificationDate: created.notificationDate ? created.notificationDate.toISOString() : null,
      effectiveDate: created.effectiveDate ? created.effectiveDate.toISOString() : null,
      status: created.status,
      documentUrl: created.documentUrl,
      sourceDocumentId: created.sourceDocumentId,
      sourceDocument: created.sourceDocument
        ? {
            id: created.sourceDocument.id,
            title: created.sourceDocument.title,
            url: created.sourceDocument.url,
          }
        : null,
      standardsCount: created.standardMappings.length,
      mappedStandards: created.standardMappings.map((m) => ({
        id: m.standard.id,
        isNumber: m.standard.isNumber,
        title: m.standard.title,
      })),
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  /**
   * Update QCO and sync standard mappings.
   */
  public static async updateQco(id: string, input: UpdateQcoInput, userId: string): Promise<AdminQcoItem> {
    const existing = await prisma.qCO.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('QCO not found', 404, API_ERROR_CODES.NOT_FOUND);
    }

    if (input.standardIds) {
      // Re-sync standard mappings
      await prisma.qCOStandardMapping.deleteMany({ where: { qcoId: id } });
      if (input.standardIds.length > 0) {
        await prisma.qCOStandardMapping.createMany({
          data: input.standardIds.map((stdId) => ({
            qcoId: id,
            standardId: stdId,
          })),
        });
      }
    }

    const updated = await prisma.qCO.update({
      where: { id },
      data: {
        name: input.name ?? existing.name,
        ministry: input.ministry ?? existing.ministry,
        notificationDate: input.notificationDate ? new Date(input.notificationDate) : existing.notificationDate,
        effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : existing.effectiveDate,
        status: input.status ?? existing.status,
        documentUrl: input.documentUrl ?? existing.documentUrl,
        sourceDocumentId: input.sourceDocumentId ?? existing.sourceDocumentId,
      },
      include: {
        sourceDocument: true,
        standardMappings: {
          include: {
            standard: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ADMIN_UPDATE_QCO',
        entityType: 'QCO',
        entityId: id,
        metadata: { changes: input as any },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      orderNumber: updated.orderNumber,
      ministry: updated.ministry,
      notificationDate: updated.notificationDate ? updated.notificationDate.toISOString() : null,
      effectiveDate: updated.effectiveDate ? updated.effectiveDate.toISOString() : null,
      status: updated.status,
      documentUrl: updated.documentUrl,
      sourceDocumentId: updated.sourceDocumentId,
      sourceDocument: updated.sourceDocument
        ? {
            id: updated.sourceDocument.id,
            title: updated.sourceDocument.title,
            url: updated.sourceDocument.url,
          }
        : null,
      standardsCount: updated.standardMappings.length,
      mappedStandards: updated.standardMappings.map((m) => ({
        id: m.standard.id,
        isNumber: m.standard.isNumber,
        title: m.standard.title,
      })),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Delete QCO and log audit event.
   */
  public static async deleteQco(id: string, userId: string): Promise<{ success: boolean }> {
    const existing = await prisma.qCO.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('QCO not found', 404, API_ERROR_CODES.NOT_FOUND);
    }

    await prisma.qCO.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ADMIN_DELETE_QCO',
        entityType: 'QCO',
        entityId: id,
        metadata: { orderNumber: existing.orderNumber },
      },
    });

    return { success: true };
  }
}
