import { prisma } from '../../db/client.js';
import { getEmbeddingProvider } from '../ai/embedding/factory.js';
import { getCompatibleBisSectors } from '../intelligence/category-sector-mapper.js';
import { logger } from '../../config/logger.js';
import { AuthorityLevel, StandardStatus } from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Vector Similarity & Semantic Search Service (Phase 5)
// ─────────────────────────────────────────────────────────────────────────────

export interface ScoredChunk {
  chunkId: string;
  chunkType: string;
  sectionTitle?: string;
  content: string;
  chunkIndex: number;
  similarityScore: number;
  standard: {
    id: string;
    isNumber: string;
    canonicalNumber: string;
    title: string;
    shortTitle?: string;
    scope?: string;
    status: StandardStatus;
    sector?: string;
    department?: string;
    currentEdition?: string;
    publicationDate?: string;
    sourceDocument?: {
      id: string;
      title: string;
      url: string;
      sourceType: string;
      authorityLevel: AuthorityLevel;
      retrievedAt: string;
      publishedAt?: string;
    };
  };
}

export interface VectorSearchParams {
  query: string;
  topK?: number;
  sector?: string;
  department?: string;
  status?: StandardStatus;
  authorityLevel?: AuthorityLevel;
}

/**
 * Calculates cosine similarity between two numeric vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(-1.0, Math.min(1.0, similarity));
}

/**
 * Executes pure semantic vector search across all knowledge chunks.
 */
export async function executeVectorSearch(params: VectorSearchParams): Promise<ScoredChunk[]> {
  const topK = params.topK || 20;
  const provider = getEmbeddingProvider();

  try {
    // 1. Generate query embedding
    const queryVector = await provider.embedText(params.query);

    // 2. Fetch candidate chunks matching standard metadata filters
    const compatibleSectors = params.sector ? getCompatibleBisSectors(params.sector) : [];

    const buildWhereChunk = (applySector = true): any => {
      const whereChunk: any = {
        embeddingStatus: 'COMPLETED',
        standardId: { not: null },
      };

      const stdFilter: any = { isActive: true };

      if (applySector && params.sector) {
        if (compatibleSectors.length > 0) {
          stdFilter.OR = [
            { sector: { contains: params.sector, mode: 'insensitive' } },
            ...compatibleSectors.map((s) => ({ sector: { contains: s, mode: 'insensitive' } })),
          ];
        } else {
          stdFilter.sector = { contains: params.sector, mode: 'insensitive' };
        }
      }

      if (params.department) {
        stdFilter.department = { contains: params.department, mode: 'insensitive' };
      }

      if (params.status) {
        stdFilter.status = params.status;
      }

      whereChunk.standard = stdFilter;

      if (params.authorityLevel) {
        whereChunk.sourceDocument = {
          authorityLevel: params.authorityLevel,
        };
      }

      return whereChunk;
    };

    let chunks = await prisma.knowledgeChunk.findMany({
      where: buildWhereChunk(true),
      include: {
        standard: {
          include: {
            sourceDocument: true,
          },
        },
        sourceDocument: true,
      },
    });

    // Fallback: If sector constraint returned 0 chunks, retry without sector constraint
    if (chunks.length === 0 && params.sector) {
      chunks = await prisma.knowledgeChunk.findMany({
        where: buildWhereChunk(false),
        include: {
          standard: {
            include: {
              sourceDocument: true,
            },
          },
          sourceDocument: true,
        },
      });
    }

    if (chunks.length === 0) {
      return [];
    }

    // 3. Compute vector similarity for each chunk
    const scoredChunks: ScoredChunk[] = [];

    for (const chunk of chunks) {
      if (!chunk.embedding || chunk.embedding.length === 0 || !chunk.standard) {
        continue;
      }

      const sim = cosineSimilarity(queryVector, chunk.embedding);

      // Filter out low/negative similarity chunks
      if (sim > 0.05) {
        scoredChunks.push({
          chunkId: chunk.id,
          chunkType: chunk.chunkType,
          sectionTitle: chunk.sectionTitle || undefined,
          content: chunk.content,
          chunkIndex: chunk.chunkIndex,
          similarityScore: parseFloat(sim.toFixed(4)),
          standard: {
            id: chunk.standard.id,
            isNumber: chunk.standard.isNumber,
            canonicalNumber: chunk.standard.canonicalNumber,
            title: chunk.standard.title,
            shortTitle: chunk.standard.shortTitle || undefined,
            scope: chunk.standard.scope || undefined,
            status: chunk.standard.status as StandardStatus,
            sector: chunk.standard.sector || undefined,
            department: chunk.standard.department || undefined,
            currentEdition: chunk.standard.currentEdition || undefined,
            publicationDate: chunk.standard.publicationDate?.toISOString() || undefined,
            sourceDocument: chunk.standard.sourceDocument
              ? {
                  id: chunk.standard.sourceDocument.id,
                  title: chunk.standard.sourceDocument.title,
                  url: chunk.standard.sourceDocument.url,
                  sourceType: chunk.standard.sourceDocument.sourceType,
                  authorityLevel: chunk.standard.sourceDocument.authorityLevel as AuthorityLevel,
                  retrievedAt: chunk.standard.sourceDocument.retrievedAt.toISOString(),
                  publishedAt: chunk.standard.sourceDocument.publishedAt?.toISOString() || undefined,
                }
              : undefined,
          },
        });
      }
    }

    // 4. Sort descending by similarity
    scoredChunks.sort((a, b) => b.similarityScore - a.similarityScore);

    return scoredChunks.slice(0, topK);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('Semantic vector search failed', { error: msg });
    throw err;
  }
}
