// ─────────────────────────────────────────────────────────────────────────────
//  Phase 10 — Compliance Automation & Journey Orchestration Shared Types
// ─────────────────────────────────────────────────────────────────────────────

import type { AuthorityLevel } from './standard.js';
import type { DocumentVerificationStatus } from './document.js';

/**
 * StandardReference — metadata pointing to an Indian Standard.
 */
export interface StandardReference {
  id: string;
  standardNumber: string; // e.g. "IS 10322"
  title: string;
  edition?: string;
  year?: number;
  scope?: string;
  bisUrl?: string;
  sourceAuthority: string;
  retrievedAt: string;
  isVerified: boolean;
}

/**
 * Citation — authoritative source reference for any regulatory finding.
 */
export interface Citation {
  id: string;
  sourceUrl: string;
  sourceTitle: string;
  authority: string;
  documentType: string;
  publicationDate?: string;
  revisionDate?: string;
  retrievedAt: string;
  relevantSection?: string;
  relevantClause?: string;
  excerpt?: string;
  isVerified: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Enums & Status Types
// ─────────────────────────────────────────────────────────────────────────────

export type ComplianceJourneyStatus =
  | 'DRAFT'
  | 'PRODUCT_IDENTIFIED'
  | 'INFORMATION_COLLECTION'
  | 'DOCUMENT_COLLECTION'
  | 'ANALYSIS'
  | 'STANDARD_IDENTIFICATION'
  | 'CERTIFICATION_ANALYSIS'
  | 'TESTING_ANALYSIS'
  | 'LAB_SELECTION'
  | 'DOCUMENT_VERIFICATION'
  | 'READY_FOR_OFFICIAL_ACTION'
  | 'OFFICIAL_ACTION'
  | 'COMPLIANCE_TRACKING'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'ARCHIVED';

export type ComplianceRequirementType =
  | 'STANDARD'
  | 'CERTIFICATION'
  | 'TEST'
  | 'DOCUMENT'
  | 'LABORATORY'
  | 'APPLICATION'
  | 'FACTORY'
  | 'QUALITY_CONTROL'
  | 'MARKING'
  | 'QCO'
  | 'OTHER';

export type ComplianceRequirementStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'NEEDS_REVIEW'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'WAIVED'
  | 'NOT_APPLICABLE';

export type MandatoryStatus = 'MANDATORY' | 'RECOMMENDED' | 'OPTIONAL' | 'CONDITIONAL';

export type RequirementPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ComplianceTaskType =
  | 'UPLOAD_DOCUMENT'
  | 'VERIFY_DOCUMENT'
  | 'COMPLETE_PRODUCT_INFO'
  | 'REVIEW_STANDARD'
  | 'REVIEW_CERTIFICATION'
  | 'COMPLETE_TEST'
  | 'SELECT_LAB'
  | 'VERIFY_TEST_REPORT'
  | 'COMPLETE_APPLICATION'
  | 'REVIEW_QCO'
  | 'REVIEW_GAZETTE'
  | 'OTHER';

export type ComplianceTaskStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'CANCELLED';

export type AutomationRunType =
  | 'INITIALIZE'
  | 'RECALCULATE'
  | 'DOCUMENT_UPDATE'
  | 'TESTING_UPDATE'
  | 'CERTIFICATION_UPDATE'
  | 'QCO_UPDATE'
  | 'GAZETTE_UPDATE'
  | 'MANUAL_REFRESH';

export type ApplicationDossierStatus =
  | 'DRAFT'
  | 'INCOMPLETE'
  | 'READY_FOR_REVIEW'
  | 'READY_FOR_OFFICIAL_ACTION'
  | 'ARCHIVED';

export type DossierItemStatus =
  | 'MISSING'
  | 'PRESENT'
  | 'NEEDS_REVIEW'
  | 'VERIFIED'
  | 'NOT_APPLICABLE';

export type RegulatoryChangeType =
  | 'QCO_NEW'
  | 'QCO_UPDATED'
  | 'QCO_REPLACED'
  | 'QCO_REVOKED'
  | 'STANDARD_AMENDED'
  | 'STANDARD_REVISED'
  | 'GAZETTE_UPDATED'
  | 'OTHER';

export type RegulatoryImpactLevel =
  | 'NO_IMPACT'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'NEEDS_REVIEW';

export type ComplianceAlertType =
  | 'DOCUMENT_EXPIRING'
  | 'DOCUMENT_MISSING'
  | 'TEST_MISSING'
  | 'REVIEW_REQUIRED'
  | 'QCO_CHANGE'
  | 'STANDARD_AMENDMENT'
  | 'JOURNEY_BLOCKED'
  | 'DOSSIER_INCOMPLETE'
  | 'OTHER';

// ─────────────────────────────────────────────────────────────────────────────
//  Response & Item Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface ComplianceJourneyItem {
  id: string;
  productId: string;
  productName?: string;
  status: ComplianceJourneyStatus;
  journeyVersion: string;
  inputHash: string;
  readinessScore: number;
  readinessStatus: string;
  currentStage: string;
  summary?: string | null;
  startedAt: string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  requirementsCount?: number;
  completedRequirementsCount?: number;
  tasksCount?: number;
  completedTasksCount?: number;
  blockedTasksCount?: number;
}

export interface ComplianceRequirementItem {
  id: string;
  journeyId: string;
  standardId?: string | null;
  standardNumber?: string | null;
  requirementType: ComplianceRequirementType;
  sourceEntityType: string;
  sourceEntityId?: string | null;
  title: string;
  description?: string | null;
  mandatoryStatus: MandatoryStatus;
  priority: RequirementPriority;
  status: ComplianceRequirementStatus;
  evidenceRequired: boolean;
  sourceDocumentId?: string | null;
  sourceUrl?: string | null;
  sourceAuthority?: AuthorityLevel;
  evidence?: any;
  waivedReason?: string | null;
  waivedAt?: string | null;
  prerequisites?: string[]; // IDs of prerequisite requirements
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceTaskItem {
  id: string;
  journeyId: string;
  requirementId?: string | null;
  requirementTitle?: string | null;
  requirementType?: ComplianceRequirementType | null;
  title: string;
  description?: string | null;
  taskType: ComplianceTaskType;
  status: ComplianceTaskStatus;
  priority: RequirementPriority;
  assignedToUserId?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  blockerReason?: string | null;
  sourceEvidence?: any;
  taskOrder: number;
  isBlocked?: boolean;
  blockingReasons?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationDossierItemResponse {
  id: string;
  dossierId: string;
  requirementId?: string | null;
  itemType: string;
  title: string;
  description?: string | null;
  sourceType: string;
  sourceEntityId?: string | null;
  documentId?: string | null;
  documentFileName?: string | null;
  verificationStatus: DocumentVerificationStatus;
  required: boolean;
  status: DossierItemStatus;
  evidence?: any;
  itemOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationDossierResponse {
  id: string;
  journeyId: string;
  productId: string;
  version: number;
  status: ApplicationDossierStatus;
  title: string;
  summary?: string | null;
  completenessScore: number;
  missingCount: number;
  unverifiedCount: number;
  verifiedCount: number;
  validatedAt?: string | null;
  exportedAt?: string | null;
  metadata?: any;
  items: ApplicationDossierItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceAlertItem {
  id: string;
  productId: string;
  productName?: string;
  journeyId?: string | null;
  alertType: ComplianceAlertType;
  priority: RequirementPriority;
  title: string;
  reason: string;
  source?: string | null;
  recommendedAction?: string | null;
  isRead: boolean;
  isResolved: boolean;
  readAt?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegulatoryChangeEventItem {
  id: string;
  sourceDocumentId?: string | null;
  changeType: RegulatoryChangeType;
  title: string;
  summary?: string | null;
  affectedStandards?: string[];
  affectedProductCategories?: string[];
  effectiveDate?: string | null;
  detectedAt: string;
  sourceUrl?: string | null;
  authorityLevel: AuthorityLevel;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegulatoryImpactItem {
  id: string;
  changeEventId: string;
  productId: string;
  journeyId?: string | null;
  impactLevel: RegulatoryImpactLevel;
  affectedRequirements?: string[];
  requiredActions?: string[];
  evidence?: any;
  status: string;
  changeEvent?: RegulatoryChangeEventItem;
  createdAt: string;
}

export interface DomainReadinessScore {
  domain: 'STANDARDS' | 'CERTIFICATION' | 'TESTING' | 'LABORATORY' | 'DOCUMENTS' | 'OVERALL';
  score: number; // 0-100
  status: 'COMPLETE' | 'IN_PROGRESS' | 'NEEDS_REVIEW' | 'BLOCKED';
  totalRequirements: number;
  completedRequirements: number;
  pendingRequirements: number;
  details: string;
}

export interface ComplianceReadinessResponse {
  overallScore: number;
  readinessStatus: string;
  domainScores: DomainReadinessScore[];
  completedRequirements: number;
  incompleteRequirements: number;
  blockedRequirements: number;
  documentsNeedingReview: number;
  missingTests: number;
  missingLaboratoryActions: number;
  missingCertificationActions: number;
  qcoBlockers: number;
  criticalNextActions: string[];
  explanation: string;
  calculatedAt: string;
}

export interface ComplianceTimelineEvent {
  id: string;
  stage: string;
  title: string;
  description: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'ATTENTION_REQUIRED' | 'PENDING';
  actor?: string;
  timestamp: string;
  evidenceSnippet?: string;
}

export interface ComplianceJourneyOverviewResponse {
  journey: ComplianceJourneyItem;
  readiness: ComplianceReadinessResponse;
  confirmedStandards: Array<{
    id: string;
    isNumber: string;
    title: string;
    status: string;
    schemeTitle?: string;
  }>;
  tasks: ComplianceTaskItem[];
  alerts: ComplianceAlertItem[];
  regulatoryImpacts: RegulatoryImpactItem[];
  dossierSummary?: {
    id: string;
    status: ApplicationDossierStatus;
    completenessScore: number;
    missingCount: number;
    verifiedCount: number;
  } | null;
  timeline: ComplianceTimelineEvent[];
}

export interface CompleteTaskInput {
  evidenceNotes?: string;
}

export interface CompileDossierInput {
  title?: string;
  notes?: string;
}

export interface ValidateDossierResponse {
  isValid: boolean;
  status: ApplicationDossierStatus;
  completenessScore: number;
  missingItems: ApplicationDossierItemResponse[];
  unverifiedItems: ApplicationDossierItemResponse[];
  warnings: string[];
  blockers: string[];
  validatedAt: string;
}
