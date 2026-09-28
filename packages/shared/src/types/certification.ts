// ─────────────────────────────────────────────────────────────────────────────
//  Phase 7 — Certification Intelligence & Scheme Recommendation Shared Types
// ─────────────────────────────────────────────────────────────────────────────

export type SchemeRelevanceLevel =
  | 'RELEVANT'
  | 'POTENTIALLY_RELEVANT'
  | 'NEEDS_REVIEW'
  | 'INSUFFICIENT_EVIDENCE';

export type DocumentRequiredStatus =
  | 'REQUIRED'
  | 'CONDITIONALLY_REQUIRED'
  | 'REFERENCE'
  | 'UNKNOWN';

export type FeeType =
  | 'APPLICATION_FEE'
  | 'PROCESSING_FEE'
  | 'TESTING_FEE'
  | 'INSPECTION_FEE'
  | 'ANNUAL_FEE'
  | 'REGISTRATION_FEE'
  | 'OTHER';

export type FeeStatus =
  | 'OFFICIAL_FEE'
  | 'ESTIMATED_FEE'
  | 'NOT_AVAILABLE'
  | 'VARIABLE';

export type CertificationReadinessStatus =
  | 'READY_FOR_DOCUMENT_REVIEW'
  | 'MISSING_DOCUMENTATION'
  | 'MISSING_PRODUCT_INFORMATION'
  | 'INSUFFICIENT_BIS_EVIDENCE'
  | 'NEEDS_USER_REVIEW';

export interface ProductSchemeRecommendationItem {
  id: string;
  schemeId: string;
  standardId: string;
  schemeCode: string;
  schemeName: string;
  schemeDescription?: string | null;
  standardIsNumber: string;
  standardTitle: string;
  relevanceLevel: SchemeRelevanceLevel;
  confidenceScore: number;
  reasons: string[];
  evidence?: {
    mappingNotes?: string | null;
    sourceDocument?: {
      title: string;
      url: string;
      authorityLevel: string;
    } | null;
    productManual?: {
      title: string;
      version?: string | null;
      documentUrl?: string | null;
    } | null;
  } | null;
  rank: number;
  userReview?: {
    decision: 'CONFIRMED' | 'REJECTED' | 'NEEDS_REVIEW';
    note?: string | null;
    updatedAt: string;
  } | null;
}

export interface ProductDocumentationChecklistItem {
  id: string;
  schemeId?: string | null;
  category: string;
  documentName: string;
  requiredStatus: DocumentRequiredStatus;
  reason: string;
  source?: string | null;
  notes?: string | null;
  rank: number;
}

export interface ProductApplicationRequirementItem {
  id: string;
  schemeId?: string | null;
  formName: string;
  formPurpose: string;
  applicableScheme: string;
  source?: string | null;
  officialUrl?: string | null;
  rank: number;
}

export interface CertificationFeeEstimateItem {
  id: string;
  schemeId?: string | null;
  feeType: FeeType;
  amount?: number | null;
  currency: string;
  status: FeeStatus;
  source?: string | null;
  effectiveDate?: string | null;
  notes?: string | null;
}

export interface ProductQcoInformationItem {
  id: string;
  qcoId: string;
  standardId: string;
  qcoTitle: string;
  orderNumber: string;
  issuingAuthority?: string | null;
  notificationDate?: string | null;
  effectiveDate?: string | null;
  sourceUrl?: string | null;
  status: string;
  isMandatory: boolean;
  notes?: string | null;
}

export interface ProductCertificationReadiness {
  status: CertificationReadinessStatus;
  score: number; // 0 to 100
  summary: string;
  blockers: string[];
  recommendations: string[];
}

export interface ProductCertificationAnalysisResponse {
  analysisId: string;
  productId: string;
  productStandardAnalysisId?: string | null;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  analysisVersion: string;
  inputHash: string;
  generatedAt: string;
  fromCache: boolean;
  schemes: ProductSchemeRecommendationItem[];
  qcoInformation: ProductQcoInformationItem[];
  documentation: ProductDocumentationChecklistItem[];
  applicationRequirements: ProductApplicationRequirementItem[];
  fees: CertificationFeeEstimateItem[];
  readiness: ProductCertificationReadiness;
  sources: Array<{
    title: string;
    url: string;
    authorityLevel: string;
    sourceType?: string;
  }>;
}

export interface AnalyzeCertificationInput {
  forceRefresh?: boolean;
}

export interface CreateProductSchemeReviewInput {
  schemeId: string;
  decision: 'CONFIRMED' | 'REJECTED' | 'NEEDS_REVIEW';
  note?: string;
}

export interface ProductSchemeReviewItem {
  id: string;
  productId: string;
  schemeId: string;
  decision: 'CONFIRMED' | 'REJECTED' | 'NEEDS_REVIEW';
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SchemeDetailResponse {
  scheme: {
    id: string;
    code: string;
    name: string;
    description?: string | null;
  };
  associatedStandards: Array<{
    id: string;
    isNumber: string;
    title: string;
    notes?: string | null;
  }>;
  productManuals: Array<{
    id: string;
    title: string;
    version?: string | null;
    documentUrl?: string | null;
  }>;
  qcos: Array<{
    id: string;
    name: string;
    orderNumber: string;
    ministry?: string | null;
    effectiveDate?: string | null;
  }>;
  documentation: ProductDocumentationChecklistItem[];
  applicationRequirements: ProductApplicationRequirementItem[];
  fees: CertificationFeeEstimateItem[];
  sourceEvidence: Array<{
    title: string;
    url: string;
    authorityLevel: string;
  }>;
}
