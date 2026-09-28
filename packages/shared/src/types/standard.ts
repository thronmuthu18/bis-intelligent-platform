// ─────────────────────────────────────────────────────────────────────────────
//  BIS Knowledge Layer — Standard & Provenance Domain Types (Phase 4 & 5)
// ─────────────────────────────────────────────────────────────────────────────

export type SourceType =
  | 'BIS_OFFICIAL'
  | 'GOVERNMENT_GAZETTE'
  | 'BIS_DOCUMENT'
  | 'OTHER_REFERENCE';

export type AuthorityLevel =
  | 'AUTHORITATIVE'
  | 'REFERENCE'
  | 'UNVERIFIED';

export type IngestionStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'PARTIAL'
  | 'FAILED';

export type StandardStatus =
  | 'CURRENT'
  | 'SUPERSEDED'
  | 'WITHDRAWN'
  | 'DRAFT'
  | 'UNKNOWN';

export type SearchMode =
  | 'keyword'
  | 'semantic'
  | 'hybrid';

export type KnowledgeChunkType =
  | 'STANDARD_TITLE'
  | 'STANDARD_SCOPE'
  | 'STANDARD_METADATA'
  | 'STANDARD_VERSION'
  | 'STANDARD_AMENDMENT'
  | 'QCO'
  | 'SCHEME'
  | 'PRODUCT_MANUAL';

export const STANDARD_STATUS_LABELS: Record<StandardStatus, string> = {
  CURRENT: 'Current / In Force',
  SUPERSEDED: 'Superseded',
  WITHDRAWN: 'Withdrawn',
  DRAFT: 'Draft / Under Formulation',
  UNKNOWN: 'Status Unknown',
};

export const AUTHORITY_LEVEL_LABELS: Record<AuthorityLevel, string> = {
  AUTHORITATIVE: 'Authoritative Official Source',
  REFERENCE: 'Official Reference Material',
  UNVERIFIED: 'Unverified Reference',
};

export interface SourceDocument {
  id: string;
  title: string;
  url: string;
  sourceType: SourceType;
  authorityLevel: AuthorityLevel;
  documentType?: string;
  publishedAt?: string;
  retrievedAt: string;
  contentHash?: string;
  versionLabel?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Standard {
  id: string;
  isNumber: string;
  canonicalNumber: string;
  title: string;
  shortTitle?: string;
  scope?: string;
  status: StandardStatus;
  sector?: string;
  department?: string;
  language: string;
  currentEdition?: string;
  publicationDate?: string;
  withdrawalDate?: string;
  sourceDocumentId?: string;
  sourceDocument?: SourceDocument;
  createdAt: string;
  updatedAt: string;
}

export interface StandardSummary {
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
  sourceDocument?: SourceDocument;
}

export interface StandardVersion {
  id: string;
  standardId: string;
  edition: string;
  year?: number;
  publicationDate?: string;
  status: StandardStatus;
  documentUrl?: string;
  sourceDocumentId?: string;
  sourceDocument?: SourceDocument;
  createdAt: string;
  updatedAt: string;
}

export interface StandardAmendment {
  id: string;
  standardId: string;
  amendmentNumber: string;
  title?: string;
  publicationDate?: string;
  effectiveDate?: string;
  documentUrl?: string;
  sourceDocumentId?: string;
  sourceDocument?: SourceDocument;
  createdAt: string;
  updatedAt: string;
}

export interface QCO {
  id: string;
  name: string;
  orderNumber: string;
  ministry?: string;
  notificationDate?: string;
  effectiveDate?: string;
  status: string;
  documentUrl?: string;
  sourceDocumentId?: string;
  sourceDocument?: SourceDocument;
  createdAt: string;
  updatedAt: string;
}

export interface QCOStandardMapping {
  id: string;
  qcoId: string;
  standardId: string;
  productDescription?: string;
  notes?: string;
  qco?: QCO;
  standard?: Standard;
  createdAt?: string;
}

export interface Scheme {
  id: string;
  name: string;
  code: string;
  description?: string;
  sourceDocumentId?: string;
  sourceDocument?: SourceDocument;
  createdAt: string;
  updatedAt: string;
}

export interface StandardSchemeMapping {
  id: string;
  standardId: string;
  schemeId: string;
  sourceDocumentId?: string;
  notes?: string;
  scheme?: Scheme;
  standard?: Standard;
  sourceDocument?: SourceDocument;
  createdAt?: string;
}

export interface ProductManual {
  id: string;
  standardId: string;
  title: string;
  documentUrl?: string;
  version?: string;
  publicationDate?: string;
  sourceDocumentId?: string;
  sourceDocument?: SourceDocument;
  createdAt: string;
  updatedAt: string;
}

export interface IngestionRun {
  id: string;
  sourceName: string;
  sourceUrl?: string;
  startedAt: string;
  completedAt?: string;
  status: IngestionStatus;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  recordsFailed: number;
  errorSummary?: string;
  triggeredBy?: string;
  createdAt: string;
}

export interface StandardDetailResponse extends Standard {
  versions: StandardVersion[];
  amendments: StandardAmendment[];
  qcoMappings: (QCOStandardMapping & { qco: QCO })[];
  schemeMappings: (StandardSchemeMapping & { scheme: Scheme })[];
  productManuals: ProductManual[];
  sourceDocument?: SourceDocument;
}

export interface StandardSearchParams {
  q?: string;
  isNumber?: string;
  sector?: string;
  department?: string;
  status?: StandardStatus;
  authorityLevel?: AuthorityLevel;
  mode?: SearchMode;
  page?: number;
  limit?: number;
}

export interface StandardListResponse {
  standards: StandardSummary[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SourceRegistryItem {
  id: string;
  name: string;
  description: string;
  url: string;
  sourceType: SourceType;
  authorityLevel: AuthorityLevel;
  allowedDomains: string[];
  lastCheckedAt?: string;
  isActive: boolean;
}

export interface TriggerIngestionInput {
  sourceKey?: string;
  sourceName?: string;
  sourceUrl?: string;
  sourceType?: SourceType;
  dryRun?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Phase 5 — Hybrid Search & RAG Foundation Domain Types
// ─────────────────────────────────────────────────────────────────────────────

export interface KnowledgeChunk {
  id: string;
  sourceDocumentId?: string;
  standardId?: string;
  standardVersionId?: string;
  standardAmendmentId?: string;
  qcoId?: string;
  schemeId?: string;
  productManualId?: string;
  chunkType: KnowledgeChunkType;
  sectionTitle?: string;
  content: string;
  chunkIndex: number;
  embeddingModel?: string;
  embeddingDimension?: number;
  embeddingVersion?: string;
  contentHash?: string;
  embeddingStatus: IngestionStatus;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MatchedChunkEvidence {
  chunkId: string;
  chunkType: KnowledgeChunkType;
  sectionTitle?: string;
  contentSnippet: string;
  score: number;
}

export interface HybridSearchResultItem extends StandardSummary {
  relevanceScore: number;
  lexicalScore?: number;
  semanticScore?: number;
  searchMode: SearchMode;
  matchedChunks: MatchedChunkEvidence[];
  matchReason?: string;
}

export interface HybridSearchResponse {
  results: HybridSearchResultItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  meta: {
    query: string;
    mode: SearchMode;
    appliedWeights?: {
      lexical: number;
      semantic: number;
    };
    semanticFallbackUsed?: boolean;
  };
}

export interface RagContextCitation {
  citationIndex: number;
  standardId?: string;
  isNumber?: string;
  sourceTitle: string;
  sourceUrl: string;
  authorityLevel: AuthorityLevel;
  documentType?: string;
  clauseOrSection?: string;
}

export interface RagContextEvidenceItem {
  standardId: string;
  isNumber: string;
  title: string;
  scope?: string;
  status: StandardStatus;
  content: string;
  relevanceScore: number;
  source: {
    title: string;
    url: string;
    authorityLevel: AuthorityLevel;
  };
  citation: RagContextCitation;
}

export interface RagContextResponse {
  query: string;
  topK: number;
  totalEvidenceChunks: number;
  contextText: string;
  results: RagContextEvidenceItem[];
  citations: RagContextCitation[];
  meta: {
    characterCount: number;
    truncated: boolean;
    generatedAt: string;
  };
}

export interface RagRetrieveInput {
  query: string;
  topK?: number;
  filters?: {
    sector?: string;
    department?: string;
    status?: StandardStatus;
    authorityLevel?: AuthorityLevel;
  };
  maxCharacters?: number;
}

export interface ReindexEmbeddingsInput {
  forceReindex?: boolean;
  batchSize?: number;
}

export interface EmbeddingStatusResponse {
  totalChunks: number;
  embeddedChunks: number;
  pendingChunks: number;
  failedChunks: number;
  embeddingModel: string;
  embeddingDimension: number;
  provider: string;
}
