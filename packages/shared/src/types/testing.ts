// ─────────────────────────────────────────────────────────────────────────────
//  @bis/shared — Phase 8 Testing & Laboratory Intelligence Types
// ─────────────────────────────────────────────────────────────────────────────

import { AnalysisStatus } from './intelligence.js';

export type TestCategory =
  | 'SAFETY'
  | 'PERFORMANCE'
  | 'ELECTRICAL'
  | 'MECHANICAL'
  | 'THERMAL'
  | 'ENVIRONMENTAL'
  | 'CHEMICAL'
  | 'EMC'
  | 'DURABILITY'
  | 'MARKING'
  | 'OTHER'
  | 'UNKNOWN';

export type TestApplicability =
  | 'FACTORY'
  | 'EXTERNAL_LAB'
  | 'BOTH'
  | 'UNKNOWN';

export type TestRequirementStatus =
  | 'REQUIRED'
  | 'CONDITIONALLY_REQUIRED'
  | 'RECOMMENDED'
  | 'UNKNOWN';

export type EquipmentRequiredStatus =
  | 'REQUIRED'
  | 'CONDITIONALLY_REQUIRED'
  | 'REFERENCE'
  | 'UNKNOWN';

export type ExternalLabRequirementType =
  | 'EXTERNAL_LAB_REQUIRED'
  | 'EXTERNAL_LAB_CONDITIONALLY_REQUIRED'
  | 'FACTORY_TESTING'
  | 'UNKNOWN';

export type TestingReadinessStatus =
  | 'TESTING_READY'
  | 'NEEDS_REVIEW'
  | 'MISSING_CALIBRATION'
  | 'MISSING_LAB_REPORT'
  | 'INSUFFICIENT_EVIDENCE';

export type LabOrganizationType =
  | 'BIS_RECOGNIZED'
  | 'NABL_ACCREDITED'
  | 'BIS_AND_NABL'
  | 'OTHER';

export type LabAccreditationStatus =
  | 'ACCREDITED'
  | 'NOT_ACCREDITED'
  | 'UNKNOWN';

export type LabRecognitionStatus =
  | 'BIS_RECOGNIZED'
  | 'NOT_BIS_RECOGNIZED'
  | 'UNKNOWN';

export type LabDecision =
  | 'SHORTLISTED'
  | 'SELECTED'
  | 'REJECTED'
  | 'NEEDS_REVIEW';

export interface ProductTestRequirementItem {
  id: string;
  analysisId: string;
  standardId: string;
  standardNumber?: string;
  standardTitle?: string;
  schemeId?: string | null;
  schemeCode?: string | null;
  testName: string;
  testCategory: TestCategory;
  testMethod?: string | null;
  clause?: string | null;
  parameter?: string | null;
  requirementValue?: string | null;
  unit?: string | null;
  applicability: TestApplicability;
  sourceDocumentId?: string | null;
  sourceUrl?: string | null;
  sourceTitle?: string | null;
  authorityLevel?: string | null;
  evidence?: {
    excerpt?: string;
    sectionTitle?: string;
    sourceTitle?: string;
    sourceUrl?: string;
    authorityLevel?: string;
    retrievedAt?: string;
  } | null;
  status: TestRequirementStatus;
  rank: number;
  createdAt: string;
}

export interface ProductTestEquipmentItem {
  id: string;
  analysisId: string;
  equipmentName: string;
  purpose: string;
  requiredStatus: EquipmentRequiredStatus;
  calibrationRequired: boolean;
  calibrationInterval?: string | null;
  source?: string | null;
  notes?: string | null;
  rank: number;
  createdAt: string;
}

export interface ProductCalibrationRequirementItem {
  id: string;
  analysisId: string;
  equipmentName: string;
  parameterMeasured: string;
  traceabilityStandard?: string | null;
  calibrationInterval?: string | null;
  calibrationAgencyType: string;
  source?: string | null;
  notes?: string | null;
  rank: number;
  createdAt: string;
}

export interface ProductExternalLabRequirementItem {
  id: string;
  analysisId: string;
  schemeId?: string | null;
  schemeCode?: string | null;
  requirementType: ExternalLabRequirementType;
  reason: string;
  sampleSize?: string | null;
  testingDuration?: string | null;
  source?: string | null;
  notes?: string | null;
  rank: number;
  createdAt: string;
}

export interface LaboratoryCapabilityItem {
  id: string;
  laboratoryId: string;
  standardId?: string | null;
  standardNumber?: string | null;
  standardTitle?: string | null;
  testName?: string | null;
  testMethod?: string | null;
  scopeDescription?: string | null;
  accreditationStatus: LabAccreditationStatus;
  recognitionStatus: LabRecognitionStatus;
  sourceTitle?: string | null;
  sourceUrl?: string | null;
  verifiedAt?: string | null;
}

export interface LaboratoryItem {
  id: string;
  name: string;
  code?: string | null;
  organizationType: LabOrganizationType;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country: string;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  status: string;
  sourceDocumentId?: string | null;
  sourceTitle?: string | null;
  sourceUrl?: string | null;
  authorityLevel: string;
  isNabl?: boolean;
  isBisLab?: boolean;
  isVerified: boolean;
  lastVerifiedAt?: string | null;
  capabilities?: LaboratoryCapabilityItem[];
  userReview?: ProductLaboratoryReviewItem | null;
}

export interface LaboratoryMatchResult {
  laboratory: LaboratoryItem;
  capabilityMatch: 'HIGH' | 'PARTIAL' | 'UNVERIFIED';
  matchScore: number;
  matchedTests: string[];
  matchedStandards: string[];
  recognitionStatus: LabRecognitionStatus;
  accreditationStatus: LabAccreditationStatus;
  source?: {
    title?: string;
    url?: string;
    authorityLevel?: string;
  } | null;
}

export interface ProductLaboratoryReviewItem {
  id: string;
  productId: string;
  laboratoryId: string;
  laboratoryName?: string;
  decision: LabDecision;
  note?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductTestingReadiness {
  status: TestingReadinessStatus;
  score: number; // 0 - 100
  summary: string;
  blockers: string[];
  nextSteps: string[];
  factoryTestingReady: boolean;
  externalLabRequired: boolean;
  labShortlisted: boolean;
  labSelected: boolean;
}

export interface ProductTestingAnalysisResponse {
  id: string;
  productId: string;
  certificationAnalysisId?: string | null;
  status: AnalysisStatus;
  analysisVersion: string;
  inputHash: string;
  readiness: ProductTestingReadiness;
  requirements: ProductTestRequirementItem[];
  equipment: ProductTestEquipmentItem[];
  calibration: ProductCalibrationRequirementItem[];
  laboratoryRequirements: ProductExternalLabRequirementItem[];
  laboratories: LaboratoryMatchResult[];
  userSelectedLaboratory?: LaboratoryMatchResult | null;
  sources: {
    title: string;
    url: string;
    authorityLevel: string;
    sourceType?: string;
  }[];
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyzeTestingInput {
  forceRefresh?: boolean;
}

export interface CreateProductLaboratoryReviewInput {
  laboratoryId: string;
  decision: LabDecision;
  note?: string;
}

export interface LaboratoryFilterParams {
  state?: string;
  city?: string;
  standardId?: string;
  testName?: string;
  recognitionStatus?: LabRecognitionStatus;
  accreditationStatus?: LabAccreditationStatus;
  page?: number;
  limit?: number;
}
