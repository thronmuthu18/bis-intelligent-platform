// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Standards Management Service
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '../../db/client.js';
import { AppError } from '../../utils/AppError.js';
import { API_ERROR_CODES, type AuthorityLevel, type StandardStatus } from '@bis/shared';
import type {
  AdminStandardItem,
  CreateStandardInput,
  UpdateStandardInput,
  LifecycleStatus,
} from '@bis/shared';

export class AdminStandardService {
  /**
   * Helper to normalize IS numbers (e.g. "IS 10322 (Part 5/Sec 1)" -> "IS10322P5S1").
   */
  private static toCanonicalNumber(isNumber: string): string {
    return isNumber.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }

  /**
   * List standards with search, status filters, and pagination.
   */
  public static async getStandards(params: {
    search?: string;
    status?: string;
    sector?: string;
    hasSource?: string;
    page?: number;
    limit?: number;
  }): Promise<{ standards: AdminStandardItem[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.search) {
      where.OR = [
        { isNumber: { contains: params.search, mode: 'insensitive' } },
        { title: { contains: params.search, mode: 'insensitive' } },
        { scope: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.status) {
      where.status = params.status as StandardStatus;
    }

    if (params.sector) {
      where.sector = params.sector;
    }

    if (params.hasSource === 'true') {
      where.sourceDocumentId = { not: null };
    } else if (params.hasSource === 'false') {
      where.sourceDocumentId = null;
    }

    const [total, items] = await Promise.all([
      prisma.standard.count({ where }),
      prisma.standard.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          sourceDocument: {
            select: { id: true, title: true, url: true, authorityLevel: true },
          },
          _count: {
            select: {
              versions: true,
              amendments: true,
              knowledgeChunks: true,
              schemeMappings: true,
              qcoMappings: true,
            },
          },
        },
      }),
    ]);

    const standards: AdminStandardItem[] = items.map((s) => {
      let lifecycleStatus: LifecycleStatus = 'VERIFIED';
      if (!s.sourceDocumentId) {
        lifecycleStatus = 'DRAFT';
      } else if (s.status === 'SUPERSEDED' || s.status === 'WITHDRAWN' || !s.isActive) {
        lifecycleStatus = 'ARCHIVED';
      } else if (s.status === 'CURRENT') {
        lifecycleStatus = 'PUBLISHED';
      }

      return {
        id: s.id,
        isNumber: s.isNumber,
        canonicalNumber: s.canonicalNumber,
        title: s.title,
        shortTitle: s.shortTitle,
        scope: s.scope,
        status: s.status as StandardStatus,
        lifecycleStatus,
        sector: s.sector,
        department: s.department,
        language: s.language,
        currentEdition: s.currentEdition,
        publicationDate: s.publicationDate ? s.publicationDate.toISOString() : null,
        withdrawalDate: s.withdrawalDate ? s.withdrawalDate.toISOString() : null,
        sourceDocumentId: s.sourceDocumentId,
        sourceDocument: s.sourceDocument
          ? {
              id: s.sourceDocument.id,
              title: s.sourceDocument.title,
              url: s.sourceDocument.url,
              authorityLevel: s.sourceDocument.authorityLevel as AuthorityLevel,
            }
          : null,
        versionsCount: s._count.versions,
        amendmentsCount: s._count.amendments,
        chunksCount: s._count.knowledgeChunks,
        schemesCount: s._count.schemeMappings,
        qcosCount: s._count.qcoMappings,
        isActive: s.isActive,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      };
    });

    return { standards, total, page, limit };
  }

  /**
   * Get single standard by ID with complete relations.
   */
  public static async getStandardById(id: string): Promise<any> {
    const standard = await prisma.standard.findUnique({
      where: { id },
      include: {
        sourceDocument: true,
        versions: { orderBy: { year: 'desc' } },
        amendments: { orderBy: { amendmentNumber: 'asc' } },
        schemeMappings: {
          include: {
            scheme: true,
          },
        },
        qcoMappings: {
          include: {
            qco: true,
          },
        },
        productManuals: true,
        knowledgeChunks: {
          take: 10,
          orderBy: { chunkIndex: 'asc' },
        },
      },
    });

    if (!standard) {
      throw new AppError('Standard not found', 404, API_ERROR_CODES.NOT_FOUND);
    }

    return standard;
  }

  /**
   * Create standard with MANDATORY source provenance enforcement.
   */
  public static async createStandard(input: CreateStandardInput, userId: string): Promise<AdminStandardItem> {
    if (!input.isNumber || !input.title) {
      throw new AppError('Standard number (isNumber) and title are required', 400, API_ERROR_CODES.VALIDATION_ERROR);
    }

    // MANDATORY PROVENANCE CHECK: Cannot create standard without valid source document
    if (!input.sourceDocumentId) {
      throw new AppError(
        'Provenance Error: Every Indian Standard record requires an authoritative source document reference.',
        400,
        API_ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const source = await prisma.sourceDocument.findUnique({
      where: { id: input.sourceDocumentId },
    });
    if (!source) {
      throw new AppError('Referenced source document does not exist in registry', 400, API_ERROR_CODES.VALIDATION_ERROR);
    }

    // Check for duplicate IS number
    const existing = await prisma.standard.findUnique({
      where: { isNumber: input.isNumber },
    });
    if (existing) {
      throw new AppError(
        `Standard with number "${input.isNumber}" already exists in the repository.`,
        409,
        API_ERROR_CODES.CONFLICT,
      );
    }

    const canonicalNumber = input.canonicalNumber || this.toCanonicalNumber(input.isNumber);

    const created = await prisma.standard.create({
      data: {
        isNumber: input.isNumber,
        canonicalNumber,
        title: input.title,
        shortTitle: input.shortTitle,
        scope: input.scope,
        status: (input.status as any) || 'CURRENT',
        sector: input.sector,
        department: input.department,
        currentEdition: input.currentEdition,
        publicationDate: input.publicationDate ? new Date(input.publicationDate) : null,
        sourceDocumentId: input.sourceDocumentId,
        isActive: true,
      },
      include: {
        sourceDocument: {
          select: { id: true, title: true, url: true, authorityLevel: true },
        },
        _count: {
          select: {
            versions: true,
            amendments: true,
            knowledgeChunks: true,
            schemeMappings: true,
            qcoMappings: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ADMIN_CREATE_STANDARD',
        entityType: 'Standard',
        entityId: created.id,
        metadata: { isNumber: created.isNumber, title: created.title, sourceDocumentId: input.sourceDocumentId },
      },
    });

    return {
      id: created.id,
      isNumber: created.isNumber,
      canonicalNumber: created.canonicalNumber,
      title: created.title,
      shortTitle: created.shortTitle,
      scope: created.scope,
      status: created.status as StandardStatus,
      lifecycleStatus: 'PUBLISHED',
      sector: created.sector,
      department: created.department,
      language: created.language,
      currentEdition: created.currentEdition,
      publicationDate: created.publicationDate ? created.publicationDate.toISOString() : null,
      withdrawalDate: created.withdrawalDate ? created.withdrawalDate.toISOString() : null,
      sourceDocumentId: created.sourceDocumentId,
      sourceDocument: created.sourceDocument
        ? {
            id: created.sourceDocument.id,
            title: created.sourceDocument.title,
            url: created.sourceDocument.url,
            authorityLevel: created.sourceDocument.authorityLevel as AuthorityLevel,
          }
        : null,
      versionsCount: 0,
      amendmentsCount: 0,
      chunksCount: 0,
      schemesCount: 0,
      qcosCount: 0,
      isActive: created.isActive,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  /**
   * Update standard details and log audit event.
   */
  public static async updateStandard(id: string, input: UpdateStandardInput, userId: string): Promise<AdminStandardItem> {
    const existing = await prisma.standard.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Standard not found', 404, API_ERROR_CODES.NOT_FOUND);
    }

    if (input.sourceDocumentId) {
      const source = await prisma.sourceDocument.findUnique({ where: { id: input.sourceDocumentId } });
      if (!source) {
        throw new AppError('Referenced source document does not exist', 400, API_ERROR_CODES.VALIDATION_ERROR);
      }
    }

    const updated = await prisma.standard.update({
      where: { id },
      data: {
        title: input.title ?? existing.title,
        shortTitle: input.shortTitle ?? existing.shortTitle,
        scope: input.scope ?? existing.scope,
        status: (input.status as any) ?? existing.status,
        sector: input.sector ?? existing.sector,
        department: input.department ?? existing.department,
        currentEdition: input.currentEdition ?? existing.currentEdition,
        publicationDate: input.publicationDate ? new Date(input.publicationDate) : existing.publicationDate,
        withdrawalDate: input.withdrawalDate ? new Date(input.withdrawalDate) : existing.withdrawalDate,
        sourceDocumentId: input.sourceDocumentId ?? existing.sourceDocumentId,
        isActive: input.isActive ?? existing.isActive,
      },
      include: {
        sourceDocument: {
          select: { id: true, title: true, url: true, authorityLevel: true },
        },
        _count: {
          select: {
            versions: true,
            amendments: true,
            knowledgeChunks: true,
            schemeMappings: true,
            qcoMappings: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ADMIN_UPDATE_STANDARD',
        entityType: 'Standard',
        entityId: id,
        metadata: { changes: input as any },
      },
    });

    return {
      id: updated.id,
      isNumber: updated.isNumber,
      canonicalNumber: updated.canonicalNumber,
      title: updated.title,
      shortTitle: updated.shortTitle,
      scope: updated.scope,
      status: updated.status as StandardStatus,
      lifecycleStatus: updated.status === 'CURRENT' ? 'PUBLISHED' : 'ARCHIVED',
      sector: updated.sector,
      department: updated.department,
      language: updated.language,
      currentEdition: updated.currentEdition,
      publicationDate: updated.publicationDate ? updated.publicationDate.toISOString() : null,
      withdrawalDate: updated.withdrawalDate ? updated.withdrawalDate.toISOString() : null,
      sourceDocumentId: updated.sourceDocumentId,
      sourceDocument: updated.sourceDocument
        ? {
            id: updated.sourceDocument.id,
            title: updated.sourceDocument.title,
            url: updated.sourceDocument.url,
            authorityLevel: updated.sourceDocument.authorityLevel as AuthorityLevel,
          }
        : null,
      versionsCount: updated._count.versions,
      amendmentsCount: updated._count.amendments,
      chunksCount: updated._count.knowledgeChunks,
      schemesCount: updated._count.schemeMappings,
      qcosCount: updated._count.qcoMappings,
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Publish standard: strictly verifies source provenance before activating.
   */
  public static async publishStandard(id: string, userId: string): Promise<AdminStandardItem> {
    const standard = await prisma.standard.findUnique({
      where: { id },
      include: { sourceDocument: true },
    });

    if (!standard) {
      throw new AppError('Standard not found', 404, API_ERROR_CODES.NOT_FOUND);
    }

    if (!standard.sourceDocumentId || !standard.sourceDocument) {
      throw new AppError(
        'Publication Blocked: Cannot publish Indian Standard without verified source provenance.',
        400,
        API_ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const updated = await prisma.standard.update({
      where: { id },
      data: {
        status: 'CURRENT',
        isActive: true,
      },
      include: {
        sourceDocument: {
          select: { id: true, title: true, url: true, authorityLevel: true },
        },
        _count: {
          select: {
            versions: true,
            amendments: true,
            knowledgeChunks: true,
            schemeMappings: true,
            qcoMappings: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ADMIN_PUBLISH_STANDARD',
        entityType: 'Standard',
        entityId: id,
        metadata: { isNumber: updated.isNumber, sourceDocumentId: updated.sourceDocumentId },
      },
    });

    return {
      id: updated.id,
      isNumber: updated.isNumber,
      canonicalNumber: updated.canonicalNumber,
      title: updated.title,
      shortTitle: updated.shortTitle,
      scope: updated.scope,
      status: 'CURRENT',
      lifecycleStatus: 'PUBLISHED',
      sector: updated.sector,
      department: updated.department,
      language: updated.language,
      currentEdition: updated.currentEdition,
      publicationDate: updated.publicationDate ? updated.publicationDate.toISOString() : null,
      withdrawalDate: null,
      sourceDocumentId: updated.sourceDocumentId,
      sourceDocument: updated.sourceDocument
        ? {
            id: updated.sourceDocument.id,
            title: updated.sourceDocument.title,
            url: updated.sourceDocument.url,
            authorityLevel: updated.sourceDocument.authorityLevel as AuthorityLevel,
          }
        : null,
      versionsCount: updated._count.versions,
      amendmentsCount: updated._count.amendments,
      chunksCount: updated._count.knowledgeChunks,
      schemesCount: updated._count.schemeMappings,
      qcosCount: updated._count.qcoMappings,
      isActive: true,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Archive standard: records reason and logs audit event.
   */
  public static async archiveStandard(id: string, reason: string, userId: string): Promise<AdminStandardItem> {
    const standard = await prisma.standard.findUnique({ where: { id } });
    if (!standard) {
      throw new AppError('Standard not found', 404, API_ERROR_CODES.NOT_FOUND);
    }

    const updated = await prisma.standard.update({
      where: { id },
      data: {
        status: 'SUPERSEDED',
        isActive: false,
        withdrawalDate: new Date(),
      },
      include: {
        sourceDocument: {
          select: { id: true, title: true, url: true, authorityLevel: true },
        },
        _count: {
          select: {
            versions: true,
            amendments: true,
            knowledgeChunks: true,
            schemeMappings: true,
            qcoMappings: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ADMIN_ARCHIVE_STANDARD',
        entityType: 'Standard',
        entityId: id,
        metadata: { isNumber: updated.isNumber, reason },
      },
    });

    return {
      id: updated.id,
      isNumber: updated.isNumber,
      canonicalNumber: updated.canonicalNumber,
      title: updated.title,
      shortTitle: updated.shortTitle,
      scope: updated.scope,
      status: 'SUPERSEDED',
      lifecycleStatus: 'ARCHIVED',
      sector: updated.sector,
      department: updated.department,
      language: updated.language,
      currentEdition: updated.currentEdition,
      publicationDate: updated.publicationDate ? updated.publicationDate.toISOString() : null,
      withdrawalDate: updated.withdrawalDate ? updated.withdrawalDate.toISOString() : null,
      sourceDocumentId: updated.sourceDocumentId,
      sourceDocument: updated.sourceDocument
        ? {
            id: updated.sourceDocument.id,
            title: updated.sourceDocument.title,
            url: updated.sourceDocument.url,
            authorityLevel: updated.sourceDocument.authorityLevel as AuthorityLevel,
          }
        : null,
      versionsCount: updated._count.versions,
      amendmentsCount: updated._count.amendments,
      chunksCount: updated._count.knowledgeChunks,
      schemesCount: updated._count.schemeMappings,
      qcosCount: updated._count.qcoMappings,
      isActive: false,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
