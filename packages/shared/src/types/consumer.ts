// ─────────────────────────────────────────────────────────────────────────────
//  Phase 11 — Consumer Services & Hallmarking Intelligence Shared Types
// ─────────────────────────────────────────────────────────────────────────────

import type { AuthorityLevel } from './standard.js';

/**
 * VerificationStatus — authoritative outcome of a licence or HUID verification.
 */
export type VerificationStatus =
  | 'VERIFIED'
  | 'NOT_FOUND'
  | 'SOURCE_UNAVAILABLE'
  | 'NEEDS_REVIEW'
  | 'UNKNOWN';

/**
 * ConsumerServiceType — categorized official citizen & consumer BIS services.
 */
export type ConsumerServiceType =
  | 'LICENCE_VERIFICATION'
  | 'HUID_VERIFICATION'
  | 'HALLMARKING'
  | 'CONSUMER_COMPLAINT'
  | 'STANDARD_SEARCH'
  | 'CERTIFICATION_INFORMATION'
  | 'LABORATORY_INFORMATION'
  | 'GENERAL_BIS_SERVICE'
  | 'OTHER';

/**
 * ConsumerVerificationType — categories of saved user verification queries.
 */
export type ConsumerVerificationType =
  | 'LICENCE'
  | 'HUID'
  | 'HALLMARK_CENTRE'
  | 'STANDARD';

/**
 * GuidanceStatus — state of official guidance provided to consumers.
 */
export type GuidanceStatus =
  | 'GUIDANCE_ONLY'
  | 'READY_FOR_OFFICIAL_ACTION'
  | 'SUBMITTED'
  | 'SUBMISSION_STATUS_UNKNOWN';

/**
 * HallmarkCentreStatus — operational status of an Assaying & Hallmarking Centre.
 */
export type HallmarkCentreStatus =
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'UNKNOWN';

// ─────────────────────────────────────────────────────────────────────────────
//  Data Models & DTOs
// ─────────────────────────────────────────────────────────────────────────────

export interface LicenceVerificationItem {
  licenceNumber: string; // e.g. "CM/L-1234567"
  manufacturer?: string | null;
  productName?: string | null;
  productCategory?: string | null;
  standardNumber?: string | null;
  standardTitle?: string | null;
  status: VerificationStatus;
  statusDetails?: string | null;
  validityStart?: string | null;
  validityEnd?: string | null;
  factoryAddress?: string | null;
  brandName?: string | null;
  source: string;
  sourceUrl?: string | null;
  sourceAuthority: string;
  retrievedAt: string;
  evidence?: any;
  disclaimer: string;
}

export interface HallmarkVerificationItem {
  id?: string;
  userId?: string | null;
  huid: string; // 6-digit alphanumeric code e.g. "AZ1234"
  enteredDetails?: {
    articleType?: string;
    purityKarat?: string;
    jewellerName?: string;
    centreName?: string;
  };
  verificationStatus: VerificationStatus;
  articleType?: string | null;
  purityPpm?: number | null; // e.g. 916 for 22K, 750 for 18K
  purityKarat?: string | null; // e.g. "22K (916)", "18K (750)"
  hallmarkingCentreName?: string | null;
  hallmarkingCentreCode?: string | null;
  hallmarkingDate?: string | null;
  jewellerName?: string | null;
  jewellerRegistrationNumber?: string | null;
  sourceDocumentId?: string | null;
  sourceUrl?: string | null;
  sourceAuthority: string;
  retrievedAt: string;
  evidence?: any;
  disclaimer: string;
  createdAt?: string;
}

export interface HallmarkingCentreItem {
  id: string;
  name: string;
  code: string; // Centre recognition code e.g. "AHC-DL-001"
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: HallmarkCentreStatus | string;
  authorityLevel: AuthorityLevel;
  isVerified: boolean;
  lastVerifiedAt?: string | null;
  sourceUrl?: string | null;
  distanceKm?: number | null;
}

export interface ConsumerServiceItem {
  id: string;
  serviceType: ConsumerServiceType;
  title: string;
  description: string;
  eligibility?: string | null;
  requiredInformation?: string[] | null;
  officialUrl?: string | null;
  sourceAuthority: string;
  status: string;
  lastVerifiedAt?: string | null;
  iconName?: string;
}

export interface ConsumerVerificationHistoryItem {
  id: string;
  userId: string;
  verificationType: ConsumerVerificationType;
  query: any;
  resultStatus: VerificationStatus;
  summary?: string;
  source?: string | null;
  evidence?: any;
  createdAt: string;
}

export interface ConsumerExplanation {
  whatThisMeans: string;
  whyItMatters: string;
  whatYouCanCheck: string[];
  officialSource: string;
  sourceUrl?: string;
  nextStep: string;
}

export interface ConsumerStandardSearchResult {
  standardNumber: string;
  title: string;
  scope?: string | null;
  status: string;
  publicationYear?: number | null;
  isMandatoryQco: boolean;
  qcoName?: string | null;
  sourceUrl?: string | null;
  consumerExplanation: ConsumerExplanation;
}

export interface ConsumerGuidanceStep {
  stepNumber: number;
  title: string;
  description: string;
  requiredDocuments?: string[];
  officialActionLink?: string;
}

export interface ConsumerGuidanceItem {
  serviceType: ConsumerServiceType;
  title: string;
  summary: string;
  guidanceStatus: GuidanceStatus;
  officialPortalUrl: string;
  officialAppName?: string | null;
  officialAppStoreUrl?: string | null;
  officialPlayStoreUrl?: string | null;
  steps: ConsumerGuidanceStep[];
  tips: string[];
  disclaimers: string[];
  contacts?: Array<{ label: string; value: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Request & Response Types
// ─────────────────────────────────────────────────────────────────────────────

export interface VerifyLicenceRequest {
  licenceNumber: string;
  manufacturer?: string;
  productName?: string;
  standardNumber?: string;
  saveHistory?: boolean;
}

export interface VerifyLicenceResponse {
  verification: LicenceVerificationItem;
  savedVerificationId?: string;
}

export interface VerifyHuidRequest {
  huid: string;
  articleType?: string;
  purityKarat?: string;
  jewellerName?: string;
  saveHistory?: boolean;
}

export interface VerifyHuidResponse {
  verification: HallmarkVerificationItem;
  savedVerificationId?: string;
}

export interface HallmarkingCentresQuery {
  search?: string;
  state?: string;
  city?: string;
  pincode?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface HallmarkingCentresResponse {
  centres: HallmarkingCentreItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  availableStates: string[];
}

export interface ConsumerStandardsQuery {
  q: string;
  limit?: number;
}

export interface ConsumerStandardsResponse {
  query: string;
  results: ConsumerStandardSearchResult[];
  total: number;
  sourceCount: number;
}

export interface ConsumerServicesResponse {
  services: ConsumerServiceItem[];
}

export interface ConsumerGuidanceResponse {
  guidance: ConsumerGuidanceItem;
}

export interface ConsumerVerificationsResponse {
  verifications: ConsumerVerificationHistoryItem[];
  total: number;
}
