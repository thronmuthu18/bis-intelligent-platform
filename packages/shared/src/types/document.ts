// ─────────────────────────────────────────────────────────────────────────────
//  Phase 9 — Document Intelligence Domain Types
// ─────────────────────────────────────────────────────────────────────────────

export type DocumentType =
  | 'TEST_REPORT'
  | 'CALIBRATION_CERTIFICATE'
  | 'PRODUCT_MANUAL'
  | 'TECHNICAL_SPECIFICATION'
  | 'FACTORY_LAYOUT'
  | 'MANUFACTURING_PROCESS_DOCUMENT'
  | 'QUALITY_CONTROL_DOCUMENT'
  | 'RAW_MATERIAL_DOCUMENT'
  | 'CERTIFICATE'
  | 'APPLICATION_DOCUMENT'
  | 'DECLARATION'
  | 'DECLARATION_OF_CONFORMITY'
  | 'LABORATORY_DOCUMENT'
  | 'IDENTITY_DOCUMENT'
  | 'FACTORY_INSPECTION_REPORT'
  | 'SAFETY_DATA_SHEET'
  | 'LICENSE'
  | 'GOVERNMENT_NOTIFICATION'
  | 'STANDARDS_DOCUMENT'
  | 'OTHER'
  | 'UNKNOWN';

export type DocumentProcessingStatus =
  | 'UPLOADED'
  | 'VALIDATING'
  | 'STORED'
  | 'EXTRACTING'
  | 'EXTRACTED'
  | 'CLASSIFYING'
  | 'CLASSIFIED'
  | 'ANALYZING'
  | 'ANALYZED'
  | 'NEEDS_REVIEW'
  | 'VERIFIED'
  | 'FAILED';

export type DocumentVerificationStatus =
  | 'UNVERIFIED'
  | 'NEEDS_REVIEW'
  | 'VERIFIED'
  | 'REJECTED';

export type DocumentCompletenessStatus =
  | 'COMPLETE'
  | 'PARTIALLY_COMPLETE'
  | 'MISSING_DOCUMENTS'
  | 'NEEDS_REVIEW'
  | 'INSUFFICIENT_EVIDENCE';

export type ChecklistMatchStatus =
  | 'MISSING'
  | 'UPLOADED'
  | 'EXTRACTED'
  | 'MATCHED'
  | 'NEEDS_REVIEW'
  | 'VERIFIED'
  | 'EXPIRED'
  | 'INVALID';

export type TestRequirementMatchStatus =
  | 'MATCHED'
  | 'PARTIAL_MATCH'
  | 'NEEDS_REVIEW'
  | 'NOT_MATCHED'
  | 'UNVERIFIED';

// Legacy compatibility alias
export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'REJECTED';

export interface PageEvidenceItem {
  id?: string;
  pageNumber: number;
  claim: string;
  sourceText: string;
  confidence?: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  sectionKey?: string;
}

export interface TestReportExtractionData {
  laboratoryName?: string | null;
  reportNumber?: string | null;
  reportDate?: string | null;
  productName?: string | null;
  modelNumber?: string | null;
  manufacturerName?: string | null;
  standardNumber?: string | null;
  standardTitle?: string | null;
  testName?: string | null;
  testMethod?: string | null;
  parameter?: string | null;
  result?: string | null;
  unit?: string | null;
  passFailStatus?: 'PASS' | 'FAIL' | 'INCONCLUSIVE' | 'UNKNOWN' | null;
  sampleInformation?: string | null;
  validityDate?: string | null;
  accreditationDetails?: string | null;
}

export interface CalibrationCertificateExtractionData {
  laboratoryName?: string | null;
  certificateNumber?: string | null;
  equipmentName?: string | null;
  equipmentId?: string | null;
  calibrationDate?: string | null;
  calibrationDueDate?: string | null;
  calibrationInterval?: string | null;
  traceabilityStandard?: string | null;
  masterEquipment?: string | null;
  uncertainty?: string | null;
  status?: 'CALIBRATED' | 'OUT_OF_TOLERANCE' | 'UNKNOWN' | null;
}

export interface ProductManualExtractionData {
  productName?: string | null;
  modelNumber?: string | null;
  manufacturerName?: string | null;
  technicalCharacteristics?: string[] | null;
  ratedValues?: Record<string, string> | null;
  dimensions?: string | null;
  materials?: string[] | null;
  applicableStandards?: string[] | null;
}

export interface DocumentStructuredExtractionItem {
  id: string;
  documentId: string;
  extractedType: DocumentType;
  laboratoryName?: string | null;
  reportNumber?: string | null;
  reportDate?: string | null;
  certificateNumber?: string | null;
  calibrationDate?: string | null;
  calibrationDueDate?: string | null;
  calibrationInterval?: string | null;
  traceability?: string | null;
  productName?: string | null;
  modelNumber?: string | null;
  manufacturerName?: string | null;
  standardNumber?: string | null;
  passFailStatus?: string | null;
  validityStatus?: string | null;
  extractedFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChecklistMatchItem {
  id: string;
  documentId: string;
  documentFileName: string;
  documentType: DocumentType;
  checklistItemId?: string | null;
  checklistCategory?: string | null;
  requirementTitle?: string | null;
  matchStatus: ChecklistMatchStatus;
  confidence?: number;
  matchReason?: string | null;
  evidencePage?: number | null;
  evidenceSnippet?: string | null;
  createdAt: string;
}

export interface DocumentTestMatchItem {
  id: string;
  documentId: string;
  documentFileName: string;
  testRequirementId?: string | null;
  testName: string;
  testMethod?: string | null;
  standardNumber?: string | null;
  parameter?: string | null;
  extractedResult?: string | null;
  passFailStatus?: string | null;
  matchStatus: TestRequirementMatchStatus;
  evidencePage?: number | null;
  evidenceSnippet?: string | null;
  createdAt: string;
}

export interface ProductDocumentItem {
  id: string;
  productId: string;
  uploadedByUserId: string;
  originalFileName: string;
  storedFileName: string;
  mimeType: string;
  fileSize: number;
  fileHash?: string | null;
  documentType: DocumentType;
  classificationConfidence?: number | null;
  classificationReasons?: string[] | null;
  processingStatus: DocumentProcessingStatus;
  extractionStatus?: string | null;
  verificationStatus: DocumentVerificationStatus;
  pageCount: number;
  extractedText?: string | null;
  extractionMetadata?: Record<string, any> | null;
  version: number;
  documentFamily?: string | null;
  supersedesDocumentId?: string | null;
  isCurrent: boolean;
  verifiedByUserId?: string | null;
  verifiedAt?: string | null;
  verificationNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt?: string | null;
  // Included relations
  structuredExtraction?: DocumentStructuredExtractionItem | null;
  pageEvidence?: PageEvidenceItem[];
  checklistMatches?: DocumentChecklistMatchItem[];
  testMatches?: DocumentTestMatchItem[];
}

export interface ProductDocumentCompletenessResponse {
  score: number;
  status: DocumentCompletenessStatus;
  totalRequired: number;
  verifiedCount: number;
  matchedCount: number;
  needsReviewCount: number;
  missingCount: number;
  expiredCount: number;
  missingDocumentTypes: {
    category: string;
    title: string;
    reason: string;
    suggestedDocumentType: DocumentType;
  }[];
  checklistBreakdown: {
    id: string;
    category: string;
    title: string;
    requiredStatus: string;
    matchStatus: ChecklistMatchStatus;
    matchedDocumentId?: string | null;
    matchedDocumentName?: string | null;
    evidenceSnippet?: string | null;
  }[];
  blockers: string[];
  nextSteps: string[];
  calculatedAt: string;
}

export interface DocumentRequirementMappingResponse {
  checklistMatches: DocumentChecklistMatchItem[];
  testMatches: DocumentTestMatchItem[];
  unmatchedDocuments: ProductDocumentItem[];
}

export interface VerifyDocumentInput {
  verificationStatus: DocumentVerificationStatus;
  documentType?: DocumentType;
  verificationNotes?: string;
}

export interface UploadDocumentInput {
  productId: string;
  documentType?: DocumentType;
  fileName?: string;
  notes?: string;
}

export interface UploadDocumentResponse {
  document: ProductDocumentItem;
  message: string;
}

export interface DocumentEvidenceResponse {
  documentId: string;
  originalFileName: string;
  pageCount: number;
  evidence: PageEvidenceItem[];
}

// Legacy Document model interface for backwards compatibility
export interface Document {
  id: string;
  productId: string;
  userId: string;
  fileName: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  documentType: DocumentType;
  status: DocumentStatus;
  storageKey: string;
  extractedText?: string;
  extractedFields?: Record<string, unknown>;
  provenance?: DocumentProvenance;
  uploadedAt: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentProvenance {
  uploadedByUserId: string;
  uploadedAt: string;
  originalFileName: string;
  sha256Hash?: string;
}
