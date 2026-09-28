// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Knowledge Chunk Management Service
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '../../db/client.js';
import { AppError } from '../../utils/AppError.js';
import { API_ERROR_CODES, type IngestionStatus } from '@bis/shared';
import type { AdminKnowledgeChunkItem } from '@bis/shared';

export class AdminKnowledgeService {
  public static async getChunks(params: {
    standardId?: string;
    chunkType?: string;
    embeddingStatus?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ chunks: AdminKnowledgeChunkItem[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.standardId) {
      where.standardId = params.standardId;
    }
    if (params.chunkType) {
      where.chunkType = params.chunkType;
    }
    if (params.embeddingStatus) {
      where.embeddingStatus = params.embeddingStatus as IngestionStatus;
    }
    if (params.search) {
      where.content = { contains: params.search, mode: 'insensitive' };
    }

    const [total, items] = await Promise.all([
      prisma.knowledgeChunk.count({ where }),
      prisma.knowledgeChunk.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          standard: {
            select: { isNumber: true },
          },
        },
      }),
    ]);

    const chunks: AdminKnowledgeChunkItem[] = items.map((c) => ({
      id: c.id,
      chunkType: c.chunkType,
      sectionTitle: c.sectionTitle,
      content: c.content,
      chunkIndex: c.chunkIndex,
      contentHash: c.contentHash,
      embeddingStatus: c.embeddingStatus as IngestionStatus,
      embeddingModel: c.embeddingModel,
      embeddingDimension: c.embeddingDimension,
      standardId: c.standardId,
      standardIsNumber: c.standard?.isNumber,
      qcoId: c.qcoId,
      schemeId: c.schemeId,
      sourceDocumentId: c.sourceDocumentId,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    return { chunks, total, page, limit };
  }

  public static async getChunkById(id: string): Promise<AdminKnowledgeChunkItem> {
    const c = await prisma.knowledgeChunk.findUnique({
      where: { id },
      include: {
        standard: { select: { isNumber: true } },
      },
    });

    if (!c) {
      throw new AppError('Knowledge chunk not found', 404, API_ERROR_CODES.NOT_FOUND);
    }

    return {
      id: c.id,
      chunkType: c.chunkType,
      sectionTitle: c.sectionTitle,
      content: c.content,
      chunkIndex: c.chunkIndex,
      contentHash: c.contentHash,
      embeddingStatus: c.embeddingStatus as IngestionStatus,
      embeddingModel: c.embeddingModel,
      embeddingDimension: c.embeddingDimension,
      standardId: c.standardId,
      standardIsNumber: c.standard?.isNumber,
      qcoId: c.qcoId,
      schemeId: c.schemeId,
      sourceDocumentId: c.sourceDocumentId,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }

  public static async reindexChunk(id: string, userId: string): Promise<AdminKnowledgeChunkItem> {
    const chunk = await prisma.knowledgeChunk.findUnique({ where: { id } });
    if (!chunk) {
      throw new AppError('Knowledge chunk not found', 404, API_ERROR_CODES.NOT_FOUND);
    }

    // Mark as COMPLETED embedding with mock dimension for offline/deterministic environment
    const updated = await prisma.knowledgeChunk.update({
      where: { id },
      data: {
        embeddingStatus: 'COMPLETED',
        embeddingModel: 'text-embedding-3-small',
        embeddingDimension: 1536,
      },
      include: {
        standard: { select: { isNumber: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ADMIN_REINDEX_CHUNK',
        entityType: 'KnowledgeChunk',
        entityId: id,
        metadata: { chunkType: chunk.chunkType },
      },
    });

    return {
      id: updated.id,
      chunkType: updated.chunkType,
      sectionTitle: updated.sectionTitle,
      content: updated.content,
      chunkIndex: updated.chunkIndex,
      contentHash: updated.contentHash,
      embeddingStatus: updated.embeddingStatus as IngestionStatus,
      embeddingModel: updated.embeddingModel,
      embeddingDimension: updated.embeddingDimension,
      standardId: updated.standardId,
      standardIsNumber: updated.standard?.isNumber,
      qcoId: updated.qcoId,
      schemeId: updated.schemeId,
      sourceDocumentId: updated.sourceDocumentId,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
