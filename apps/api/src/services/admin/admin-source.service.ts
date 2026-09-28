// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Source Registry Management Service
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '../../db/client.js';
import { AppError } from '../../utils/AppError.js';
import { API_ERROR_CODES } from '@bis/shared';
import type {
  AdminSourceItem,
  CreateSourceInput,
  UpdateSourceInput,
  AuthorityLevel,
  SourceType,
} from '@bis/shared';

export class AdminSourceService {
  /**
   * List sources with search, filters, pagination, and freshness metrics.
   */
  public static async getSources(params: {
    search?: string;
    authorityLevel?: string;
    sourceType?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ sources: AdminSourceItem[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { url: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.authorityLevel) {
      where.authorityLevel = params.authorityLevel as AuthorityLevel;
    }

    if (params.sourceType) {
      where.sourceType = params.sourceType as SourceType;
    }

    if (params.status) {
      where.status = params.status;
    }

    const [total, items] = await Promise.all([
      prisma.sourceDocument.count({ where }),
      prisma.sourceDocument.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: {
              standards: true,
              knowledgeChunks: true,
            },
          },
        },
      }),
    ]);

    const now = Date.now();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

    const sources: AdminSourceItem[] = items.map((s) => {
      const retrievedTime = new Date(s.retrievedAt).getTime();
      const ageMs = now - retrievedTime;
      const freshnessDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));
      const isFresh = ageMs < ninetyDaysMs;

      return {
        id: s.id,
        title: s.title,
        url: s.url,
        sourceType: s.sourceType as SourceType,
        authorityLevel: s.authorityLevel as AuthorityLevel,
        documentType: s.documentType,
        publishedAt: s.publishedAt ? s.publishedAt.toISOString() : null,
        retrievedAt: s.retrievedAt.toISOString(),
        contentHash: s.contentHash,
        versionLabel: s.versionLabel,
        status: s.status,
        isFresh,
        freshnessDays,
        standardsCount: s._count.standards,
        chunksCount: s._count.knowledgeChunks,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      };
    });

    return { sources, total, page, limit };
  }

  /**
   * Get single source by ID with relationships.
   */
  public static async getSourceById(id: string): Promise<AdminSourceItem> {
    const s = await prisma.sourceDocument.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            standards: true,
            knowledgeChunks: true,
          },
        },
      },
    });

    if (!s) {
      throw new AppError('Source document not found', 404, API_ERROR_CODES.NOT_FOUND);
    }

    const now = Date.now();
    const ageMs = now - new Date(s.retrievedAt).getTime();
    const freshnessDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));

    return {
      id: s.id,
      title: s.title,
      url: s.url,
      sourceType: s.sourceType as SourceType,
      authorityLevel: s.authorityLevel as AuthorityLevel,
      documentType: s.documentType,
      publishedAt: s.publishedAt ? s.publishedAt.toISOString() : null,
      retrievedAt: s.retrievedAt.toISOString(),
      contentHash: s.contentHash,
      versionLabel: s.versionLabel,
      status: s.status,
      isFresh: ageMs < 90 * 24 * 60 * 60 * 1000,
      freshnessDays,
      standardsCount: s._count.standards,
      chunksCount: s._count.knowledgeChunks,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }

  /**
   * Create new source in the authoritative registry.
   */
  public static async createSource(input: CreateSourceInput, userId: string): Promise<AdminSourceItem> {
    if (!input.title || !input.url) {
      throw new AppError('Source title and URL are required', 400, API_ERROR_CODES.VALIDATION_ERROR);
    }

    const source = await prisma.sourceDocument.create({
      data: {
        title: input.title,
        url: input.url,
        sourceType: (input.sourceType as any) || 'BIS_OFFICIAL',
        authorityLevel: (input.authorityLevel as any) || 'AUTHORITATIVE',
        documentType: input.documentType,
        versionLabel: input.versionLabel,
        status: input.status || 'ACTIVE',
      },
      include: {
        _count: {
          select: { standards: true, knowledgeChunks: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ADMIN_CREATE_SOURCE',
        entityType: 'SourceDocument',
        entityId: source.id,
        metadata: { title: source.title, url: source.url },
      },
    });

    return {
      id: source.id,
      title: source.title,
      url: source.url,
      sourceType: source.sourceType as SourceType,
      authorityLevel: source.authorityLevel as AuthorityLevel,
      documentType: source.documentType,
      publishedAt: source.publishedAt ? source.publishedAt.toISOString() : null,
      retrievedAt: source.retrievedAt.toISOString(),
      contentHash: source.contentHash,
      versionLabel: source.versionLabel,
      status: source.status,
      isFresh: true,
      freshnessDays: 0,
      standardsCount: 0,
      chunksCount: 0,
      createdAt: source.createdAt.toISOString(),
      updatedAt: source.updatedAt.toISOString(),
    };
  }

  /**
   * Update existing source document and log audit event.
   */
  public static async updateSource(id: string, input: UpdateSourceInput, userId: string): Promise<AdminSourceItem> {
    const existing = await prisma.sourceDocument.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Source document not found', 404, API_ERROR_CODES.NOT_FOUND);
    }

    const updated = await prisma.sourceDocument.update({
      where: { id },
      data: {
        title: input.title ?? existing.title,
        url: input.url ?? existing.url,
        sourceType: (input.sourceType as any) ?? existing.sourceType,
        authorityLevel: (input.authorityLevel as any) ?? existing.authorityLevel,
        documentType: input.documentType ?? existing.documentType,
        versionLabel: input.versionLabel ?? existing.versionLabel,
        status: input.status ?? existing.status,
      },
      include: {
        _count: {
          select: { standards: true, knowledgeChunks: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ADMIN_UPDATE_SOURCE',
        entityType: 'SourceDocument',
        entityId: id,
        metadata: { changes: input as any },
      },
    });

    const now = Date.now();
    const ageMs = now - new Date(updated.retrievedAt).getTime();

    return {
      id: updated.id,
      title: updated.title,
      url: updated.url,
      sourceType: updated.sourceType as SourceType,
      authorityLevel: updated.authorityLevel as AuthorityLevel,
      documentType: updated.documentType,
      publishedAt: updated.publishedAt ? updated.publishedAt.toISOString() : null,
      retrievedAt: updated.retrievedAt.toISOString(),
      contentHash: updated.contentHash,
      versionLabel: updated.versionLabel,
      status: updated.status,
      isFresh: ageMs < 90 * 24 * 60 * 60 * 1000,
      freshnessDays: Math.floor(ageMs / (24 * 60 * 60 * 1000)),
      standardsCount: updated._count.standards,
      chunksCount: updated._count.knowledgeChunks,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Verify source document freshness.
   */
  public static async verifySource(id: string, userId: string): Promise<AdminSourceItem> {
    const updated = await prisma.sourceDocument.update({
      where: { id },
      data: {
        retrievedAt: new Date(),
        authorityLevel: 'AUTHORITATIVE',
        status: 'ACTIVE',
      },
      include: {
        _count: {
          select: { standards: true, knowledgeChunks: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ADMIN_VERIFY_SOURCE',
        entityType: 'SourceDocument',
        entityId: id,
        metadata: { verifiedAt: new Date().toISOString() },
      },
    });

    return {
      id: updated.id,
      title: updated.title,
      url: updated.url,
      sourceType: updated.sourceType as SourceType,
      authorityLevel: updated.authorityLevel as AuthorityLevel,
      documentType: updated.documentType,
      publishedAt: updated.publishedAt ? updated.publishedAt.toISOString() : null,
      retrievedAt: updated.retrievedAt.toISOString(),
      contentHash: updated.contentHash,
      versionLabel: updated.versionLabel,
      status: updated.status,
      isFresh: true,
      freshnessDays: 0,
      standardsCount: updated._count.standards,
      chunksCount: updated._count.knowledgeChunks,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Delete source if no active standards/entities depend on it.
   */
  public static async deleteSource(id: string, userId: string): Promise<{ success: boolean }> {
    const source = await prisma.sourceDocument.findUnique({
      where: { id },
      include: {
        _count: {
          select: { standards: true, qcos: true, schemes: true },
        },
      },
    });

    if (!source) {
      throw new AppError('Source document not found', 404, API_ERROR_CODES.NOT_FOUND);
    }

    if (source._count.standards > 0 || source._count.qcos > 0 || source._count.schemes > 0) {
      throw new AppError(
        `Cannot delete source: ${source._count.standards} standards, ${source._count.qcos} QCOs, and ${source._count.schemes} schemes depend on it. Reassign or archive them first.`,
        400,
        API_ERROR_CODES.VALIDATION_ERROR,
      );
    }

    await prisma.sourceDocument.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ADMIN_DELETE_SOURCE',
        entityType: 'SourceDocument',
        entityId: id,
        metadata: { title: source.title },
      },
    });

    return { success: true };
  }
}
