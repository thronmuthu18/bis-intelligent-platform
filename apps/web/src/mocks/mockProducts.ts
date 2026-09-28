import type { ComplianceWorkflowStage } from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  DEMO DATA — NOT real BIS data. For UI development only.
//  Replace with API calls in future phases.
// ─────────────────────────────────────────────────────────────────────────────

export interface MockProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  stage: ComplianceWorkflowStage;
  progressPercent: number;
  updatedAt: string;
  isActive: boolean;
}

export const DEMO_PRODUCTS: MockProduct[] = [
  {
    id: 'demo-prod-1',
    name: 'LED Light Fitting (Type B)',
    category: 'Electrical Equipment',
    description: 'Indoor LED luminaires for residential use, 15W, 220V AC.',
    stage: 'INFORMATION_COLLECTION',
    progressPercent: 30,
    updatedAt: '2026-09-22',
    isActive: true,
  },
  {
    id: 'demo-prod-2',
    name: 'Domestic Pressure Cooker',
    category: 'Household Appliances',
    description: 'Aluminium pressure cooker, 5L capacity.',
    stage: 'DOCUMENT_COLLECTION',
    progressPercent: 55,
    updatedAt: '2026-09-21',
    isActive: true,
  },
  {
    id: 'demo-prod-3',
    name: 'Safety Helmet (Industrial)',
    category: 'Personal Protective Equipment',
    description: 'Hard hat for industrial use, HDPE shell.',
    stage: 'ANALYSIS',
    progressPercent: 70,
    updatedAt: '2026-09-18',
    isActive: true,
  },
];

export const STAGE_LABELS: Record<ComplianceWorkflowStage, string> = {
  DRAFT: 'Draft',
  PRODUCT_IDENTIFIED: 'Product Identified',
  INFORMATION_COLLECTION: 'Information Collection',
  DOCUMENT_COLLECTION: 'Document Collection',
  ANALYSIS: 'Under Analysis',
  STANDARD_IDENTIFICATION: 'Standards Identified',
  CERTIFICATION_ANALYSIS: 'Certification Analysis',
  TESTING_ANALYSIS: 'Testing Analysis',
  LAB_SELECTION: 'Lab Selection',
  DOCUMENT_VERIFICATION: 'Document Verification',
  READY_FOR_OFFICIAL_ACTION: 'Ready for Action',
  OFFICIAL_ACTION: 'Official Action',
  COMPLIANCE_TRACKING: 'Compliance Tracking',
};

export function getStageColor(stage: ComplianceWorkflowStage): 'grey' | 'blue' | 'yellow' | 'green' {
  if (stage === 'DRAFT') return 'grey';
  if (['PRODUCT_IDENTIFIED', 'INFORMATION_COLLECTION', 'DOCUMENT_COLLECTION'].includes(stage))
    return 'blue';
  if (['ANALYSIS', 'STANDARD_IDENTIFICATION', 'CERTIFICATION_ANALYSIS', 'TESTING_ANALYSIS', 'LAB_SELECTION'].includes(stage))
    return 'yellow';
  return 'green';
}
