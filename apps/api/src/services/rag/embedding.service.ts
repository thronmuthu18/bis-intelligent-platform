import { prisma } from '../../db/client.js';
import { getEmbeddingProvider } from '../ai/embedding/factory.js';
import { buildChunksForStandard, PreparedChunk } from './chunker.js';
import { logger } from '../../config/logger.js';
import {
  ReindexEmbeddingsInput,
  EmbeddingStatusResponse,
} from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Embedding Ingestion & Reindexing Service (Phase 5)
// ─────────────────────────────────────────────────────────────────────────────

export interface SyncStandardResult {
  standardId: string;
  totalChunks: number;
  newEmbedded: number;
  skippedUnchanged: number;
  failed: number;
}

/**
 * Synchronizes and embeds knowledge chunks for a single standard.
 * Uses content hash verification to avoid redundant embedding API calls.
 */
export async function syncStandardEmbeddings(standardId: string, force = false): Promise<SyncStandardResult> {
  const standard = await prisma.standard.findUnique({
    where: { id: standardId },
    include: {
      sourceDocument: true,
      versions: true,
      amendments: true,
      qcoMappings: { include: { qco: true } },
      schemeMappings: { include: { scheme: true } },
      productManuals: true,
    },
  });

  if (!standard) {
    return { standardId, totalChunks: 0, newEmbedded: 0, skippedUnchanged: 0, failed: 0 };
  }

  const provider = getEmbeddingProvider();
  const preparedChunks = buildChunksForStandard(standard);

  let newEmbedded = 0;
  let skippedUnchanged = 0;
  let failed = 0;

  // Identify chunks requiring embedding
  const chunksToEmbed: PreparedChunk[] = [];

  for (const chunk of preparedChunks) {
    const existingChunk = await prisma.knowledgeChunk.findFirst({
      where: {
        standardId: chunk.standardId,
        chunkType: chunk.chunkType,
        chunkIndex: chunk.chunkIndex,
        contentHash: chunk.contentHash,
        embeddingModel: provider.model,
        embeddingStatus: 'COMPLETED',
      },
    });

    if (existingChunk && !force && existingChunk.embedding && existingChunk.embedding.length > 0) {
      skippedUnchanged++;
    } else {
      chunksToEmbed.push(chunk);
    }
  }

  if (chunksToEmbed.length > 0) {
    try {
      const texts = chunksToEmbed.map((c) => c.content);
      const vectors = await provider.embedBatch(texts);

      for (let i = 0; i < chunksToEmbed.length; i++) {
        const chunk = chunksToEmbed[i];
        const vector = vectors[i];

        // Delete older chunk for the exact same slot if exists
        await prisma.knowledgeChunk.deleteMany({
          where: {
            standardId: chunk.standardId,
            chunkType: chunk.chunkType,
            chunkIndex: chunk.chunkIndex,
          },
        });

        await prisma.knowledgeChunk.create({
          data: {
            standardId: chunk.standardId,
            sourceDocumentId: chunk.sourceDocumentId,
            standardVersionId: chunk.standardVersionId,
            standardAmendmentId: chunk.standardAmendmentId,
            qcoId: chunk.qcoId,
            schemeId: chunk.schemeId,
            productManualId: chunk.productManualId,
            chunkType: chunk.chunkType,
            sectionTitle: chunk.sectionTitle,
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            embedding: vector,
            embeddingModel: provider.model,
            embeddingDimension: provider.dimension,
            embeddingVersion: provider.version,
            contentHash: chunk.contentHash,
            embeddingStatus: 'COMPLETED',
            metadata: chunk.metadata as any,
          },
        });
        newEmbedded++;
      }
    } catch (err: unknown) {
      failed += chunksToEmbed.length;
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to generate embeddings for standard ${standard.isNumber}`, { error: msg });
    }
  }

  return {
    standardId,
    totalChunks: preparedChunks.length,
    newEmbedded,
    skippedUnchanged,
    failed,
  };
}

/**
 * Re-indexes all knowledge standards in the database.
 * Accessible to ADMIN and DATA_MANAGER roles.
 */
export async function reindexAllEmbeddings(options: ReindexEmbeddingsInput = {}): Promise<{
  standardsProcessed: number;
  totalChunks: number;
  newEmbedded: number;
  skippedUnchanged: number;
  failed: number;
}> {
  const standards = await prisma.standard.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  let totalChunks = 0;
  let newEmbedded = 0;
  let skippedUnchanged = 0;
  let failed = 0;

  for (const std of standards) {
    const res = await syncStandardEmbeddings(std.id, options.forceReindex);
    totalChunks += res.totalChunks;
    newEmbedded += res.newEmbedded;
    skippedUnchanged += res.skippedUnchanged;
    failed += res.failed;
  }

  return {
    standardsProcessed: standards.length,
    totalChunks,
    newEmbedded,
    skippedUnchanged,
    failed,
  };
}

/**
 * Returns current embedding generation status and model configuration.
 */
export async function getEmbeddingStatus(): Promise<EmbeddingStatusResponse> {
  const provider = getEmbeddingProvider();

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
    embeddingModel: provider.model,
    embeddingDimension: provider.dimension,
    provider: provider.name,
  };
}
