import { prisma } from '../../db/client.js';
import { AppError } from '../../utils/AppError.js';
import { getStorageProvider } from './storage/storage-provider.factory.js';
import type { DocumentStorageProvider } from './storage/storage.interface.js';
import { validateUploadedFile } from './security/file-validator.js';
import { ExtractorRouter } from './extraction/extractor-router.js';
import { DocumentClassificationService } from './classification/document-classifier.service.js';
import { StructuredExtractorService } from './structured-extractor.js';
import { RequirementMapperService } from './requirement-mapper.service.js';
import { DocumentCompletenessService } from './document-completeness.service.js';
import type {
  ProductDocumentItem,
  ProductDocumentCompletenessResponse,
  VerifyDocumentInput,
  DocumentType,
  DocumentEvidenceResponse,
  DocumentRequirementMappingResponse,
} from '@bis/shared';

export class DocumentIntelligenceService {
  private storage: DocumentStorageProvider;
  private extractorRouter: ExtractorRouter;
  private classifier: DocumentClassificationService;
  private structuredExtractor: StructuredExtractorService;
  private requirementMapper: RequirementMapperService;
  private completenessService: DocumentCompletenessService;

  constructor(customStorage?: DocumentStorageProvider) {
    this.storage = customStorage || getStorageProvider();
    this.extractorRouter = new ExtractorRouter();
    this.classifier = new DocumentClassificationService();
    this.structuredExtractor = new StructuredExtractorService();
    this.requirementMapper = new RequirementMapperService();
    this.completenessService = new DocumentCompletenessService();
  }

  /**
   * Securely uploads, validates, extracts, classifies, and maps a compliance document.
   */
  async uploadAndProcessDocument(
    productId: string,
    userId: string,
    fileBuffer: Buffer,
    originalFileName: string,
    mimeType: string,
    userSelectedType?: DocumentType,
    notes?: string
  ): Promise<ProductDocumentItem> {
    // 1. Verify product ownership
    const product = await prisma.product.findFirst({
      where: { id: productId, userId, isActive: true },
    });

    if (!product) {
      throw AppError.notFound('Product not found or access denied');
    }

    // 2. Validate file format and magic bytes
    const validation = validateUploadedFile(fileBuffer, originalFileName, mimeType);

    // 3. Store file in private storage
    const stored = await this.storage.upload(
      fileBuffer,
      validation.sanitizedFileName,
      validation.mimeType,
      productId
    );

    // 4. Audit Log: Document Uploaded
    await prisma.auditLog.create({
      data: {
        userId,
        productId,
        action: 'DOCUMENT_UPLOADED',
        entityType: 'ProductDocument',
        metadata: {
          originalFileName: validation.sanitizedFileName,
          fileSize: stored.fileSize,
          fileHash: stored.fileHash,
        },
      },
    });

    // 5. Detect Document Family and Versioning
    const existingFamilyDocs = await prisma.productDocument.findMany({
      where: {
        productId,
        originalFileName: validation.sanitizedFileName,
      },
      orderBy: { version: 'desc' },
    });

    let version = 1;
    let supersedesDocumentId: string | null = null;
    const documentFamily = validation.sanitizedFileName;

    if (existingFamilyDocs.length > 0) {
      const latestDoc = existingFamilyDocs[0];
      version = latestDoc.version + 1;
      supersedesDocumentId = latestDoc.id;

      // Mark previous version as not current
      await prisma.productDocument.updateMany({
        where: {
          productId,
          documentFamily,
        },
        data: { isCurrent: false },
      });

      await prisma.auditLog.create({
        data: {
          userId,
          productId,
          action: 'DOCUMENT_VERSION_CREATED',
          entityType: 'ProductDocument',
          metadata: {
            version,
            supersedesDocumentId,
            documentFamily,
          },
        },
      });
    }

    // 6. Text Extraction (Page-level preservation)
    const extractionResult = await this.extractorRouter.extractText(
      fileBuffer,
      validation.mimeType,
      validation.sanitizedFileName
    );

    // 7. Document Classification
    const classification = this.classifier.classify(
      extractionResult.fullText,
      validation.sanitizedFileName,
      userSelectedType
    );

    // 8. Structured Domain Field Extraction & Evidence
    const structuredResult = this.structuredExtractor.extract(
      classification.documentType,
      extractionResult.pages,
      extractionResult.fullText
    );

    // 9. Load Phase 7 Checklist and Phase 8 Test Requirements for mapping
    const certAnalysis = await prisma.productCertificationAnalysis.findFirst({
      where: { productId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      include: {
        documentationChecklist: true,
      },
    });

    const testingAnalysis = await prisma.productTestingAnalysis.findFirst({
      where: { productId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      include: {
        requirements: {
          include: { standard: true },
        },
      },
    });

    const checklistItems = certAnalysis?.documentationChecklist || [];
    const testRequirements = testingAnalysis?.requirements || [];

    // 10. Requirement Mapping
    const checklistMatches = this.requirementMapper.mapChecklistRequirements(
      { id: '', originalFileName: validation.sanitizedFileName, documentType: classification.documentType },
      structuredResult,
      extractionResult.fullText,
      checklistItems
    );

    const testMatches = this.requirementMapper.mapTestRequirements(
      structuredResult,
      extractionResult.fullText,
      testRequirements
    );

    // 11. Database Transaction Persistence
    const savedDocument = await prisma.$transaction(async (tx) => {
      const created = await tx.productDocument.create({
        data: {
          productId,
          uploadedByUserId: userId,
          originalFileName: validation.sanitizedFileName,
          storedFileName: stored.storedFileName,
          storageKey: stored.storageKey,
          mimeType: validation.mimeType,
          fileSize: stored.fileSize,
          fileHash: stored.fileHash,
          documentType: classification.documentType,
          classificationConfidence: classification.confidence,
          classificationReasons: classification.reasons,
          processingStatus: 'ANALYZED',
          extractionStatus: 'COMPLETED',
          verificationStatus: 'UNVERIFIED',
          pageCount: extractionResult.pageCount,
          extractedText: extractionResult.fullText,
          extractionMetadata: extractionResult.metadata,
          version,
          documentFamily,
          supersedesDocumentId,
          isCurrent: true,
          verificationNotes: notes || null,
          processedAt: new Date(),
        },
      });

      // Persist Page Evidence
      for (const ev of structuredResult.pageEvidence) {
        await tx.documentPageEvidence.create({
          data: {
            documentId: created.id,
            pageNumber: ev.pageNumber,
            claim: ev.claim,
            sourceText: ev.sourceText,
            confidence: ev.confidence || 0.90,
            sectionKey: ev.sectionKey || null,
          },
        });
      }

      // Persist Structured Extraction
      await tx.documentStructuredExtraction.create({
        data: {
          documentId: created.id,
          extractedType: structuredResult.extractedType,
          laboratoryName: structuredResult.laboratoryName,
          reportNumber: structuredResult.reportNumber,
          reportDate: structuredResult.reportDate,
          certificateNumber: structuredResult.certificateNumber,
          calibrationDate: structuredResult.calibrationDate,
          calibrationDueDate: structuredResult.calibrationDueDate,
          calibrationInterval: structuredResult.calibrationInterval,
          traceability: structuredResult.traceability,
          productName: structuredResult.productName,
          modelNumber: structuredResult.modelNumber,
          manufacturerName: structuredResult.manufacturerName,
          standardNumber: structuredResult.standardNumber,
          passFailStatus: structuredResult.passFailStatus,
          validityStatus: structuredResult.validityStatus,
          extractedFields: structuredResult.extractedFields,
        },
      });

      // Persist Checklist Matches
      for (const cm of checklistMatches) {
        await tx.documentChecklistMatch.create({
          data: {
            documentId: created.id,
            checklistItemId: cm.checklistItemId || null,
            checklistCategory: cm.checklistCategory || null,
            requirementTitle: cm.requirementTitle,
            matchStatus: cm.matchStatus,
            confidence: cm.confidence,
            matchReason: cm.matchReason,
            evidencePage: cm.evidencePage || 1,
            evidenceSnippet: cm.evidenceSnippet || null,
          },
        });
      }

      // Persist Test Matches
      for (const tm of testMatches) {
        await tx.documentTestMatch.create({
          data: {
            documentId: created.id,
            testRequirementId: tm.testRequirementId || null,
            testName: tm.testName,
            testMethod: tm.testMethod || null,
            standardNumber: tm.standardNumber || null,
            parameter: tm.parameter || null,
            extractedResult: tm.extractedResult || null,
            passFailStatus: tm.passFailStatus || null,
            matchStatus: tm.matchStatus,
            evidencePage: tm.evidencePage || 1,
            evidenceSnippet: tm.evidenceSnippet || null,
          },
        });
      }

      return tx.productDocument.findUnique({
        where: { id: created.id },
        include: {
          structuredExtraction: true,
          pageEvidence: { orderBy: { pageNumber: 'asc' } },
          checklistMatches: true,
          testMatches: true,
        },
      });
    });

    // 12. Audit Log: Extraction & Analysis Completed
    await prisma.auditLog.create({
      data: {
        userId,
        productId,
        action: 'DOCUMENT_ANALYSIS_COMPLETED',
        entityType: 'ProductDocument',
        entityId: savedDocument?.id,
        metadata: {
          documentType: classification.documentType,
          confidence: classification.confidence,
          checklistMatchesCount: checklistMatches.length,
          testMatchesCount: testMatches.length,
        },
      },
    });

    return this.formatDocumentResponse(savedDocument);
  }

  /**
   * Retrieves all documents for a product.
   */
  async getDocuments(productId: string, userId: string): Promise<ProductDocumentItem[]> {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId, isActive: true },
    });

    if (!product) {
      throw AppError.notFound('Product not found or access denied');
    }

    const documents = await prisma.productDocument.findMany({
      where: { productId },
      orderBy: [{ isCurrent: 'desc' }, { createdAt: 'desc' }],
      include: {
        structuredExtraction: true,
        pageEvidence: { orderBy: { pageNumber: 'asc' } },
        checklistMatches: true,
        testMatches: true,
      },
    });

    return documents.map((d) => this.formatDocumentResponse(d));
  }

  /**
   * Retrieves a single document by ID.
   */
  async getDocumentById(
    productId: string,
    documentId: string,
    userId: string
  ): Promise<ProductDocumentItem> {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId, isActive: true },
    });

    if (!product) {
      throw AppError.notFound('Product not found or access denied');
    }

    const doc = await prisma.productDocument.findFirst({
      where: { id: documentId, productId },
      include: {
        structuredExtraction: true,
        pageEvidence: { orderBy: { pageNumber: 'asc' } },
        checklistMatches: true,
        testMatches: true,
      },
    });

    if (!doc) {
      throw AppError.notFound('Document not found');
    }

    return this.formatDocumentResponse(doc);
  }

  /**
   * Verifies or rejects a document (Human-in-the-loop).
   */
  async verifyDocument(
    productId: string,
    documentId: string,
    userId: string,
    input: VerifyDocumentInput
  ): Promise<ProductDocumentItem> {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId, isActive: true },
    });

    if (!product) {
      throw AppError.notFound('Product not found or access denied');
    }

    const doc = await prisma.productDocument.findFirst({
      where: { id: documentId, productId },
    });

    if (!doc) {
      throw AppError.notFound('Document not found');
    }

    const updated = await prisma.productDocument.update({
      where: { id: documentId },
      data: {
        verificationStatus: input.verificationStatus,
        documentType: input.documentType || doc.documentType,
        verificationNotes: input.verificationNotes || doc.verificationNotes,
        verifiedByUserId: userId,
        verifiedAt: new Date(),
      },
      include: {
        structuredExtraction: true,
        pageEvidence: { orderBy: { pageNumber: 'asc' } },
        checklistMatches: true,
        testMatches: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        productId,
        action: 'DOCUMENT_VERIFIED',
        entityType: 'ProductDocument',
        entityId: documentId,
        metadata: {
          verificationStatus: input.verificationStatus,
          documentType: input.documentType || doc.documentType,
        },
      },
    });

    return this.formatDocumentResponse(updated);
  }

  /**
   * Deletes a document record and its underlying private stored file.
   */
  async deleteDocument(
    productId: string,
    documentId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId, isActive: true },
    });

    if (!product) {
      throw AppError.notFound('Product not found or access denied');
    }

    const doc = await prisma.productDocument.findFirst({
      where: { id: documentId, productId },
    });

    if (!doc) {
      throw AppError.notFound('Document not found');
    }

    // Delete stored file
    await this.storage.delete(doc.storageKey);

    // Delete database record
    await prisma.productDocument.delete({
      where: { id: documentId },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        productId,
        action: 'DOCUMENT_DELETED',
        entityType: 'ProductDocument',
        entityId: documentId,
        metadata: { originalFileName: doc.originalFileName },
      },
    });

    return {
      success: true,
      message: 'Document deleted successfully',
    };
  }

  /**
   * Calculates overall document completeness analysis for a product.
   */
  async getCompleteness(
    productId: string,
    userId: string
  ): Promise<ProductDocumentCompletenessResponse> {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId, isActive: true },
    });

    if (!product) {
      throw AppError.notFound('Product not found or access denied');
    }

    const documents = await prisma.productDocument.findMany({
      where: { productId, isCurrent: true },
      include: {
        checklistMatches: true,
      },
    });

    const certAnalysis = await prisma.productCertificationAnalysis.findFirst({
      where: { productId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      include: {
        documentationChecklist: true,
      },
    });

    const testingAnalysis = await prisma.productTestingAnalysis.findFirst({
      where: { productId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      include: {
        requirements: true,
      },
    });

    const checklistItems = certAnalysis?.documentationChecklist || [];
    const testRequirements = testingAnalysis?.requirements || [];

    const completeness = this.completenessService.calculateCompleteness(
      documents,
      checklistItems,
      testRequirements
    );

    // Save snapshot in database
    await prisma.productDocumentCompletenessAnalysis.create({
      data: {
        productId,
        score: completeness.score,
        status: completeness.status,
        totalRequired: completeness.totalRequired,
        verifiedCount: completeness.verifiedCount,
        matchedCount: completeness.matchedCount,
        needsReviewCount: completeness.needsReviewCount,
        missingCount: completeness.missingCount,
        expiredCount: completeness.expiredCount,
        missingDocumentTypes: completeness.missingDocumentTypes,
        blockers: completeness.blockers,
        nextSteps: completeness.nextSteps,
      },
    });

    return completeness;
  }

  /**
   * Retrieves page evidence for a document.
   */
  async getDocumentEvidence(
    productId: string,
    documentId: string,
    userId: string
  ): Promise<DocumentEvidenceResponse> {
    const doc = await this.getDocumentById(productId, documentId, userId);

    return {
      documentId: doc.id,
      originalFileName: doc.originalFileName,
      pageCount: doc.pageCount,
      evidence: doc.pageEvidence || [],
    };
  }

  /**
   * Retrieves requirement mappings for product documents.
   */
  async getRequirementMappings(
    productId: string,
    userId: string
  ): Promise<DocumentRequirementMappingResponse> {
    const documents = await this.getDocuments(productId, userId);

    const checklistMatches = documents.flatMap((d) => d.checklistMatches || []);
    const testMatches = documents.flatMap((d) => d.testMatches || []);
    const unmatchedDocuments = documents.filter(
      (d) => (!d.checklistMatches || d.checklistMatches.length === 0) && (!d.testMatches || d.testMatches.length === 0)
    );

    return {
      checklistMatches,
      testMatches,
      unmatchedDocuments,
    };
  }

  /**
   * Retrieves download stream for private document.
   */
  async getDownloadStream(productId: string, documentId: string, userId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId, isActive: true },
    });

    if (!product) {
      throw AppError.notFound('Product not found or access denied');
    }

    const doc = await prisma.productDocument.findFirst({
      where: { id: documentId, productId },
    });

    if (!doc) {
      throw AppError.notFound('Document not found');
    }

    const stream = await this.storage.downloadStream(doc.storageKey);
    return {
      stream,
      mimeType: doc.mimeType,
      fileName: doc.originalFileName,
      fileSize: doc.fileSize,
    };
  }

  private formatDocumentResponse(doc: any): ProductDocumentItem {
    return {
      id: doc.id,
      productId: doc.productId,
      uploadedByUserId: doc.uploadedByUserId,
      originalFileName: doc.originalFileName,
      storedFileName: doc.storedFileName,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      fileHash: doc.fileHash,
      documentType: doc.documentType,
      classificationConfidence: doc.classificationConfidence,
      classificationReasons: doc.classificationReasons || [],
      processingStatus: doc.processingStatus,
      extractionStatus: doc.extractionStatus,
      verificationStatus: doc.verificationStatus,
      pageCount: doc.pageCount,
      extractedText: doc.extractedText,
      extractionMetadata: doc.extractionMetadata,
      version: doc.version,
      documentFamily: doc.documentFamily,
      supersedesDocumentId: doc.supersedesDocumentId,
      isCurrent: doc.isCurrent,
      verifiedByUserId: doc.verifiedByUserId,
      verifiedAt: doc.verifiedAt ? doc.verifiedAt.toISOString() : null,
      verificationNotes: doc.verificationNotes,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      processedAt: doc.processedAt ? doc.processedAt.toISOString() : null,
      structuredExtraction: doc.structuredExtraction
        ? {
            id: doc.structuredExtraction.id,
            documentId: doc.structuredExtraction.documentId,
            extractedType: doc.structuredExtraction.extractedType,
            laboratoryName: doc.structuredExtraction.laboratoryName,
            reportNumber: doc.structuredExtraction.reportNumber,
            reportDate: doc.structuredExtraction.reportDate ? doc.structuredExtraction.reportDate.toISOString() : null,
            certificateNumber: doc.structuredExtraction.certificateNumber,
            calibrationDate: doc.structuredExtraction.calibrationDate ? doc.structuredExtraction.calibrationDate.toISOString() : null,
            calibrationDueDate: doc.structuredExtraction.calibrationDueDate ? doc.structuredExtraction.calibrationDueDate.toISOString() : null,
            calibrationInterval: doc.structuredExtraction.calibrationInterval,
            traceability: doc.structuredExtraction.traceability,
            productName: doc.structuredExtraction.productName,
            modelNumber: doc.structuredExtraction.modelNumber,
            manufacturerName: doc.structuredExtraction.manufacturerName,
            standardNumber: doc.structuredExtraction.standardNumber,
            passFailStatus: doc.structuredExtraction.passFailStatus,
            validityStatus: doc.structuredExtraction.validityStatus,
            extractedFields: doc.structuredExtraction.extractedFields || {},
            createdAt: doc.structuredExtraction.createdAt.toISOString(),
            updatedAt: doc.structuredExtraction.updatedAt.toISOString(),
          }
        : null,
      pageEvidence: (doc.pageEvidence || []).map((e: any) => ({
        id: e.id,
        pageNumber: e.pageNumber,
        claim: e.claim,
        sourceText: e.sourceText,
        confidence: e.confidence,
        boundingBox: e.boundingBox,
        sectionKey: e.sectionKey,
      })),
      checklistMatches: (doc.checklistMatches || []).map((m: any) => ({
        id: m.id,
        documentId: m.documentId,
        documentFileName: doc.originalFileName,
        documentType: doc.documentType,
        checklistItemId: m.checklistItemId,
        checklistCategory: m.checklistCategory,
        requirementTitle: m.requirementTitle,
        matchStatus: m.matchStatus,
        confidence: m.confidence,
        matchReason: m.matchReason,
        evidencePage: m.evidencePage,
        evidenceSnippet: m.evidenceSnippet,
        createdAt: m.createdAt.toISOString(),
      })),
      testMatches: (doc.testMatches || []).map((t: any) => ({
        id: t.id,
        documentId: t.documentId,
        documentFileName: doc.originalFileName,
        testRequirementId: t.testRequirementId,
        testName: t.testName,
        testMethod: t.testMethod,
        standardNumber: t.standardNumber,
        parameter: t.parameter,
        extractedResult: t.extractedResult,
        passFailStatus: t.passFailStatus,
        matchStatus: t.matchStatus,
        evidencePage: t.evidencePage,
        evidenceSnippet: t.evidenceSnippet,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  }
}

export const documentIntelligenceService = new DocumentIntelligenceService();
