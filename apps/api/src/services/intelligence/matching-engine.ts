// ─────────────────────────────────────────────────────────────────────────────
//  Standard Matching & Explainability Engine (Phase 6)
// ─────────────────────────────────────────────────────────────────────────────

import { ProductSearchProfile } from './query-generator.js';
import { normalizeAttribute } from './normalizer.js';
import {
  MatchLevel,
  CandidateStandardMatchItem,
  MatchEvidence,
} from '@bis/shared';

export interface RawCandidateStandard {
  id: string;
  isNumber: string;
  canonicalNumber: string;
  title: string;
  shortTitle?: string | null;
  scope?: string | null;
  status: string;
  sector?: string | null;
  department?: string | null;
  currentEdition?: string | null;
  sourceDocument?: {
    title: string;
    url: string;
    authorityLevel: string;
  } | null;
  qcoMappings?: Array<{
    qco: {
      id: string;
      name: string;
      orderNumber: string;
      ministry?: string | null;
      status?: string;
    };
  }>;
  retrievalScore?: number;
  matchedChunks?: Array<{
    chunkId: string;
    sectionTitle?: string;
    contentSnippet: string;
    score?: number;
  }>;
}

/**
 * Computes Jaccard/overlap token similarity between two token arrays.
 */
function computeTokenOverlap(sourceTokens: string[], targetText: string): { score: number; matchedTokens: string[] } {
  if (!sourceTokens.length || !targetText) {
    return { score: 0, matchedTokens: [] };
  }

  const targetTokens = new Set(normalizeAttribute(targetText).tokens);
  const matched: string[] = [];

  for (const token of sourceTokens) {
    if (targetTokens.has(token)) {
      matched.push(token);
    }
  }

  const score = matched.length / Math.max(sourceTokens.length, 1);
  return {
    score: Math.min(1.0, score),
    matchedTokens: matched,
  };
}

/**
 * Evaluates a candidate standard against a structured product profile and produces
 * a score, match level, explainable reasons, and source evidence.
 */
export function matchStandardToProduct(
  candidate: RawCandidateStandard,
  profile: ProductSearchProfile
): CandidateStandardMatchItem {
  const reasons: string[] = [];
  const sourceTokens = profile.normalizedTokens || [];

  // 1. Exact IS Number Matching
  let exactBoost = 0;
  if (profile.explicitIsNumber) {
    const normExplicit = profile.explicitIsNumber.replace(/\s+/g, '').toUpperCase();
    const normIsNum = candidate.isNumber.replace(/\s+/g, '').toUpperCase();
    const normCanNum = candidate.canonicalNumber.replace(/\s+/g, '').toUpperCase();

    if (normIsNum.includes(normExplicit) || normCanNum.includes(normExplicit)) {
      exactBoost = 0.45;
      reasons.push(`Exact Indian Standard identifier match (${candidate.isNumber})`);
    }
  }

  // 2. Title Relevance
  const titleOverlap = computeTokenOverlap(sourceTokens, candidate.title);
  let titleScore = titleOverlap.score * 0.35;
  if (titleOverlap.matchedTokens.length > 0) {
    reasons.push(
      `Standard title specifies matching product terminology: ${titleOverlap.matchedTokens.slice(0, 4).join(', ')}`
    );
  }

  // 3. Scope & Intended Use Relevance
  let scopeScore = 0;
  if (candidate.scope) {
    const scopeOverlap = computeTokenOverlap(sourceTokens, candidate.scope);
    scopeScore = scopeOverlap.score * 0.25;

    if (profile.intendedUse) {
      const useOverlap = computeTokenOverlap(normalizeAttribute(profile.intendedUse).tokens, candidate.scope);
      if (useOverlap.matchedTokens.length > 0) {
        scopeScore = Math.max(scopeScore, useOverlap.score * 0.30);
        reasons.push(
          `Product intended use aligns with standard scope: ${useOverlap.matchedTokens.slice(0, 3).join(', ')}`
        );
      }
    } else if (scopeOverlap.matchedTokens.length > 0) {
      reasons.push(
        `Technical scope covers product attributes: ${scopeOverlap.matchedTokens.slice(0, 3).join(', ')}`
      );
    }
  }

  // 4. Sector / Department Alignment
  let sectorScore = 0;
  if (candidate.sector && (profile.sector || profile.category)) {
    const secOverlap = computeTokenOverlap(
      normalizeAttribute(`${profile.sector || ''} ${profile.category}`).tokens,
      `${candidate.sector} ${candidate.department || ''}`
    );
    if (secOverlap.matchedTokens.length > 0) {
      sectorScore = 0.15;
      reasons.push(`Sector classification alignment with ${candidate.sector} (${candidate.department || 'Technical Division'})`);
    }
  }

  // 5. Semantic Vector Retrieval Evidence
  let semanticScore = 0;
  if (candidate.retrievalScore) {
    semanticScore = candidate.retrievalScore * 0.25;
    if (candidate.matchedChunks && candidate.matchedChunks.length > 0) {
      reasons.push('Semantic vector analysis retrieved matching technical requirements');
    }
  }

  // 6. Quality Control Order (QCO) Verification
  let qcoEvidence: MatchEvidence['qco'] | undefined;
  if (candidate.qcoMappings && candidate.qcoMappings.length > 0) {
    const qco = candidate.qcoMappings[0].qco;
    qcoEvidence = {
      name: qco.name,
      orderNumber: qco.orderNumber,
      ministry: qco.ministry || undefined,
    };
    reasons.push(
      `Mandatory Quality Control Order published: ${qco.name} (Order: ${qco.orderNumber}${qco.ministry ? `, ${qco.ministry}` : ''})`
    );
  }

  // Fallback reason if evidence was minimal
  if (reasons.length === 0) {
    reasons.push('Potentially relevant reference identified via indexed keyword and category matching');
  }

  // 7. Calculate Final Aggregate Relevance Score
  const rawScore = exactBoost + titleScore + scopeScore + sectorScore + semanticScore;
  const relevanceScore = parseFloat(Math.min(1.0, Math.max(0.1, rawScore)).toFixed(4));

  // 8. Determine Qualitative Match Level
  let matchLevel: MatchLevel = 'POTENTIALLY_RELEVANT';
  if (relevanceScore >= 0.60 || exactBoost > 0 || qcoEvidence) {
    matchLevel = 'HIGHLY_RELEVANT';
  } else if (relevanceScore >= 0.35) {
    matchLevel = 'RELEVANT';
  }

  // 9. Prepare Structured Evidence Block
  const evidence: MatchEvidence = {
    chunks: candidate.matchedChunks,
    qco: qcoEvidence,
    sourceDocument: candidate.sourceDocument ? {
      title: candidate.sourceDocument.title,
      url: candidate.sourceDocument.url,
      authorityLevel: candidate.sourceDocument.authorityLevel,
    } : undefined,
  };

  return {
    id: candidate.id,
    standardId: candidate.id,
    isNumber: candidate.isNumber,
    canonicalNumber: candidate.canonicalNumber,
    title: candidate.title,
    shortTitle: candidate.shortTitle,
    scope: candidate.scope,
    status: candidate.status,
    sector: candidate.sector,
    department: candidate.department,
    currentEdition: candidate.currentEdition,
    relevanceScore,
    matchLevel,
    rank: 1, // Will be re-indexed during sorting
    reasons,
    evidence,
    sourceDocument: candidate.sourceDocument,
  };
}

/**
 * Matches, scores, ranks, and deduplicates candidate standards for a product.
 */
export function rankCandidateStandards(
  candidates: RawCandidateStandard[],
  profile: ProductSearchProfile
): CandidateStandardMatchItem[] {
  const matches = candidates.map((c) => matchStandardToProduct(c, profile));

  // Sort descending by relevance score
  matches.sort((a, b) => {
    // Exact match comes first
    if (a.matchLevel === 'HIGHLY_RELEVANT' && b.matchLevel !== 'HIGHLY_RELEVANT') return -1;
    if (a.matchLevel !== 'HIGHLY_RELEVANT' && b.matchLevel === 'HIGHLY_RELEVANT') return 1;
    return b.relevanceScore - a.relevanceScore;
  });

  // Assign sequential 1-indexed ranks
  return matches.map((m, index) => ({
    ...m,
    rank: index + 1,
  }));
}
