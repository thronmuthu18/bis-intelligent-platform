// ─────────────────────────────────────────────────────────────────────────────
//  Product Domain Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Controlled product workflow statuses.
 * These describe the application onboarding state and MUST NOT imply
 * official BIS approval, legal compliance, or certification.
 */
export type ProductStatus =
  | 'DRAFT'
  | 'INFORMATION_COLLECTION'
  | 'READY_FOR_ANALYSIS'
  | 'ACTIVE'
  | 'ARCHIVED';

export const PRODUCT_STATUSES: ProductStatus[] = [
  'DRAFT',
  'INFORMATION_COLLECTION',
  'READY_FOR_ANALYSIS',
  'ACTIVE',
  'ARCHIVED',
];

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: 'Draft',
  INFORMATION_COLLECTION: 'Information Collection',
  READY_FOR_ANALYSIS: 'Ready for Analysis',
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
};

/**
 * Compliance workflow stages — ordered progression for future phases.
 */
export type ComplianceWorkflowStage =
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
  | 'COMPLIANCE_TRACKING';

export const COMPLIANCE_WORKFLOW_STAGES: ComplianceWorkflowStage[] = [
  'DRAFT',
  'PRODUCT_IDENTIFIED',
  'INFORMATION_COLLECTION',
  'DOCUMENT_COLLECTION',
  'ANALYSIS',
  'STANDARD_IDENTIFICATION',
  'CERTIFICATION_ANALYSIS',
  'TESTING_ANALYSIS',
  'LAB_SELECTION',
  'DOCUMENT_VERIFICATION',
  'READY_FOR_OFFICIAL_ACTION',
  'OFFICIAL_ACTION',
  'COMPLIANCE_TRACKING',
];

export interface Product {
  id: string;
  userId: string;
  name: string;
  category: string;
  description?: string;
  manufacturerType?: string;
  intendedUse?: string;
  targetMarket?: string;
  countryOfManufacture?: string;
  status: ProductStatus;
  workflowStage?: ComplianceWorkflowStage;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
}

export interface CreateProductInput {
  name: string;
  category: string;
  description?: string;
  manufacturerType?: string;
  intendedUse?: string;
  targetMarket?: string;
  countryOfManufacture?: string;
}

export interface UpdateProductInput {
  name?: string;
  category?: string;
  description?: string;
  manufacturerType?: string;
  intendedUse?: string;
  targetMarket?: string;
  countryOfManufacture?: string;
  status?: ProductStatus;
}

export interface ProductSummary {
  id: string;
  userId: string;
  name: string;
  category: string;
  description?: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
}

export interface ProductStats {
  total: number;
  active: number;
  draft: number;
  informationCollection: number;
  readyForAnalysis: number;
  archived: number;
}
