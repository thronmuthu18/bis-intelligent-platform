import { searchStandards } from '../standard.service.js';
import { executeVectorSearch, ScoredChunk } from './vectorSearch.js';
import { normalizeIsNumber } from '../ingestion/normalizer.js';
import { logger } from '../../config/logger.js';
import {
  SearchMode,
  StandardSearchParams,
  HybridSearchResponse,
  HybridSearchResultItem,
  MatchedChunkEvidence,
  KnowledgeChunkType,
} from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Hybrid Ranking & Retrieval Engine (Phase 5)
// ─────────────────────────────────────────────────────────────────────────────

export interface HybridSearchConfig {
  lexicalWeight: number;
  semanticWeight: number;
  exactMatchBoost: number;
}

export const DEFAULT_HYBRID_CONFIG: HybridSearchConfig = {
  lexicalWeight: parseFloat(process.env.HYBRID_LEXICAL_WEIGHT || '0.45'),
  semanticWeight: parseFloat(process.env.HYBRID_SEMANTIC_WEIGHT || '0.55'),
  exactMatchBoost: 0.50,
};

/**
 * Executes Hybrid (Lexical + Semantic) Search with score normalization and exact match boosting.
 */
export async function executeHybridSearch(
  params: StandardSearchParams,
  config: HybridSearchConfig = DEFAULT_HYBRID_CONFIG
): Promise<HybridSearchResponse> {
  const query = params.q ? params.q.trim() : '';
  const mode: SearchMode = params.mode || 'hybrid';
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(params.limit) || 10));

  // If query is empty, default to paginated listing
  if (!query) {
    const listRes = await searchStandards(params);
    const results: HybridSearchResultItem[] = listRes.standards.map((std) => ({
      ...std,
      relevanceScore: 1.0,
      searchMode: mode,
      matchedChunks: [],
    }));

    return {
      results,
      pagination: listRes.pagination,
      meta: {
        query: '',
        mode,
      },
    };
  }

  let semanticFallbackUsed = false;
  const canonicalQuery = normalizeIsNumber(query);

  // 1. Keyword / Lexical Search
  let lexicalResults: any[] = [];
  if (mode === 'keyword' || mode === 'hybrid') {
    const lexRes = await searchStandards({
      ...params,
      limit: 50,
      page: 1,
    });
    lexicalResults = lexRes.standards;
  }

  // 2. Semantic Vector Search
  let semanticChunks: ScoredChunk[] = [];
  if (mode === 'semantic' || mode === 'hybrid') {
    try {
      semanticChunks = await executeVectorSearch({
        query,
        topK: 40,
        sector: params.sector,
        department: params.department,
        status: params.status,
        authorityLevel: params.authorityLevel,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn(`Semantic retrieval unavailable, falling back to lexical search: ${msg}`);
      semanticFallbackUsed = true;
    }
  }

  // 3. Score Maps & Aggregation
  const standardMap = new Map<string, HybridSearchResultItem>();

  // Helper to check for exact IS number matches
  const isExactMatch = (isNumber: string, canNumber: string): boolean => {
    if (!query) return false;
    const qNorm = query.toUpperCase().replace(/\s+/g, ' ').trim();
    return (
      isNumber.toUpperCase() === qNorm ||
      canNumber.toUpperCase() === canonicalQuery.toUpperCase() ||
      isNumber.toUpperCase().includes(qNorm)
    );
  };

  // Process Lexical Results
  const totalLexical = lexicalResults.length;
  lexicalResults.forEach((std, index) => {
    // Rank-based normalized lexical score (1.0 down to 0.4)
    const rankScore = totalLexical > 1 ? 1.0 - (index / totalLexical) * 0.6 : 1.0;
    const exactBoost = isExactMatch(std.isNumber, std.canonicalNumber) ? config.exactMatchBoost : 0;
    const finalLexScore = Math.min(1.0, rankScore + exactBoost);

    standardMap.set(std.id, {
      ...std,
      relevanceScore: mode === 'keyword' ? finalLexScore : finalLexScore * config.lexicalWeight,
      lexicalScore: finalLexScore,
      searchMode: mode,
      matchedChunks: [],
      matchReason: exactBoost > 0 ? 'Exact Indian Standard match' : 'Keyword match in title / scope',
    });
  });

  // Process Semantic Chunks & Deduplicate at Standard Level
  for (const chunk of semanticChunks) {
    const std = chunk.standard;
    const exactBoost = isExactMatch(std.isNumber, std.canonicalNumber) ? config.exactMatchBoost : 0;
    const finalSemScore = Math.min(1.0, chunk.similarityScore + exactBoost);

    const chunkEvidence: MatchedChunkEvidence = {
      chunkId: chunk.chunkId,
      chunkType: chunk.chunkType as KnowledgeChunkType,
      sectionTitle: chunk.sectionTitle,
      contentSnippet: chunk.content.length > 200 ? `${chunk.content.substring(0, 197)}...` : chunk.content,
      score: chunk.similarityScore,
    };

    if (standardMap.has(std.id)) {
      const existing = standardMap.get(std.id)!;
      existing.semanticScore = Math.max(existing.semanticScore || 0, finalSemScore);

      if (mode === 'hybrid') {
        const combined =
          (existing.lexicalScore || 0) * config.lexicalWeight +
          existing.semanticScore * config.semanticWeight +
          (exactBoost > 0 ? 0.20 : 0);
        existing.relevanceScore = Math.min(1.0, parseFloat(combined.toFixed(4)));
        existing.matchReason =
          exactBoost > 0
            ? 'Exact IS number match with semantic verification'
            : 'Hybrid match across keywords and semantic scope';
      }

      existing.matchedChunks.push(chunkEvidence);
    } else {
      // New record found via pure semantic retrieval
      const score = mode === 'semantic' ? finalSemScore : finalSemScore * config.semanticWeight;

      standardMap.set(std.id, {
        id: std.id,
        isNumber: std.isNumber,
        canonicalNumber: std.canonicalNumber,
        title: std.title,
        shortTitle: std.shortTitle,
        scope: std.scope,
        status: std.status,
        sector: std.sector,
        department: std.department,
        currentEdition: std.currentEdition,
        publicationDate: std.publicationDate,
        sourceDocument: std.sourceDocument as any,
        relevanceScore: parseFloat(score.toFixed(4)),
        semanticScore: finalSemScore,
        lexicalScore: 0,
        searchMode: mode,
        matchedChunks: [chunkEvidence],
        matchReason: 'Semantic similarity match in standard requirements',
      });
    }
  }

  // 4. Rank and Paginate
  const allRanked = Array.from(standardMap.values());

  allRanked.sort((a, b) => {
    // Exact match always takes absolute priority
    const aExact = isExactMatch(a.isNumber, a.canonicalNumber);
    const bExact = isExactMatch(b.isNumber, b.canonicalNumber);
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    return b.relevanceScore - a.relevanceScore;
  });

  const total = allRanked.length;
  const skip = (page - 1) * limit;
  const paginatedResults = allRanked.slice(skip, skip + limit);

  return {
    results: paginatedResults,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
    meta: {
      query,
      mode,
      appliedWeights: mode === 'hybrid' ? { lexical: config.lexicalWeight, semantic: config.semanticWeight } : undefined,
      semanticFallbackUsed: semanticFallbackUsed || undefined,
    },
  };
}
