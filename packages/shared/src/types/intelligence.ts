// ─────────────────────────────────────────────────────────────────────────────
//  Product Intelligence & Standard Matching Types (Phase 6)
// ─────────────────────────────────────────────────────────────────────────────

export type AttributeSource =
  | 'USER'
  | 'AI_EXTRACTED'
  | 'USER_CONFIRMED'
  | 'SYSTEM_NORMALIZED';

export interface ProductAttribute {
  id: string;
  productId: string;
  attributeKey: string;
  attributeValue: string;
  normalizedValue: string;
  source: AttributeSource;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertProductAttributeInput {
  attributeKey: string;
  attributeValue: string;
  source?: AttributeSource;
  confidence?: number;
}

export type AnalysisStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export type MatchLevel =
  | 'HIGHLY_RELEVANT'
  | 'RELEVANT'
  | 'POTENTIALLY_RELEVANT';

export type ReviewDecision = 'CONFIRMED' | 'REJECTED' | 'NEEDS_REVIEW';

export interface MatchEvidence {
  chunks?: Array<{
    chunkId: string;
    sectionTitle?: string;
    contentSnippet: string;
    score?: number;
  }>;
  qco?: {
    name: string;
    orderNumber: string;
    ministry?: string;
  };
  sourceDocument?: {
    title: string;
    url: string;
    authorityLevel: string;
  };
}

export interface CandidateStandardMatchItem {
  id: string;
  standardId: string;
  isNumber: string;
  canonicalNumber: string;
  title: string;
  shortTitle?: string | null;
  scope?: string | null;
  status: string;
  sector?: string | null;
  department?: string | null;
  currentEdition?: string | null;
  relevanceScore: number;
  matchLevel: MatchLevel;
  rank: number;
  reasons: string[];
  evidence?: MatchEvidence;
  sourceDocument?: {
    title: string;
    url: string;
    authorityLevel: string;
  } | null;
  userReview?: {
    decision: ReviewDecision;
    note?: string | null;
    updatedAt: string;
  } | null;
}

export interface ProductStandardAnalysisResponse {
  analysisId: string;
  productId: string;
  status: AnalysisStatus;
  analysisVersion: string;
  inputHash: string;
  candidateStandards: CandidateStandardMatchItem[];
  totalCandidates: number;
  generatedAt: string;
  fromCache: boolean;
  productProfile: {
    name: string;
    category: string;
    sector?: string;
    material?: string;
    intendedUse?: string;
    application?: string;
    attributes: Record<string, string>;
  };
  meta?: {
    querySignalsUsed: string[];
    durationMs?: number;
  };
}

export interface AnalyzeProductInput {
  forceRefresh?: boolean;
}

export interface CreateProductReviewInput {
  standardId: string;
  decision: ReviewDecision;
  note?: string;
}

export interface ProductStandardReviewItem {
  id: string;
  productId: string;
  standardId: string;
  decision: ReviewDecision;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  standard?: {
    isNumber: string;
    title: string;
  };
}
