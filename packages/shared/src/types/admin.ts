// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin & Knowledge Data Management Intelligence Types
// ─────────────────────────────────────────────────────────────────────────────

import type { AuthorityLevel, SourceType, StandardStatus, IngestionStatus } from './standard.js';

export type LifecycleStatus = 'DRAFT' | 'UNDER_REVIEW' | 'VERIFIED' | 'PUBLISHED' | 'ARCHIVED';

export type DataQualitySeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export type DataQualityCategory =
  | 'MISSING_SOURCE'
  | 'STALE_RECORD'
  | 'DUPLICATE'
  | 'BROKEN_MAPPING'
  | 'ORPHAN_CHUNK'
  | 'MISSING_EMBEDDING'
  | 'UNTRANSLATED_KEY'
  | 'UNVERIFIED_EXTRACTION';

export interface DataQualityIssue {
  id: string;
  category: DataQualityCategory;
  severity: DataQualitySeverity;
  title: string;
  description: string;
  entityType: string;
  entityId?: string;
  remediation: string;
  detectedAt: string;
}

export interface DataQualityReport {
  scannedAt: string;
  totalIssues: number;
  criticalCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  issues: DataQualityIssue[];
}

export interface AdminDashboardMetrics {
  knowledge: {
    totalStandards: number;
    activeStandards: number;
    standardVersions: number;
    amendments: number;
    qcos: number;
    schemes: number;
    productManuals: number;
    knowledgeChunks: number;
  };
  search: {
    totalIndexedChunks: number;
    embeddedChunks: number;
    pendingEmbeddings: number;
    failedEmbeddings: number;
    lexicalOnlyRecords: number;
  };
  sources: {
    totalSources: number;
    verifiedSources: number;
    staleSources: number;
    failedIngestion: number;
    pendingVerification: number;
  };
  consumer: {
    consumerServices: number;
    hallmarkingCentres: number;
    laboratories: number;
  };
  dataQuality: {
    totalIssues: number;
    criticalIssues: number;
    missingSourceCount: number;
    staleRecordCount: number;
    duplicateRecordCount: number;
    orphanChunkCount: number;
    missingEmbeddingCount: number;
  };
  compliance: {
    regulatoryChangeEvents: number;
    activeAlerts: number;
    unresolvedImpacts: number;
  };
}

export interface AdminSourceItem {
  id: string;
  title: string;
  url: string;
  sourceType: SourceType;
  authorityLevel: AuthorityLevel;
  documentType?: string | null;
  publishedAt?: string | null;
  retrievedAt: string;
  contentHash?: string | null;
  versionLabel?: string | null;
  status: string;
  isFresh: boolean;
  freshnessDays?: number;
  standardsCount?: number;
  chunksCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSourceInput {
  title: string;
  url: string;
  sourceType: SourceType;
  authorityLevel?: AuthorityLevel;
  documentType?: string;
  versionLabel?: string;
  status?: string;
}

export interface UpdateSourceInput {
  title?: string;
  url?: string;
  sourceType?: SourceType;
  authorityLevel?: AuthorityLevel;
  documentType?: string;
  versionLabel?: string;
  status?: string;
}

export interface AdminStandardItem {
  id: string;
  isNumber: string;
  canonicalNumber: string;
  title: string;
  shortTitle?: string | null;
  scope?: string | null;
  status: StandardStatus;
  lifecycleStatus: LifecycleStatus;
  sector?: string | null;
  department?: string | null;
  language: string;
  currentEdition?: string | null;
  publicationDate?: string | null;
  withdrawalDate?: string | null;
  sourceDocumentId?: string | null;
  sourceDocument?: {
    id: string;
    title: string;
    url: string;
    authorityLevel: AuthorityLevel;
  } | null;
  versionsCount: number;
  amendmentsCount: number;
  chunksCount: number;
  schemesCount: number;
  qcosCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStandardInput {
  isNumber: string;
  canonicalNumber?: string;
  title: string;
  shortTitle?: string;
  scope?: string;
  status?: StandardStatus;
  sector?: string;
  department?: string;
  currentEdition?: string;
  publicationDate?: string;
  sourceDocumentId: string; // Mandatory provenance
}

export interface UpdateStandardInput {
  title?: string;
  shortTitle?: string;
  scope?: string;
  status?: StandardStatus;
  sector?: string;
  department?: string;
  currentEdition?: string;
  publicationDate?: string;
  withdrawalDate?: string;
  sourceDocumentId?: string;
  isActive?: boolean;
}

export interface AdminQcoItem {
  id: string;
  name: string;
  orderNumber: string;
  ministry?: string | null;
  notificationDate?: string | null;
  effectiveDate?: string | null;
  status: string;
  documentUrl?: string | null;
  sourceDocumentId?: string | null;
  sourceDocument?: {
    id: string;
    title: string;
    url: string;
  } | null;
  standardsCount: number;
  mappedStandards?: {
    id: string;
    isNumber: string;
    title: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateQcoInput {
  name: string;
  orderNumber: string;
  ministry?: string;
  notificationDate?: string;
  effectiveDate?: string;
  documentUrl?: string;
  sourceDocumentId: string; // Mandatory provenance
  standardIds?: string[];
}

export interface UpdateQcoInput {
  name?: string;
  ministry?: string;
  notificationDate?: string;
  effectiveDate?: string;
  status?: string;
  documentUrl?: string;
  sourceDocumentId?: string;
  standardIds?: string[];
}

export interface AdminSchemeItem {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  sourceDocumentId?: string | null;
  sourceDocument?: {
    id: string;
    title: string;
    url: string;
  } | null;
  standardsCount: number;
  manualsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSchemeInput {
  name: string;
  code: string;
  description?: string;
  sourceDocumentId?: string;
}

export interface UpdateSchemeInput {
  name?: string;
  description?: string;
  sourceDocumentId?: string;
}

export interface AdminProductManualItem {
  id: string;
  standardId: string;
  standardIsNumber?: string;
  title: string;
  version?: string | null;
  documentUrl?: string | null;
  publicationDate?: string | null;
  sourceDocumentId?: string | null;
  sourceDocument?: {
    id: string;
    title: string;
    url: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductManualInput {
  standardId: string;
  title: string;
  version?: string;
  documentUrl?: string;
  publicationDate?: string;
  sourceDocumentId?: string;
}

export interface AdminKnowledgeChunkItem {
  id: string;
  chunkType: string;
  sectionTitle?: string | null;
  content: string;
  chunkIndex: number;
  contentHash?: string | null;
  embeddingStatus: IngestionStatus;
  embeddingModel?: string | null;
  embeddingDimension?: number | null;
  standardId?: string | null;
  standardIsNumber?: string | null;
  qcoId?: string | null;
  schemeId?: string | null;
  sourceDocumentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminEmbeddingStatus {
  totalChunks: number;
  embeddedChunks: number;
  pendingChunks: number;
  failedChunks: number;
  provider: string;
  model: string;
  dimension: number;
  lastIndexRun?: string | null;
}

export interface ReindexResult {
  indexedCount: number;
  failedCount: number;
  skippedCount: number;
  durationMs: number;
}

export interface AdminIngestionRunItem {
  id: string;
  sourceName: string;
  sourceUrl?: string | null;
  status: IngestionStatus;
  startedAt: string;
  completedAt?: string | null;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  recordsFailed: number;
  errorSummary?: string | null;
  triggeredBy?: string | null;
}

export interface AdminLaboratoryItem {
  id: string;
  name: string;
  code?: string | null;
  organizationType: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country: string;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  isNabl: boolean;
  isBisLab: boolean;
  status: string;
  isVerified: boolean;
  lastVerifiedAt?: string | null;
  sourceDocumentId?: string | null;
  sourceUrl?: string | null;
  capabilitiesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLaboratoryInput {
  name: string;
  code?: string;
  organizationType?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  website?: string;
  isNabl?: boolean;
  isBisLab?: boolean;
  sourceUrl?: string;
  sourceDocumentId?: string;
}

export interface UpdateLaboratoryInput {
  name?: string;
  code?: string;
  organizationType?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  website?: string;
  isNabl?: boolean;
  isBisLab?: boolean;
  status?: string;
  isVerified?: boolean;
  sourceUrl?: string;
  sourceDocumentId?: string;
}

export interface AdminHallmarkingCentreItem {
  id: string;
  name: string;
  ahcCode: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  recognitionStatus: string;
  sourceUrl?: string | null;
  sourceDocumentId?: string | null;
  lastVerifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHallmarkingCentreInput {
  name: string;
  ahcCode: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
  email?: string;
  website?: string;
  recognitionStatus?: string;
  sourceUrl?: string;
  sourceDocumentId?: string;
}

export interface UpdateHallmarkingCentreInput {
  name?: string;
  ahcCode?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  website?: string;
  recognitionStatus?: string;
  sourceUrl?: string;
  sourceDocumentId?: string;
}

export interface AdminConsumerServiceItem {
  id: string;
  serviceType: string;
  title: string;
  description: string;
  officialUrl: string;
  sourceAuthority: string;
  status: string;
  sourceDocumentId?: string | null;
  lastVerifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConsumerServiceInput {
  serviceType: string;
  title: string;
  description: string;
  officialUrl: string;
  sourceAuthority?: string;
  status?: string;
  sourceDocumentId?: string;
}

export interface UpdateConsumerServiceInput {
  title?: string;
  description?: string;
  officialUrl?: string;
  sourceAuthority?: string;
  status?: string;
  sourceDocumentId?: string;
}

export interface AdminRegulatoryChangeEventItem {
  id: string;
  eventType: string;
  title: string;
  description: string;
  orderNumber?: string | null;
  gazetteNumber?: string | null;
  publicationDate: string;
  effectiveDate?: string | null;
  enforcementDate?: string | null;
  impactLevel: string;
  reviewStatus: string;
  sourceDocumentId?: string | null;
  affectedStandardsCount: number;
  affectedProductsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRegulatoryChangeEventInput {
  eventType: string;
  title: string;
  description: string;
  orderNumber?: string;
  gazetteNumber?: string;
  publicationDate: string;
  effectiveDate?: string;
  enforcementDate?: string;
  impactLevel?: string;
  sourceDocumentId?: string;
  standardIds?: string[];
}

export interface AdminAuditLogItem {
  id: string;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  productId?: string | null;
  productName?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface AuditLogFilterParams {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
