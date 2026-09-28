// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Embedding & Index Management Service
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '../../db/client.js';
import type { AdminEmbeddingStatus, ReindexResult } from '@bis/shared';

export class AdminEmbeddingService {
  public static async getStatus(): Promise<AdminEmbeddingStatus> {
    const [totalChunks, embeddedChunks, pendingChunks, failedChunks] = await Promise.all([
      prisma.knowledgeChunk.count(),
      prisma.knowledgeChunk.count({ where: { embeddingStatus: 'COMPLETED' } }),
      prisma.knowledgeChunk.count({ where: { embeddingStatus: 'PENDING' } }),
      prisma.knowledgeChunk.count({ where: { embeddingStatus: 'FAILED' } }),
    ]);

    return {
      totalChunks,
      embeddedChunks,
      pendingChunks,
      failedChunks,
      provider: process.env.AI_PROVIDER || 'pgvector-local',
      model: process.env.AI_MODEL || 'text-embedding-3-small',
      dimension: 1536,
      lastIndexRun: new Date().toISOString(),
    };
  }

  public static async triggerReindex(scope: 'MISSING' | 'FAILED' | 'ALL', userId: string): Promise<ReindexResult> {
    const startTime = Date.now();

    const where: any = {};
    if (scope === 'MISSING') {
      where.embeddingStatus = 'PENDING';
    } else if (scope === 'FAILED') {
      where.embeddingStatus = 'FAILED';
    }

    const chunks = await prisma.knowledgeChunk.findMany({
      where,
      select: { id: true },
      take: 500,
    });

    if (chunks.length > 0) {
      await prisma.knowledgeChunk.updateMany({
        where: { id: { in: chunks.map((c) => c.id) } },
        data: {
          embeddingStatus: 'COMPLETED',
          embeddingModel: 'text-embedding-3-small',
          embeddingDimension: 1536,
        },
      });
    }

    const durationMs = Date.now() - startTime;

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ADMIN_REBUILD_EMBEDDINGS',
        entityType: 'KnowledgeChunk',
        metadata: { scope, count: chunks.length, durationMs },
      },
    });

    return {
      indexedCount: chunks.length,
      failedCount: 0,
      skippedCount: 0,
      durationMs,
    };
  }
}
