-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'DATA_MANAGER');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'INFORMATION_COLLECTION', 'READY_FOR_ANALYSIS', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ComplianceWorkflowStage" AS ENUM ('DRAFT', 'PRODUCT_IDENTIFIED', 'INFORMATION_COLLECTION', 'DOCUMENT_COLLECTION', 'ANALYSIS', 'STANDARD_IDENTIFICATION', 'CERTIFICATION_ANALYSIS', 'TESTING_ANALYSIS', 'LAB_SELECTION', 'DOCUMENT_VERIFICATION', 'READY_FOR_OFFICIAL_ACTION', 'OFFICIAL_ACTION', 'COMPLIANCE_TRACKING');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('TEST_REPORT', 'CALIBRATION_CERTIFICATE', 'PRODUCT_MANUAL', 'TECHNICAL_SPECIFICATION', 'FACTORY_LAYOUT', 'MANUFACTURING_PROCESS_DOCUMENT', 'QUALITY_CONTROL_DOCUMENT', 'RAW_MATERIAL_DOCUMENT', 'CERTIFICATE', 'APPLICATION_DOCUMENT', 'DECLARATION', 'DECLARATION_OF_CONFORMITY', 'LABORATORY_DOCUMENT', 'IDENTITY_DOCUMENT', 'FACTORY_INSPECTION_REPORT', 'SAFETY_DATA_SHEET', 'LICENSE', 'GOVERNMENT_NOTIFICATION', 'STANDARDS_DOCUMENT', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "DocumentProcessingStatus" AS ENUM ('UPLOADED', 'VALIDATING', 'STORED', 'EXTRACTING', 'EXTRACTED', 'CLASSIFYING', 'CLASSIFIED', 'ANALYZING', 'ANALYZED', 'NEEDS_REVIEW', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "DocumentVerificationStatus" AS ENUM ('UNVERIFIED', 'NEEDS_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DocumentCompletenessStatus" AS ENUM ('COMPLETE', 'PARTIALLY_COMPLETE', 'MISSING_DOCUMENTS', 'NEEDS_REVIEW', 'INSUFFICIENT_EVIDENCE');

-- CreateEnum
CREATE TYPE "ChecklistMatchStatus" AS ENUM ('MISSING', 'UPLOADED', 'EXTRACTED', 'MATCHED', 'NEEDS_REVIEW', 'VERIFIED', 'EXPIRED', 'INVALID');

-- CreateEnum
CREATE TYPE "TestRequirementMatchStatus" AS ENUM ('MATCHED', 'PARTIAL_MATCH', 'NEEDS_REVIEW', 'NOT_MATCHED', 'UNVERIFIED');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('BIS_OFFICIAL', 'GOVERNMENT_GAZETTE', 'BIS_DOCUMENT', 'OTHER_REFERENCE');

-- CreateEnum
CREATE TYPE "AuthorityLevel" AS ENUM ('AUTHORITATIVE', 'REFERENCE', 'UNVERIFIED');

-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "StandardStatus" AS ENUM ('CURRENT', 'SUPERSEDED', 'WITHDRAWN', 'DRAFT', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AiMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AttributeSource" AS ENUM ('USER', 'AI_EXTRACTED', 'USER_CONFIRMED', 'SYSTEM_NORMALIZED');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "MatchLevel" AS ENUM ('HIGHLY_RELEVANT', 'RELEVANT', 'POTENTIALLY_RELEVANT');

-- CreateEnum
CREATE TYPE "ReviewDecision" AS ENUM ('CONFIRMED', 'REJECTED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "SchemeRelevanceLevel" AS ENUM ('RELEVANT', 'POTENTIALLY_RELEVANT', 'NEEDS_REVIEW', 'INSUFFICIENT_EVIDENCE');

-- CreateEnum
CREATE TYPE "DocumentRequiredStatus" AS ENUM ('REQUIRED', 'CONDITIONALLY_REQUIRED', 'REFERENCE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('APPLICATION_FEE', 'PROCESSING_FEE', 'TESTING_FEE', 'INSPECTION_FEE', 'ANNUAL_FEE', 'REGISTRATION_FEE', 'OTHER');

-- CreateEnum
CREATE TYPE "FeeStatus" AS ENUM ('OFFICIAL_FEE', 'ESTIMATED_FEE', 'NOT_AVAILABLE', 'VARIABLE');

-- CreateEnum
CREATE TYPE "CertificationReadinessStatus" AS ENUM ('READY_FOR_DOCUMENT_REVIEW', 'MISSING_DOCUMENTATION', 'MISSING_PRODUCT_INFORMATION', 'INSUFFICIENT_BIS_EVIDENCE', 'NEEDS_USER_REVIEW');

-- CreateEnum
CREATE TYPE "TestCategory" AS ENUM ('SAFETY', 'PERFORMANCE', 'ELECTRICAL', 'MECHANICAL', 'THERMAL', 'ENVIRONMENTAL', 'CHEMICAL', 'EMC', 'DURABILITY', 'MARKING', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "TestApplicability" AS ENUM ('FACTORY', 'EXTERNAL_LAB', 'BOTH', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "TestRequirementStatus" AS ENUM ('REQUIRED', 'CONDITIONALLY_REQUIRED', 'RECOMMENDED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "EquipmentRequiredStatus" AS ENUM ('REQUIRED', 'CONDITIONALLY_REQUIRED', 'REFERENCE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ExternalLabRequirementType" AS ENUM ('EXTERNAL_LAB_REQUIRED', 'EXTERNAL_LAB_CONDITIONALLY_REQUIRED', 'FACTORY_TESTING', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "TestingReadinessStatus" AS ENUM ('TESTING_READY', 'NEEDS_REVIEW', 'MISSING_CALIBRATION', 'MISSING_LAB_REPORT', 'INSUFFICIENT_EVIDENCE');

-- CreateEnum
CREATE TYPE "LabOrganizationType" AS ENUM ('BIS_RECOGNIZED', 'NABL_ACCREDITED', 'BIS_AND_NABL', 'OTHER');

-- CreateEnum
CREATE TYPE "LabAccreditationStatus" AS ENUM ('ACCREDITED', 'NOT_ACCREDITED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "LabRecognitionStatus" AS ENUM ('BIS_RECOGNIZED', 'NOT_BIS_RECOGNIZED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "LabDecision" AS ENUM ('SHORTLISTED', 'SELECTED', 'REJECTED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "ComplianceJourneyStatus" AS ENUM ('DRAFT', 'PRODUCT_IDENTIFIED', 'INFORMATION_COLLECTION', 'DOCUMENT_COLLECTION', 'ANALYSIS', 'STANDARD_IDENTIFICATION', 'CERTIFICATION_ANALYSIS', 'TESTING_ANALYSIS', 'LAB_SELECTION', 'DOCUMENT_VERIFICATION', 'READY_FOR_OFFICIAL_ACTION', 'OFFICIAL_ACTION', 'COMPLIANCE_TRACKING', 'COMPLETED', 'BLOCKED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ComplianceRequirementType" AS ENUM ('STANDARD', 'CERTIFICATION', 'TEST', 'DOCUMENT', 'LABORATORY', 'APPLICATION', 'FACTORY', 'QUALITY_CONTROL', 'MARKING', 'QCO', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplianceRequirementStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'NEEDS_REVIEW', 'BLOCKED', 'COMPLETED', 'WAIVED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "MandatoryStatus" AS ENUM ('MANDATORY', 'RECOMMENDED', 'OPTIONAL', 'CONDITIONAL');

-- CreateEnum
CREATE TYPE "RequirementPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "ComplianceTaskType" AS ENUM ('UPLOAD_DOCUMENT', 'VERIFY_DOCUMENT', 'COMPLETE_PRODUCT_INFO', 'REVIEW_STANDARD', 'REVIEW_CERTIFICATION', 'COMPLETE_TEST', 'SELECT_LAB', 'VERIFY_TEST_REPORT', 'COMPLETE_APPLICATION', 'REVIEW_QCO', 'REVIEW_GAZETTE', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplianceTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'SKIPPED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AutomationRunType" AS ENUM ('INITIALIZE', 'RECALCULATE', 'DOCUMENT_UPDATE', 'TESTING_UPDATE', 'CERTIFICATION_UPDATE', 'QCO_UPDATE', 'GAZETTE_UPDATE', 'MANUAL_REFRESH');

-- CreateEnum
CREATE TYPE "ApplicationDossierStatus" AS ENUM ('DRAFT', 'INCOMPLETE', 'READY_FOR_REVIEW', 'READY_FOR_OFFICIAL_ACTION', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DossierItemStatus" AS ENUM ('MISSING', 'PRESENT', 'NEEDS_REVIEW', 'VERIFIED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "RegulatoryChangeType" AS ENUM ('QCO_NEW', 'QCO_UPDATED', 'QCO_REPLACED', 'QCO_REVOKED', 'STANDARD_AMENDED', 'STANDARD_REVISED', 'GAZETTE_UPDATED', 'OTHER');

-- CreateEnum
CREATE TYPE "RegulatoryImpactLevel" AS ENUM ('NO_IMPACT', 'LOW', 'MEDIUM', 'HIGH', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "ComplianceAlertType" AS ENUM ('DOCUMENT_EXPIRING', 'DOCUMENT_MISSING', 'TEST_MISSING', 'REVIEW_REQUIRED', 'QCO_CHANGE', 'STANDARD_AMENDMENT', 'JOURNEY_BLOCKED', 'DOSSIER_INCOMPLETE', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "organizationName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "manufacturerType" TEXT,
    "intendedUse" TEXT,
    "targetMarket" TEXT,
    "countryOfManufacture" TEXT,
    "manufacturerName" TEXT,
    "manufacturerAddress" TEXT,
    "manufacturingCountry" TEXT,
    "manufacturingState" TEXT,
    "hsnCode" TEXT,
    "productCategory" TEXT,
    "technicalSpecifications" JSONB,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "workflowStage" "ComplianceWorkflowStage" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActivityAt" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_answers" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_documents" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "uploadedByUserId" UUID NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "storedFileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileHash" TEXT,
    "documentType" "DocumentType" NOT NULL DEFAULT 'UNKNOWN',
    "classificationConfidence" DOUBLE PRECISION,
    "classificationReasons" JSONB,
    "processingStatus" "DocumentProcessingStatus" NOT NULL DEFAULT 'UPLOADED',
    "extractionStatus" TEXT DEFAULT 'PENDING',
    "verificationStatus" "DocumentVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "pageCount" INTEGER NOT NULL DEFAULT 1,
    "extractedText" TEXT,
    "extractionMetadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "documentFamily" TEXT,
    "supersedesDocumentId" UUID,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "verifiedByUserId" UUID,
    "verifiedAt" TIMESTAMP(3),
    "verificationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "product_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_page_evidence" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "pageNumber" INTEGER NOT NULL DEFAULT 1,
    "claim" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "boundingBox" JSONB,
    "sectionKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_page_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_structured_extractions" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "extractedType" "DocumentType" NOT NULL DEFAULT 'UNKNOWN',
    "laboratoryName" TEXT,
    "reportNumber" TEXT,
    "reportDate" TIMESTAMP(3),
    "certificateNumber" TEXT,
    "calibrationDate" TIMESTAMP(3),
    "calibrationDueDate" TIMESTAMP(3),
    "calibrationInterval" TEXT,
    "traceability" TEXT,
    "productName" TEXT,
    "modelNumber" TEXT,
    "manufacturerName" TEXT,
    "standardNumber" TEXT,
    "passFailStatus" TEXT,
    "validityStatus" TEXT,
    "extractedFields" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_structured_extractions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_checklist_matches" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "checklistItemId" UUID,
    "checklistCategory" TEXT,
    "requirementTitle" TEXT,
    "matchStatus" "ChecklistMatchStatus" NOT NULL DEFAULT 'MATCHED',
    "confidence" DOUBLE PRECISION,
    "matchReason" TEXT,
    "evidencePage" INTEGER,
    "evidenceSnippet" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_checklist_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_test_matches" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "testRequirementId" UUID,
    "testName" TEXT NOT NULL,
    "testMethod" TEXT,
    "standardNumber" TEXT,
    "parameter" TEXT,
    "extractedResult" TEXT,
    "passFailStatus" TEXT,
    "matchStatus" "TestRequirementMatchStatus" NOT NULL DEFAULT 'MATCHED',
    "evidencePage" INTEGER,
    "evidenceSnippet" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_test_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_document_completeness_analyses" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "status" "DocumentCompletenessStatus" NOT NULL DEFAULT 'INSUFFICIENT_EVIDENCE',
    "totalRequired" INTEGER NOT NULL DEFAULT 0,
    "verifiedCount" INTEGER NOT NULL DEFAULT 0,
    "matchedCount" INTEGER NOT NULL DEFAULT 0,
    "needsReviewCount" INTEGER NOT NULL DEFAULT 0,
    "missingCount" INTEGER NOT NULL DEFAULT 0,
    "expiredCount" INTEGER NOT NULL DEFAULT 0,
    "missingDocumentTypes" JSONB NOT NULL DEFAULT '[]',
    "blockers" JSONB NOT NULL DEFAULT '[]',
    "nextSteps" JSONB NOT NULL DEFAULT '[]',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_document_completeness_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_documents" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL DEFAULT 'BIS_OFFICIAL',
    "authorityLevel" "AuthorityLevel" NOT NULL DEFAULT 'AUTHORITATIVE',
    "documentType" TEXT,
    "publishedAt" TIMESTAMP(3),
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentHash" TEXT,
    "versionLabel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standards" (
    "id" UUID NOT NULL,
    "isNumber" TEXT NOT NULL,
    "canonicalNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortTitle" TEXT,
    "scope" TEXT,
    "status" "StandardStatus" NOT NULL DEFAULT 'CURRENT',
    "sector" TEXT,
    "department" TEXT,
    "language" TEXT NOT NULL DEFAULT 'English',
    "currentEdition" TEXT,
    "publicationDate" TIMESTAMP(3),
    "withdrawalDate" TIMESTAMP(3),
    "sourceDocumentId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "standards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standard_versions" (
    "id" UUID NOT NULL,
    "standardId" UUID NOT NULL,
    "edition" TEXT NOT NULL,
    "year" INTEGER,
    "publicationDate" TIMESTAMP(3),
    "status" "StandardStatus" NOT NULL DEFAULT 'CURRENT',
    "documentUrl" TEXT,
    "sourceDocumentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "standard_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standard_amendments" (
    "id" UUID NOT NULL,
    "standardId" UUID NOT NULL,
    "amendmentNumber" TEXT NOT NULL,
    "title" TEXT,
    "publicationDate" TIMESTAMP(3),
    "effectiveDate" TIMESTAMP(3),
    "documentUrl" TEXT,
    "sourceDocumentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "standard_amendments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qcos" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "ministry" TEXT,
    "notificationDate" TIMESTAMP(3),
    "effectiveDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'IN_FORCE',
    "documentUrl" TEXT,
    "sourceDocumentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qcos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qco_standard_mappings" (
    "id" UUID NOT NULL,
    "qcoId" UUID NOT NULL,
    "standardId" UUID NOT NULL,
    "productDescription" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qco_standard_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schemes" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "sourceDocumentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standard_scheme_mappings" (
    "id" UUID NOT NULL,
    "standardId" UUID NOT NULL,
    "schemeId" UUID NOT NULL,
    "sourceDocumentId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "standard_scheme_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_manuals" (
    "id" UUID NOT NULL,
    "standardId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "documentUrl" TEXT,
    "version" TEXT,
    "publicationDate" TIMESTAMP(3),
    "sourceDocumentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_manuals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_chunks" (
    "id" UUID NOT NULL,
    "sourceDocumentId" UUID,
    "standardId" UUID,
    "standardVersionId" UUID,
    "standardAmendmentId" UUID,
    "qcoId" UUID,
    "schemeId" UUID,
    "productManualId" UUID,
    "chunkType" TEXT NOT NULL,
    "sectionTitle" TEXT,
    "content" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL DEFAULT 0,
    "embedding" DOUBLE PRECISION[],
    "embeddingModel" TEXT,
    "embeddingDimension" INTEGER,
    "embeddingVersion" TEXT,
    "contentHash" TEXT,
    "embeddingStatus" "IngestionStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingestion_runs" (
    "id" UUID NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "IngestionStatus" NOT NULL DEFAULT 'PENDING',
    "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
    "recordsCreated" INTEGER NOT NULL DEFAULT 0,
    "recordsUpdated" INTEGER NOT NULL DEFAULT 0,
    "recordsSkipped" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "errorSummary" TEXT,
    "triggeredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingestion_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certification_schemes" (
    "id" UUID NOT NULL,
    "standardId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "schemeCode" TEXT,
    "description" TEXT,
    "bisUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certification_schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laboratories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "organizationType" "LabOrganizationType" NOT NULL DEFAULT 'BIS_RECOGNIZED',
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "pincode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "isNabl" BOOLEAN NOT NULL DEFAULT false,
    "isBisLab" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "sourceDocumentId" UUID,
    "sourceUrl" TEXT,
    "authorityLevel" "AuthorityLevel" NOT NULL DEFAULT 'AUTHORITATIVE',
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laboratories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citations" (
    "id" UUID NOT NULL,
    "standardId" UUID,
    "sourceUrl" TEXT NOT NULL,
    "sourceTitle" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "publicationDate" TIMESTAMP(3),
    "revisionDate" TIMESTAMP(3),
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "relevantSection" TEXT,
    "relevantClause" TEXT,
    "excerpt" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "citations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" UUID NOT NULL,
    "productId" UUID,
    "userId" UUID NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "role" "AiMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "productId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_attributes" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "attributeKey" TEXT NOT NULL,
    "attributeValue" TEXT NOT NULL,
    "normalizedValue" TEXT NOT NULL,
    "source" "AttributeSource" NOT NULL DEFAULT 'USER',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_standard_analyses" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "analysisVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "inputHash" TEXT NOT NULL,
    "errorSummary" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_standard_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_standard_matches" (
    "id" UUID NOT NULL,
    "analysisId" UUID NOT NULL,
    "standardId" UUID NOT NULL,
    "relevanceScore" DOUBLE PRECISION NOT NULL,
    "matchLevel" "MatchLevel" NOT NULL DEFAULT 'POTENTIALLY_RELEVANT',
    "reasons" JSONB NOT NULL,
    "evidence" JSONB,
    "rank" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_standard_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_standard_reviews" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "standardId" UUID NOT NULL,
    "decision" "ReviewDecision" NOT NULL DEFAULT 'NEEDS_REVIEW',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_standard_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_certification_analyses" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "productStandardAnalysisId" UUID,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "analysisVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "inputHash" TEXT NOT NULL,
    "readinessStatus" "CertificationReadinessStatus" NOT NULL DEFAULT 'NEEDS_USER_REVIEW',
    "readinessScore" INTEGER NOT NULL DEFAULT 50,
    "readinessSummary" TEXT,
    "errorSummary" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_certification_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_scheme_recommendations" (
    "id" UUID NOT NULL,
    "analysisId" UUID NOT NULL,
    "schemeId" UUID NOT NULL,
    "standardId" UUID NOT NULL,
    "relevanceLevel" "SchemeRelevanceLevel" NOT NULL DEFAULT 'POTENTIALLY_RELEVANT',
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "reasons" JSONB NOT NULL,
    "evidence" JSONB,
    "rank" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_scheme_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_scheme_reviews" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "schemeId" UUID NOT NULL,
    "decision" "ReviewDecision" NOT NULL DEFAULT 'NEEDS_REVIEW',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_scheme_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certification_fee_estimates" (
    "id" UUID NOT NULL,
    "analysisId" UUID NOT NULL,
    "schemeId" UUID,
    "feeType" "FeeType" NOT NULL DEFAULT 'OTHER',
    "amount" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "FeeStatus" NOT NULL DEFAULT 'NOT_AVAILABLE',
    "source" TEXT,
    "effectiveDate" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certification_fee_estimates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_documentation_checklist_items" (
    "id" UUID NOT NULL,
    "analysisId" UUID NOT NULL,
    "schemeId" UUID,
    "category" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "requiredStatus" "DocumentRequiredStatus" NOT NULL DEFAULT 'CONDITIONALLY_REQUIRED',
    "reason" TEXT NOT NULL,
    "source" TEXT,
    "notes" TEXT,
    "rank" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_documentation_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_application_requirement_items" (
    "id" UUID NOT NULL,
    "analysisId" UUID NOT NULL,
    "schemeId" UUID,
    "formName" TEXT NOT NULL,
    "formPurpose" TEXT NOT NULL,
    "applicableScheme" TEXT NOT NULL,
    "source" TEXT,
    "officialUrl" TEXT,
    "rank" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_application_requirement_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_qco_information_items" (
    "id" UUID NOT NULL,
    "analysisId" UUID NOT NULL,
    "qcoId" UUID NOT NULL,
    "standardId" UUID NOT NULL,
    "qcoTitle" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "issuingAuthority" TEXT,
    "notificationDate" TIMESTAMP(3),
    "effectiveDate" TIMESTAMP(3),
    "sourceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_FORCE',
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_qco_information_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_testing_analyses" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "certificationAnalysisId" UUID,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "analysisVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "inputHash" TEXT NOT NULL,
    "readinessStatus" "TestingReadinessStatus" NOT NULL DEFAULT 'NEEDS_REVIEW',
    "readinessScore" INTEGER NOT NULL DEFAULT 50,
    "readinessSummary" TEXT,
    "blockers" JSONB,
    "nextSteps" JSONB,
    "errorSummary" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_testing_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_test_requirements" (
    "id" UUID NOT NULL,
    "analysisId" UUID NOT NULL,
    "standardId" UUID NOT NULL,
    "schemeId" UUID,
    "testName" TEXT NOT NULL,
    "testCategory" "TestCategory" NOT NULL DEFAULT 'UNKNOWN',
    "testMethod" TEXT,
    "clause" TEXT,
    "parameter" TEXT,
    "requirementValue" TEXT,
    "unit" TEXT,
    "applicability" "TestApplicability" NOT NULL DEFAULT 'UNKNOWN',
    "sourceDocumentId" UUID,
    "sourceUrl" TEXT,
    "evidence" JSONB,
    "status" "TestRequirementStatus" NOT NULL DEFAULT 'REQUIRED',
    "rank" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_test_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_test_equipments" (
    "id" UUID NOT NULL,
    "analysisId" UUID NOT NULL,
    "equipmentName" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "requiredStatus" "EquipmentRequiredStatus" NOT NULL DEFAULT 'REQUIRED',
    "calibrationRequired" BOOLEAN NOT NULL DEFAULT true,
    "calibrationInterval" TEXT,
    "source" TEXT,
    "notes" TEXT,
    "rank" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_test_equipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_calibration_requirements" (
    "id" UUID NOT NULL,
    "analysisId" UUID NOT NULL,
    "equipmentName" TEXT NOT NULL,
    "parameterMeasured" TEXT NOT NULL,
    "traceabilityStandard" TEXT,
    "calibrationInterval" TEXT,
    "calibrationAgencyType" TEXT NOT NULL DEFAULT 'NABL_ACCREDITED_CAL_LAB',
    "source" TEXT,
    "notes" TEXT,
    "rank" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_calibration_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_external_lab_requirements" (
    "id" UUID NOT NULL,
    "analysisId" UUID NOT NULL,
    "schemeId" UUID,
    "requirementType" "ExternalLabRequirementType" NOT NULL DEFAULT 'EXTERNAL_LAB_REQUIRED',
    "reason" TEXT NOT NULL,
    "sampleSize" TEXT,
    "testingDuration" TEXT,
    "source" TEXT,
    "notes" TEXT,
    "rank" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_external_lab_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laboratory_capabilities" (
    "id" UUID NOT NULL,
    "laboratoryId" UUID NOT NULL,
    "standardId" UUID,
    "testName" TEXT,
    "testMethod" TEXT,
    "scopeDescription" TEXT,
    "accreditationStatus" "LabAccreditationStatus" NOT NULL DEFAULT 'UNKNOWN',
    "recognitionStatus" "LabRecognitionStatus" NOT NULL DEFAULT 'UNKNOWN',
    "sourceDocumentId" UUID,
    "sourceUrl" TEXT,
    "authorityLevel" "AuthorityLevel" NOT NULL DEFAULT 'AUTHORITATIVE',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laboratory_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_laboratory_reviews" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "laboratoryId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "decision" "LabDecision" NOT NULL DEFAULT 'SHORTLISTED',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_laboratory_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_journeys" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "status" "ComplianceJourneyStatus" NOT NULL DEFAULT 'DRAFT',
    "journeyVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "inputHash" TEXT NOT NULL,
    "readinessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "readinessStatus" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "currentStage" "ComplianceWorkflowStage" NOT NULL DEFAULT 'DRAFT',
    "summary" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_journeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_requirements" (
    "id" UUID NOT NULL,
    "journeyId" UUID NOT NULL,
    "standardId" UUID,
    "requirementType" "ComplianceRequirementType" NOT NULL DEFAULT 'STANDARD',
    "sourceEntityType" TEXT NOT NULL DEFAULT 'Standard',
    "sourceEntityId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "mandatoryStatus" "MandatoryStatus" NOT NULL DEFAULT 'MANDATORY',
    "priority" "RequirementPriority" NOT NULL DEFAULT 'HIGH',
    "status" "ComplianceRequirementStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "evidenceRequired" BOOLEAN NOT NULL DEFAULT true,
    "sourceDocumentId" UUID,
    "sourceUrl" TEXT,
    "sourceAuthority" "AuthorityLevel" NOT NULL DEFAULT 'AUTHORITATIVE',
    "evidence" JSONB,
    "waivedReason" TEXT,
    "waivedByUserId" UUID,
    "waivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_requirement_dependencies" (
    "id" UUID NOT NULL,
    "requirementId" UUID NOT NULL,
    "prerequisiteRequirementId" UUID NOT NULL,
    "dependencyType" TEXT NOT NULL DEFAULT 'BLOCKS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_requirement_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_tasks" (
    "id" UUID NOT NULL,
    "journeyId" UUID NOT NULL,
    "requirementId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "taskType" "ComplianceTaskType" NOT NULL DEFAULT 'OTHER',
    "status" "ComplianceTaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "RequirementPriority" NOT NULL DEFAULT 'HIGH',
    "assignedToUserId" UUID,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "blockerReason" TEXT,
    "sourceEvidence" JSONB,
    "taskOrder" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_automation_runs" (
    "id" UUID NOT NULL,
    "journeyId" UUID NOT NULL,
    "runType" "AutomationRunType" NOT NULL DEFAULT 'INITIALIZE',
    "inputHash" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "changesDetected" JSONB,
    "executionTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "compliance_automation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_dossiers" (
    "id" UUID NOT NULL,
    "journeyId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "ApplicationDossierStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "completenessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "missingCount" INTEGER NOT NULL DEFAULT 0,
    "unverifiedCount" INTEGER NOT NULL DEFAULT 0,
    "verifiedCount" INTEGER NOT NULL DEFAULT 0,
    "validatedAt" TIMESTAMP(3),
    "exportedAt" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_dossiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_dossier_items" (
    "id" UUID NOT NULL,
    "dossierId" UUID NOT NULL,
    "requirementId" UUID,
    "itemType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'DOCUMENT',
    "sourceEntityId" TEXT,
    "documentId" UUID,
    "verificationStatus" "DocumentVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "status" "DossierItemStatus" NOT NULL DEFAULT 'MISSING',
    "evidence" JSONB,
    "itemOrder" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_dossier_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulatory_change_events" (
    "id" UUID NOT NULL,
    "sourceDocumentId" UUID,
    "changeType" "RegulatoryChangeType" NOT NULL DEFAULT 'OTHER',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "affectedStandards" JSONB DEFAULT '[]',
    "affectedProductCategories" JSONB DEFAULT '[]',
    "effectiveDate" TIMESTAMP(3),
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceUrl" TEXT,
    "authorityLevel" "AuthorityLevel" NOT NULL DEFAULT 'AUTHORITATIVE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regulatory_change_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulatory_impacts" (
    "id" UUID NOT NULL,
    "changeEventId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "journeyId" UUID,
    "impactLevel" "RegulatoryImpactLevel" NOT NULL DEFAULT 'NEEDS_REVIEW',
    "affectedRequirements" JSONB DEFAULT '[]',
    "requiredActions" JSONB DEFAULT '[]',
    "evidence" JSONB DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regulatory_impacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_alerts" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "journeyId" UUID,
    "alertType" "ComplianceAlertType" NOT NULL DEFAULT 'OTHER',
    "priority" "RequirementPriority" NOT NULL DEFAULT 'HIGH',
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "source" TEXT,
    "recommendedAction" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hallmarking_centres" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "sourceDocumentId" UUID,
    "sourceUrl" TEXT,
    "authorityLevel" "AuthorityLevel" NOT NULL DEFAULT 'AUTHORITATIVE',
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "lastVerifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hallmarking_centres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hallmark_verifications" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "huid" TEXT NOT NULL,
    "enteredDetails" JSONB DEFAULT '{}',
    "verificationStatus" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "articleType" TEXT,
    "purityPpm" INTEGER,
    "purityKarat" TEXT,
    "hallmarkingCentreName" TEXT,
    "hallmarkingCentreCode" TEXT,
    "hallmarkingDate" TIMESTAMP(3),
    "jewellerName" TEXT,
    "jewellerRegistrationNumber" TEXT,
    "sourceDocumentId" UUID,
    "sourceUrl" TEXT,
    "sourceAuthority" TEXT DEFAULT 'Bureau of Indian Standards (BIS)',
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evidence" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hallmark_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumer_services" (
    "id" UUID NOT NULL,
    "serviceType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eligibility" TEXT,
    "requiredInformation" JSONB DEFAULT '[]',
    "officialUrl" TEXT,
    "sourceDocumentId" UUID,
    "sourceAuthority" TEXT NOT NULL DEFAULT 'Bureau of Indian Standards (BIS)',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastVerifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consumer_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumer_verifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "verificationType" TEXT NOT NULL,
    "query" JSONB NOT NULL,
    "resultStatus" TEXT NOT NULL,
    "source" TEXT,
    "evidence" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consumer_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "theme" TEXT DEFAULT 'system',
    "reducedMotion" BOOLEAN NOT NULL DEFAULT false,
    "highContrast" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translation_cache" (
    "id" UUID NOT NULL,
    "sourceLanguage" TEXT NOT NULL DEFAULT 'en',
    "targetLanguage" TEXT NOT NULL,
    "sourceTextHash" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "translatedText" TEXT NOT NULL,
    "preservedTerms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourceReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translation_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "products_userId_idx" ON "products"("userId");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE INDEX "products_createdAt_idx" ON "products"("createdAt");

-- CreateIndex
CREATE INDEX "product_answers_productId_idx" ON "product_answers"("productId");

-- CreateIndex
CREATE INDEX "product_documents_productId_idx" ON "product_documents"("productId");

-- CreateIndex
CREATE INDEX "product_documents_uploadedByUserId_idx" ON "product_documents"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "product_documents_documentType_idx" ON "product_documents"("documentType");

-- CreateIndex
CREATE INDEX "product_documents_processingStatus_idx" ON "product_documents"("processingStatus");

-- CreateIndex
CREATE INDEX "product_documents_verificationStatus_idx" ON "product_documents"("verificationStatus");

-- CreateIndex
CREATE INDEX "product_documents_fileHash_idx" ON "product_documents"("fileHash");

-- CreateIndex
CREATE INDEX "product_documents_documentFamily_idx" ON "product_documents"("documentFamily");

-- CreateIndex
CREATE INDEX "document_page_evidence_documentId_idx" ON "document_page_evidence"("documentId");

-- CreateIndex
CREATE INDEX "document_page_evidence_pageNumber_idx" ON "document_page_evidence"("pageNumber");

-- CreateIndex
CREATE UNIQUE INDEX "document_structured_extractions_documentId_key" ON "document_structured_extractions"("documentId");

-- CreateIndex
CREATE INDEX "document_structured_extractions_documentId_idx" ON "document_structured_extractions"("documentId");

-- CreateIndex
CREATE INDEX "document_checklist_matches_documentId_idx" ON "document_checklist_matches"("documentId");

-- CreateIndex
CREATE INDEX "document_checklist_matches_checklistItemId_idx" ON "document_checklist_matches"("checklistItemId");

-- CreateIndex
CREATE INDEX "document_test_matches_documentId_idx" ON "document_test_matches"("documentId");

-- CreateIndex
CREATE INDEX "document_test_matches_testRequirementId_idx" ON "document_test_matches"("testRequirementId");

-- CreateIndex
CREATE INDEX "product_document_completeness_analyses_productId_idx" ON "product_document_completeness_analyses"("productId");

-- CreateIndex
CREATE INDEX "source_documents_url_idx" ON "source_documents"("url");

-- CreateIndex
CREATE INDEX "source_documents_sourceType_idx" ON "source_documents"("sourceType");

-- CreateIndex
CREATE INDEX "source_documents_authorityLevel_idx" ON "source_documents"("authorityLevel");

-- CreateIndex
CREATE UNIQUE INDEX "standards_isNumber_key" ON "standards"("isNumber");

-- CreateIndex
CREATE INDEX "standards_isNumber_idx" ON "standards"("isNumber");

-- CreateIndex
CREATE INDEX "standards_canonicalNumber_idx" ON "standards"("canonicalNumber");

-- CreateIndex
CREATE INDEX "standards_status_idx" ON "standards"("status");

-- CreateIndex
CREATE INDEX "standards_sector_idx" ON "standards"("sector");

-- CreateIndex
CREATE INDEX "standards_department_idx" ON "standards"("department");

-- CreateIndex
CREATE INDEX "standard_versions_standardId_idx" ON "standard_versions"("standardId");

-- CreateIndex
CREATE INDEX "standard_amendments_standardId_idx" ON "standard_amendments"("standardId");

-- CreateIndex
CREATE UNIQUE INDEX "qcos_orderNumber_key" ON "qcos"("orderNumber");

-- CreateIndex
CREATE INDEX "qcos_orderNumber_idx" ON "qcos"("orderNumber");

-- CreateIndex
CREATE INDEX "qcos_effectiveDate_idx" ON "qcos"("effectiveDate");

-- CreateIndex
CREATE INDEX "qcos_status_idx" ON "qcos"("status");

-- CreateIndex
CREATE INDEX "qco_standard_mappings_qcoId_idx" ON "qco_standard_mappings"("qcoId");

-- CreateIndex
CREATE INDEX "qco_standard_mappings_standardId_idx" ON "qco_standard_mappings"("standardId");

-- CreateIndex
CREATE UNIQUE INDEX "qco_standard_mappings_qcoId_standardId_key" ON "qco_standard_mappings"("qcoId", "standardId");

-- CreateIndex
CREATE UNIQUE INDEX "schemes_code_key" ON "schemes"("code");

-- CreateIndex
CREATE INDEX "schemes_code_idx" ON "schemes"("code");

-- CreateIndex
CREATE INDEX "standard_scheme_mappings_standardId_idx" ON "standard_scheme_mappings"("standardId");

-- CreateIndex
CREATE INDEX "standard_scheme_mappings_schemeId_idx" ON "standard_scheme_mappings"("schemeId");

-- CreateIndex
CREATE UNIQUE INDEX "standard_scheme_mappings_standardId_schemeId_key" ON "standard_scheme_mappings"("standardId", "schemeId");

-- CreateIndex
CREATE INDEX "product_manuals_standardId_idx" ON "product_manuals"("standardId");

-- CreateIndex
CREATE INDEX "knowledge_chunks_standardId_idx" ON "knowledge_chunks"("standardId");

-- CreateIndex
CREATE INDEX "knowledge_chunks_chunkType_idx" ON "knowledge_chunks"("chunkType");

-- CreateIndex
CREATE INDEX "knowledge_chunks_embeddingStatus_idx" ON "knowledge_chunks"("embeddingStatus");

-- CreateIndex
CREATE INDEX "knowledge_chunks_contentHash_idx" ON "knowledge_chunks"("contentHash");

-- CreateIndex
CREATE INDEX "ingestion_runs_status_idx" ON "ingestion_runs"("status");

-- CreateIndex
CREATE INDEX "ingestion_runs_startedAt_idx" ON "ingestion_runs"("startedAt");

-- CreateIndex
CREATE INDEX "certification_schemes_standardId_idx" ON "certification_schemes"("standardId");

-- CreateIndex
CREATE INDEX "laboratories_city_idx" ON "laboratories"("city");

-- CreateIndex
CREATE INDEX "laboratories_state_idx" ON "laboratories"("state");

-- CreateIndex
CREATE INDEX "laboratories_status_idx" ON "laboratories"("status");

-- CreateIndex
CREATE INDEX "laboratories_organizationType_idx" ON "laboratories"("organizationType");

-- CreateIndex
CREATE INDEX "citations_standardId_idx" ON "citations"("standardId");

-- CreateIndex
CREATE INDEX "ai_conversations_productId_idx" ON "ai_conversations"("productId");

-- CreateIndex
CREATE INDEX "ai_conversations_userId_idx" ON "ai_conversations"("userId");

-- CreateIndex
CREATE INDEX "ai_messages_conversationId_idx" ON "ai_messages"("conversationId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_productId_idx" ON "audit_logs"("productId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "product_attributes_productId_idx" ON "product_attributes"("productId");

-- CreateIndex
CREATE INDEX "product_attributes_attributeKey_idx" ON "product_attributes"("attributeKey");

-- CreateIndex
CREATE UNIQUE INDEX "product_attributes_productId_attributeKey_key" ON "product_attributes"("productId", "attributeKey");

-- CreateIndex
CREATE INDEX "product_standard_analyses_productId_idx" ON "product_standard_analyses"("productId");

-- CreateIndex
CREATE INDEX "product_standard_analyses_status_idx" ON "product_standard_analyses"("status");

-- CreateIndex
CREATE INDEX "product_standard_analyses_inputHash_idx" ON "product_standard_analyses"("inputHash");

-- CreateIndex
CREATE INDEX "product_standard_matches_analysisId_idx" ON "product_standard_matches"("analysisId");

-- CreateIndex
CREATE INDEX "product_standard_matches_standardId_idx" ON "product_standard_matches"("standardId");

-- CreateIndex
CREATE INDEX "product_standard_matches_matchLevel_idx" ON "product_standard_matches"("matchLevel");

-- CreateIndex
CREATE INDEX "product_standard_reviews_productId_idx" ON "product_standard_reviews"("productId");

-- CreateIndex
CREATE INDEX "product_standard_reviews_standardId_idx" ON "product_standard_reviews"("standardId");

-- CreateIndex
CREATE UNIQUE INDEX "product_standard_reviews_productId_standardId_key" ON "product_standard_reviews"("productId", "standardId");

-- CreateIndex
CREATE INDEX "product_certification_analyses_productId_idx" ON "product_certification_analyses"("productId");

-- CreateIndex
CREATE INDEX "product_certification_analyses_status_idx" ON "product_certification_analyses"("status");

-- CreateIndex
CREATE INDEX "product_certification_analyses_inputHash_idx" ON "product_certification_analyses"("inputHash");

-- CreateIndex
CREATE INDEX "product_scheme_recommendations_analysisId_idx" ON "product_scheme_recommendations"("analysisId");

-- CreateIndex
CREATE INDEX "product_scheme_recommendations_schemeId_idx" ON "product_scheme_recommendations"("schemeId");

-- CreateIndex
CREATE INDEX "product_scheme_recommendations_standardId_idx" ON "product_scheme_recommendations"("standardId");

-- CreateIndex
CREATE INDEX "product_scheme_recommendations_relevanceLevel_idx" ON "product_scheme_recommendations"("relevanceLevel");

-- CreateIndex
CREATE INDEX "product_scheme_reviews_productId_idx" ON "product_scheme_reviews"("productId");

-- CreateIndex
CREATE INDEX "product_scheme_reviews_schemeId_idx" ON "product_scheme_reviews"("schemeId");

-- CreateIndex
CREATE UNIQUE INDEX "product_scheme_reviews_productId_schemeId_key" ON "product_scheme_reviews"("productId", "schemeId");

-- CreateIndex
CREATE INDEX "certification_fee_estimates_analysisId_idx" ON "certification_fee_estimates"("analysisId");

-- CreateIndex
CREATE INDEX "certification_fee_estimates_schemeId_idx" ON "certification_fee_estimates"("schemeId");

-- CreateIndex
CREATE INDEX "certification_fee_estimates_feeType_idx" ON "certification_fee_estimates"("feeType");

-- CreateIndex
CREATE INDEX "product_documentation_checklist_items_analysisId_idx" ON "product_documentation_checklist_items"("analysisId");

-- CreateIndex
CREATE INDEX "product_documentation_checklist_items_schemeId_idx" ON "product_documentation_checklist_items"("schemeId");

-- CreateIndex
CREATE INDEX "product_application_requirement_items_analysisId_idx" ON "product_application_requirement_items"("analysisId");

-- CreateIndex
CREATE INDEX "product_application_requirement_items_schemeId_idx" ON "product_application_requirement_items"("schemeId");

-- CreateIndex
CREATE INDEX "product_qco_information_items_analysisId_idx" ON "product_qco_information_items"("analysisId");

-- CreateIndex
CREATE INDEX "product_qco_information_items_qcoId_idx" ON "product_qco_information_items"("qcoId");

-- CreateIndex
CREATE INDEX "product_qco_information_items_standardId_idx" ON "product_qco_information_items"("standardId");

-- CreateIndex
CREATE INDEX "product_testing_analyses_productId_idx" ON "product_testing_analyses"("productId");

-- CreateIndex
CREATE INDEX "product_testing_analyses_status_idx" ON "product_testing_analyses"("status");

-- CreateIndex
CREATE INDEX "product_testing_analyses_inputHash_idx" ON "product_testing_analyses"("inputHash");

-- CreateIndex
CREATE INDEX "product_test_requirements_analysisId_idx" ON "product_test_requirements"("analysisId");

-- CreateIndex
CREATE INDEX "product_test_requirements_standardId_idx" ON "product_test_requirements"("standardId");

-- CreateIndex
CREATE INDEX "product_test_requirements_schemeId_idx" ON "product_test_requirements"("schemeId");

-- CreateIndex
CREATE INDEX "product_test_requirements_testCategory_idx" ON "product_test_requirements"("testCategory");

-- CreateIndex
CREATE INDEX "product_test_equipments_analysisId_idx" ON "product_test_equipments"("analysisId");

-- CreateIndex
CREATE INDEX "product_calibration_requirements_analysisId_idx" ON "product_calibration_requirements"("analysisId");

-- CreateIndex
CREATE INDEX "product_external_lab_requirements_analysisId_idx" ON "product_external_lab_requirements"("analysisId");

-- CreateIndex
CREATE INDEX "product_external_lab_requirements_schemeId_idx" ON "product_external_lab_requirements"("schemeId");

-- CreateIndex
CREATE INDEX "laboratory_capabilities_laboratoryId_idx" ON "laboratory_capabilities"("laboratoryId");

-- CreateIndex
CREATE INDEX "laboratory_capabilities_standardId_idx" ON "laboratory_capabilities"("standardId");

-- CreateIndex
CREATE INDEX "laboratory_capabilities_accreditationStatus_idx" ON "laboratory_capabilities"("accreditationStatus");

-- CreateIndex
CREATE INDEX "laboratory_capabilities_recognitionStatus_idx" ON "laboratory_capabilities"("recognitionStatus");

-- CreateIndex
CREATE INDEX "product_laboratory_reviews_productId_idx" ON "product_laboratory_reviews"("productId");

-- CreateIndex
CREATE INDEX "product_laboratory_reviews_laboratoryId_idx" ON "product_laboratory_reviews"("laboratoryId");

-- CreateIndex
CREATE INDEX "product_laboratory_reviews_userId_idx" ON "product_laboratory_reviews"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "product_laboratory_reviews_productId_laboratoryId_key" ON "product_laboratory_reviews"("productId", "laboratoryId");

-- CreateIndex
CREATE INDEX "compliance_journeys_productId_idx" ON "compliance_journeys"("productId");

-- CreateIndex
CREATE INDEX "compliance_journeys_status_idx" ON "compliance_journeys"("status");

-- CreateIndex
CREATE INDEX "compliance_journeys_inputHash_idx" ON "compliance_journeys"("inputHash");

-- CreateIndex
CREATE INDEX "compliance_requirements_journeyId_idx" ON "compliance_requirements"("journeyId");

-- CreateIndex
CREATE INDEX "compliance_requirements_standardId_idx" ON "compliance_requirements"("standardId");

-- CreateIndex
CREATE INDEX "compliance_requirements_requirementType_idx" ON "compliance_requirements"("requirementType");

-- CreateIndex
CREATE INDEX "compliance_requirements_status_idx" ON "compliance_requirements"("status");

-- CreateIndex
CREATE INDEX "compliance_requirements_mandatoryStatus_idx" ON "compliance_requirements"("mandatoryStatus");

-- CreateIndex
CREATE INDEX "compliance_requirement_dependencies_requirementId_idx" ON "compliance_requirement_dependencies"("requirementId");

-- CreateIndex
CREATE INDEX "compliance_requirement_dependencies_prerequisiteRequirement_idx" ON "compliance_requirement_dependencies"("prerequisiteRequirementId");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_requirement_dependencies_requirementId_prerequis_key" ON "compliance_requirement_dependencies"("requirementId", "prerequisiteRequirementId");

-- CreateIndex
CREATE INDEX "compliance_tasks_journeyId_idx" ON "compliance_tasks"("journeyId");

-- CreateIndex
CREATE INDEX "compliance_tasks_requirementId_idx" ON "compliance_tasks"("requirementId");

-- CreateIndex
CREATE INDEX "compliance_tasks_status_idx" ON "compliance_tasks"("status");

-- CreateIndex
CREATE INDEX "compliance_tasks_taskType_idx" ON "compliance_tasks"("taskType");

-- CreateIndex
CREATE INDEX "compliance_tasks_assignedToUserId_idx" ON "compliance_tasks"("assignedToUserId");

-- CreateIndex
CREATE INDEX "compliance_automation_runs_journeyId_idx" ON "compliance_automation_runs"("journeyId");

-- CreateIndex
CREATE INDEX "compliance_automation_runs_inputHash_idx" ON "compliance_automation_runs"("inputHash");

-- CreateIndex
CREATE INDEX "application_dossiers_journeyId_idx" ON "application_dossiers"("journeyId");

-- CreateIndex
CREATE INDEX "application_dossiers_productId_idx" ON "application_dossiers"("productId");

-- CreateIndex
CREATE INDEX "application_dossiers_status_idx" ON "application_dossiers"("status");

-- CreateIndex
CREATE INDEX "application_dossier_items_dossierId_idx" ON "application_dossier_items"("dossierId");

-- CreateIndex
CREATE INDEX "application_dossier_items_requirementId_idx" ON "application_dossier_items"("requirementId");

-- CreateIndex
CREATE INDEX "application_dossier_items_documentId_idx" ON "application_dossier_items"("documentId");

-- CreateIndex
CREATE INDEX "application_dossier_items_status_idx" ON "application_dossier_items"("status");

-- CreateIndex
CREATE INDEX "regulatory_change_events_sourceDocumentId_idx" ON "regulatory_change_events"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "regulatory_change_events_changeType_idx" ON "regulatory_change_events"("changeType");

-- CreateIndex
CREATE INDEX "regulatory_change_events_status_idx" ON "regulatory_change_events"("status");

-- CreateIndex
CREATE INDEX "regulatory_impacts_changeEventId_idx" ON "regulatory_impacts"("changeEventId");

-- CreateIndex
CREATE INDEX "regulatory_impacts_productId_idx" ON "regulatory_impacts"("productId");

-- CreateIndex
CREATE INDEX "regulatory_impacts_journeyId_idx" ON "regulatory_impacts"("journeyId");

-- CreateIndex
CREATE INDEX "regulatory_impacts_impactLevel_idx" ON "regulatory_impacts"("impactLevel");

-- CreateIndex
CREATE UNIQUE INDEX "regulatory_impacts_changeEventId_productId_key" ON "regulatory_impacts"("changeEventId", "productId");

-- CreateIndex
CREATE INDEX "compliance_alerts_productId_idx" ON "compliance_alerts"("productId");

-- CreateIndex
CREATE INDEX "compliance_alerts_journeyId_idx" ON "compliance_alerts"("journeyId");

-- CreateIndex
CREATE INDEX "compliance_alerts_alertType_idx" ON "compliance_alerts"("alertType");

-- CreateIndex
CREATE INDEX "compliance_alerts_priority_idx" ON "compliance_alerts"("priority");

-- CreateIndex
CREATE INDEX "compliance_alerts_isRead_idx" ON "compliance_alerts"("isRead");

-- CreateIndex
CREATE INDEX "compliance_alerts_isResolved_idx" ON "compliance_alerts"("isResolved");

-- CreateIndex
CREATE UNIQUE INDEX "hallmarking_centres_code_key" ON "hallmarking_centres"("code");

-- CreateIndex
CREATE INDEX "hallmarking_centres_state_idx" ON "hallmarking_centres"("state");

-- CreateIndex
CREATE INDEX "hallmarking_centres_city_idx" ON "hallmarking_centres"("city");

-- CreateIndex
CREATE INDEX "hallmarking_centres_pincode_idx" ON "hallmarking_centres"("pincode");

-- CreateIndex
CREATE INDEX "hallmarking_centres_code_idx" ON "hallmarking_centres"("code");

-- CreateIndex
CREATE INDEX "hallmarking_centres_status_idx" ON "hallmarking_centres"("status");

-- CreateIndex
CREATE INDEX "hallmark_verifications_userId_idx" ON "hallmark_verifications"("userId");

-- CreateIndex
CREATE INDEX "hallmark_verifications_huid_idx" ON "hallmark_verifications"("huid");

-- CreateIndex
CREATE INDEX "hallmark_verifications_verificationStatus_idx" ON "hallmark_verifications"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "consumer_services_serviceType_key" ON "consumer_services"("serviceType");

-- CreateIndex
CREATE INDEX "consumer_services_serviceType_idx" ON "consumer_services"("serviceType");

-- CreateIndex
CREATE INDEX "consumer_verifications_userId_idx" ON "consumer_verifications"("userId");

-- CreateIndex
CREATE INDEX "consumer_verifications_verificationType_idx" ON "consumer_verifications"("verificationType");

-- CreateIndex
CREATE INDEX "consumer_verifications_resultStatus_idx" ON "consumer_verifications"("resultStatus");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE INDEX "translation_cache_sourceTextHash_idx" ON "translation_cache"("sourceTextHash");

-- CreateIndex
CREATE INDEX "translation_cache_targetLanguage_idx" ON "translation_cache"("targetLanguage");

-- CreateIndex
CREATE UNIQUE INDEX "translation_cache_sourceTextHash_targetLanguage_key" ON "translation_cache"("sourceTextHash", "targetLanguage");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_answers" ADD CONSTRAINT "product_answers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_documents" ADD CONSTRAINT "product_documents_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_documents" ADD CONSTRAINT "product_documents_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_documents" ADD CONSTRAINT "product_documents_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_documents" ADD CONSTRAINT "product_documents_supersedesDocumentId_fkey" FOREIGN KEY ("supersedesDocumentId") REFERENCES "product_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_page_evidence" ADD CONSTRAINT "document_page_evidence_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "product_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_structured_extractions" ADD CONSTRAINT "document_structured_extractions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "product_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_checklist_matches" ADD CONSTRAINT "document_checklist_matches_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "product_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_checklist_matches" ADD CONSTRAINT "document_checklist_matches_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "product_documentation_checklist_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_test_matches" ADD CONSTRAINT "document_test_matches_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "product_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_test_matches" ADD CONSTRAINT "document_test_matches_testRequirementId_fkey" FOREIGN KEY ("testRequirementId") REFERENCES "product_test_requirements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_document_completeness_analyses" ADD CONSTRAINT "product_document_completeness_analyses_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standards" ADD CONSTRAINT "standards_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "source_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standard_versions" ADD CONSTRAINT "standard_versions_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "standards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standard_versions" ADD CONSTRAINT "standard_versions_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "source_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standard_amendments" ADD CONSTRAINT "standard_amendments_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "standards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standard_amendments" ADD CONSTRAINT "standard_amendments_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "source_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qcos" ADD CONSTRAINT "qcos_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "source_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qco_standard_mappings" ADD CONSTRAINT "qco_standard_mappings_qcoId_fkey" FOREIGN KEY ("qcoId") REFERENCES "qcos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qco_standard_mappings" ADD CONSTRAINT "qco_standard_mappings_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "standards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schemes" ADD CONSTRAINT "schemes_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "source_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standard_scheme_mappings" ADD CONSTRAINT "standard_scheme_mappings_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "standards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standard_scheme_mappings" ADD CONSTRAINT "standard_scheme_mappings_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standard_scheme_mappings" ADD CONSTRAINT "standard_scheme_mappings_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "source_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_manuals" ADD CONSTRAINT "product_manuals_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "standards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_manuals" ADD CONSTRAINT "product_manuals_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "source_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "source_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "standards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_standardVersionId_fkey" FOREIGN KEY ("standardVersionId") REFERENCES "standard_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_standardAmendmentId_fkey" FOREIGN KEY ("standardAmendmentId") REFERENCES "standard_amendments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_qcoId_fkey" FOREIGN KEY ("qcoId") REFERENCES "qcos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_productManualId_fkey" FOREIGN KEY ("productManualId") REFERENCES "product_manuals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certification_schemes" ADD CONSTRAINT "certification_schemes_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "standards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laboratories" ADD CONSTRAINT "laboratories_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "source_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citations" ADD CONSTRAINT "citations_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "standards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_standard_analyses" ADD CONSTRAINT "product_standard_analyses_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_standard_matches" ADD CONSTRAINT "product_standard_matches_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "product_standard_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_standard_matches" ADD CONSTRAINT "product_standard_matches_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "standards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_standard_reviews" ADD CONSTRAINT "product_standard_reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_standard_reviews" ADD CONSTRAINT "product_standard_reviews_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "standards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_certification_analyses" ADD CONSTRAINT "product_certification_analyses_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_certification_analyses" ADD CONSTRAINT "product_certification_analyses_productStandardAnalysisId_fkey" FOREIGN KEY ("productStandardAnalysisId") REFERENCES "product_standard_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_scheme_recommendations" ADD CONSTRAINT "product_scheme_recommendations_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "product_certification_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_scheme_recommendations" ADD CONSTRAINT "product_scheme_recommendations_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_scheme_recommendations" ADD CONSTRAINT "product_scheme_recommendations_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "standards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_scheme_reviews" ADD CONSTRAINT "product_scheme_reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_scheme_reviews" ADD CONSTRAINT "product_scheme_reviews_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certification_fee_estimates" ADD CONSTRAINT "certification_fee_estimates_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "product_certification_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certification_fee_estimates" ADD CONSTRAINT "certification_fee_estimates_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "schemes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_documentation_checklist_items" ADD CONSTRAINT "product_documentation_checklist_items_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "product_certification_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_documentation_checklist_items" ADD CONSTRAINT "product_documentation_checklist_items_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "schemes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_application_requirement_items" ADD CONSTRAINT "product_application_requirement_items_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "product_certification_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_application_requirement_items" ADD CONSTRAINT "product_application_requirement_items_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "schemes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_qco_information_items" ADD CONSTRAINT "product_qco_information_items_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "product_certification_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_qco_information_items" ADD CONSTRAINT "product_qco_information_items_qcoId_fkey" FOREIGN KEY ("qcoId") REFERENCES "qcos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_qco_information_items" ADD CONSTRAINT "product_qco_information_items_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "standards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_testing_analyses" ADD CONSTRAINT "product_testing_analyses_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_testing_analyses" ADD CONSTRAINT "product_testing_analyses_certificationAnalysisId_fkey" FOREIGN KEY ("certificationAnalysisId") REFERENCES "product_certification_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_test_requirements" ADD CONSTRAINT "product_test_requirements_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "product_testing_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_test_requirements" ADD CONSTRAINT "product_test_requirements_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "standards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_test_requirements" ADD CONSTRAINT "product_test_requirements_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "schemes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_test_requirements" ADD CONSTRAINT "product_test_requirements_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "source_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_test_equipments" ADD CONSTRAINT "product_test_equipments_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "product_testing_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_calibration_requirements" ADD CONSTRAINT "product_calibration_requirements_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "product_testing_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_external_lab_requirements" ADD CONSTRAINT "product_external_lab_requirements_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "product_testing_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_external_lab_requirements" ADD CONSTRAINT "product_external_lab_requirements_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "schemes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laboratory_capabilities" ADD CONSTRAINT "laboratory_capabilities_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "laboratories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laboratory_capabilities" ADD CONSTRAINT "laboratory_capabilities_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "standards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laboratory_capabilities" ADD CONSTRAINT "laboratory_capabilities_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "source_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_laboratory_reviews" ADD CONSTRAINT "product_laboratory_reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_laboratory_reviews" ADD CONSTRAINT "product_laboratory_reviews_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "laboratories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_laboratory_reviews" ADD CONSTRAINT "product_laboratory_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_journeys" ADD CONSTRAINT "compliance_journeys_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_requirements" ADD CONSTRAINT "compliance_requirements_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "compliance_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_requirements" ADD CONSTRAINT "compliance_requirements_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "standards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_requirements" ADD CONSTRAINT "compliance_requirements_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "source_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_requirement_dependencies" ADD CONSTRAINT "compliance_requirement_dependencies_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "compliance_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_requirement_dependencies" ADD CONSTRAINT "compliance_requirement_dependencies_prerequisiteRequiremen_fkey" FOREIGN KEY ("prerequisiteRequirementId") REFERENCES "compliance_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_tasks" ADD CONSTRAINT "compliance_tasks_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "compliance_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_tasks" ADD CONSTRAINT "compliance_tasks_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "compliance_requirements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_tasks" ADD CONSTRAINT "compliance_tasks_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_automation_runs" ADD CONSTRAINT "compliance_automation_runs_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "compliance_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_dossiers" ADD CONSTRAINT "application_dossiers_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "compliance_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_dossiers" ADD CONSTRAINT "application_dossiers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_dossier_items" ADD CONSTRAINT "application_dossier_items_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "application_dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_dossier_items" ADD CONSTRAINT "application_dossier_items_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "compliance_requirements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_dossier_items" ADD CONSTRAINT "application_dossier_items_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "product_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulatory_change_events" ADD CONSTRAINT "regulatory_change_events_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "source_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulatory_impacts" ADD CONSTRAINT "regulatory_impacts_changeEventId_fkey" FOREIGN KEY ("changeEventId") REFERENCES "regulatory_change_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulatory_impacts" ADD CONSTRAINT "regulatory_impacts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulatory_impacts" ADD CONSTRAINT "regulatory_impacts_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "compliance_journeys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_alerts" ADD CONSTRAINT "compliance_alerts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_alerts" ADD CONSTRAINT "compliance_alerts_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "compliance_journeys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hallmarking_centres" ADD CONSTRAINT "hallmarking_centres_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "source_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hallmark_verifications" ADD CONSTRAINT "hallmark_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hallmark_verifications" ADD CONSTRAINT "hallmark_verifications_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "source_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumer_services" ADD CONSTRAINT "consumer_services_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "source_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumer_verifications" ADD CONSTRAINT "consumer_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
