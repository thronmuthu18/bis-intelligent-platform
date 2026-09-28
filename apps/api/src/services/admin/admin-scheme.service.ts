// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Scheme & Mapping Management Service
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '../../db/client.js';
import { AppError } from '../../utils/AppError.js';
import { API_ERROR_CODES } from '@bis/shared';
import type { AdminSchemeItem, CreateSchemeInput, UpdateSchemeInput } from '@bis/shared';

export class AdminSchemeService {
  public static async getSchemes(params: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ schemes: AdminSchemeItem[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { code: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.scheme.count({ where }),
      prisma.scheme.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
        include: {
          sourceDocument: {
            select: { id: true, title: true, url: true },
          },
          _count: {
            select: {
              standardMappings: true,
            },
          },
        },
      }),
    ]);

    const schemes: AdminSchemeItem[] = items.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      description: s.description,
      sourceDocumentId: s.sourceDocumentId,
      sourceDocument: s.sourceDocument
        ? {
            id: s.sourceDocument.id,
            title: s.sourceDocument.title,
            url: s.sourceDocument.url,
          }
        : null,
      standardsCount: s._count.standardMappings,
      manualsCount: 0,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    return { schemes, total, page, limit };
  }

  public static async getSchemeById(id: string): Promise<any> {
    const s = await prisma.scheme.findUnique({
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

    if (!s) {
      throw new AppError('Scheme not found', 404, API_ERROR_CODES.NOT_FOUND);
    }

    return s;
  }

  public static async createScheme(input: CreateSchemeInput, userId: string): Promise<AdminSchemeItem> {
    if (!input.name || !input.code) {
      throw new AppError('Scheme name and code are required', 400, API_ERROR_CODES.VALIDATION_ERROR);
    }

    const existing = await prisma.scheme.findUnique({ where: { code: input.code } });
    if (existing) {
      throw new AppError(`Scheme with code "${input.code}" already exists`, 409, API_ERROR_CODES.CONFLICT);
    }

    const created = await prisma.scheme.create({
      data: {
        name: input.name,
        code: input.code,
        description: input.description,
        sourceDocumentId: input.sourceDocumentId,
      },
      include: {
        sourceDocument: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ADMIN_CREATE_SCHEME',
        entityType: 'Scheme',
        entityId: created.id,
        metadata: { code: created.code, name: created.name },
      },
    });

    return {
      id: created.id,
      name: created.name,
      code: created.code,
      description: created.description,
      sourceDocumentId: created.sourceDocumentId,
      sourceDocument: created.sourceDocument
        ? {
            id: created.sourceDocument.id,
            title: created.sourceDocument.title,
            url: created.sourceDocument.url,
          }
        : null,
      standardsCount: 0,
      manualsCount: 0,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  public static async updateScheme(id: string, input: UpdateSchemeInput, userId: string): Promise<AdminSchemeItem> {
    const existing = await prisma.scheme.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Scheme not found', 404, API_ERROR_CODES.NOT_FOUND);
    }

    const updated = await prisma.scheme.update({
      where: { id },
      data: {
        name: input.name ?? existing.name,
        description: input.description ?? existing.description,
        sourceDocumentId: input.sourceDocumentId ?? existing.sourceDocumentId,
      },
      include: {
        sourceDocument: true,
        _count: {
          select: { standardMappings: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ADMIN_UPDATE_SCHEME',
        entityType: 'Scheme',
        entityId: id,
        metadata: { changes: input as any },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      code: updated.code,
      description: updated.description,
      sourceDocumentId: updated.sourceDocumentId,
      sourceDocument: updated.sourceDocument
        ? {
            id: updated.sourceDocument.id,
            title: updated.sourceDocument.title,
            url: updated.sourceDocument.url,
          }
        : null,
      standardsCount: updated._count.standardMappings,
      manualsCount: 0,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  public static async mapStandard(standardId: string, schemeId: string, sourceDocumentId?: string, userId?: string) {
    const mapping = await prisma.standardSchemeMapping.upsert({
      where: {
        standardId_schemeId: { standardId, schemeId },
      },
      update: {
        sourceDocumentId,
      },
      create: {
        standardId,
        schemeId,
        sourceDocumentId,
      },
    });

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'ADMIN_MAP_STANDARD_SCHEME',
          entityType: 'StandardSchemeMapping',
          entityId: mapping.id,
          metadata: { standardId, schemeId },
        },
      });
    }

    return mapping;
  }
}
