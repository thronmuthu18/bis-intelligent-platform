import { prisma } from '../../db/client.js';
import { logger } from '../../config/logger.js';
import type {
  ApplicationDossierResponse,
  ApplicationDossierItemResponse,
  ValidateDossierResponse,
  DossierItemStatus,
  ApplicationDossierStatus,
} from '@bis/shared';

export class ApplicationDossierService {
  /**
   * Compiles the complete Application Preparation Dossier for a product journey.
   */
  async compileDossier(
    journeyId: string,
    productId: string,
    options?: { title?: string; notes?: string }
  ): Promise<ApplicationDossierResponse> {
    logger.info('Compiling Application Preparation Dossier', { journeyId, productId });

    const product: any = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        attributes: true,
        standardReviews: {
          include: { standard: { include: { schemeMappings: { include: { scheme: true } } } } },
        },
        certificationAnalyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            documentationChecklist: {
              include: { scheme: true },
            },
          },
        },
        testingAnalyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { requirements: true },
        },
        laboratoryReviews: {
          include: { laboratory: true },
        },
        documents: {
          include: {
            testMatches: true,
            checklistMatches: true,
          },
        },
      },
    });

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    const journey: any = await prisma.complianceJourney.findUnique({
      where: { id: journeyId },
      include: { requirements: true },
    });

    if (!journey) {
      throw new Error(`Compliance Journey ${journeyId} not found`);
    }

    // 1. Gather all items to include in the dossier
    interface PendingDossierItem {
      requirementId?: string | null;
      itemType: string;
      title: string;
      description?: string | null;
      sourceType: string;
      sourceEntityId?: string | null;
      documentId?: string | null;
      documentFileName?: string | null;
      verificationStatus: 'UNVERIFIED' | 'NEEDS_REVIEW' | 'VERIFIED' | 'REJECTED';
      required: boolean;
      status: DossierItemStatus;
      evidence?: any;
      itemOrder: number;
    }

    const pendingItems: PendingDossierItem[] = [];
    let orderIndex = 1;

    // A. Product Specification & Attributes
    pendingItems.push({
      itemType: 'PRODUCT_SPECIFICATION',
      title: `Technical Specifications: ${product.name}`,
      description: `HSN Code: ${product.hsnCode || 'N/A'}, Category: ${product.category}, Country of Origin: ${product.countryOfManufacture || 'India'}`,
      sourceType: 'PRODUCT',
      sourceEntityId: product.id,
      verificationStatus: 'VERIFIED',
      required: true,
      status: product.attributes?.length > 0 ? 'VERIFIED' : 'NEEDS_REVIEW',
      evidence: {
        attributeCount: product.attributes?.length || 0,
        manufacturer: product.manufacturerName,
      },
      itemOrder: orderIndex++,
    });

    // B. Confirmed Standards & Scheme
    const confirmedStandards = (product.standardReviews || []).filter(
      (r: any) => r.decision === 'CONFIRMED'
    );
    for (const review of confirmedStandards) {
      const std = review.standard;
      const scheme = std.schemeMappings?.[0]?.scheme;
      pendingItems.push({
        itemType: 'STANDARD_CONFORMITY',
        title: `Applicable Standard: ${std.isNumber} (${std.title})`,
        description: `Under BIS ${scheme?.name || 'Certification Scheme'} (${scheme?.code || 'Scheme-I'})`,
        sourceType: 'STANDARD',
        sourceEntityId: std.id,
        verificationStatus: 'VERIFIED',
        required: true,
        status: 'VERIFIED',
        evidence: {
          isNumber: std.isNumber,
          schemeCode: scheme?.code,
          decision: review.decision,
        },
        itemOrder: orderIndex++,
      });
    }

    // C. Documentation Checklist Items (Factory layout, Quality manual, Declarations, etc.)
    const certAnalysis = product.certificationAnalyses?.[0];
    if (certAnalysis && certAnalysis.documentationChecklist?.length > 0) {
      for (const chk of certAnalysis.documentationChecklist) {
        const matchedDoc = (product.documents || []).find((d: any) =>
          d.checklistMatches?.some((m: any) => m.checklistId === chk.id)
        );
        let itemStatus: DossierItemStatus = 'MISSING';
        let docVerStatus: 'UNVERIFIED' | 'NEEDS_REVIEW' | 'VERIFIED' | 'REJECTED' = 'UNVERIFIED';

        if (matchedDoc) {
          docVerStatus = matchedDoc.verificationStatus;
          if (matchedDoc.verificationStatus === 'VERIFIED') {
            itemStatus = 'VERIFIED';
          } else if (matchedDoc.verificationStatus === 'NEEDS_REVIEW') {
            itemStatus = 'NEEDS_REVIEW';
          } else {
            itemStatus = 'PRESENT';
          }
        }

        const matchedReq = (journey.requirements || []).find(
          (r: any) => r.sourceEntityId === chk.id || r.title.includes(chk.documentName)
        );

        pendingItems.push({
          requirementId: matchedReq?.id,
          itemType: chk.category === 'FACTORY' ? 'FACTORY' : 'DOCUMENT',
          title: chk.documentName,
          description: chk.reason,
          sourceType: 'DOCUMENT',
          sourceEntityId: chk.id,
          documentId: matchedDoc?.id,
          documentFileName: matchedDoc?.originalFileName,
          verificationStatus: docVerStatus,
          required: chk.requiredStatus === 'REQUIRED',
          status: itemStatus,
          evidence: {
            category: chk.category,
            notes: chk.notes,
            extractedMetadata: matchedDoc?.extractedData,
          },
          itemOrder: orderIndex++,
        });
      }
    }

    // D. Testing Requirements & Reports
    const testingAnalysis = product.testingAnalyses?.[0];
    if (testingAnalysis && testingAnalysis.requirements?.length > 0) {
      for (const test of testingAnalysis.requirements) {
        const testReportDoc = (product.documents || []).find((d: any) =>
          d.testMatches?.some((m: any) => m.testRequirementId === test.id && m.passFailStatus === 'PASS')
        );

        let itemStatus: DossierItemStatus = 'MISSING';
        let docVerStatus: 'UNVERIFIED' | 'NEEDS_REVIEW' | 'VERIFIED' | 'REJECTED' = 'UNVERIFIED';

        if (testReportDoc) {
          docVerStatus = testReportDoc.verificationStatus;
          itemStatus = testReportDoc.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'PRESENT';
        }

        const matchedReq = (journey.requirements || []).find(
          (r: any) => r.sourceEntityId === test.id || r.title.includes(test.testName)
        );

        pendingItems.push({
          requirementId: matchedReq?.id,
          itemType: 'TEST_REPORT',
          title: `STI Test Evidence: ${test.testName}`,
          description: `Clause: ${test.clause || 'STI'} - Specified Limit: ${test.requirementValue || 'Conformity'}`,
          sourceType: 'TEST_REQUIREMENT',
          sourceEntityId: test.id,
          documentId: testReportDoc?.id,
          documentFileName: testReportDoc?.originalFileName,
          verificationStatus: docVerStatus,
          required: test.status === 'REQUIRED',
          status: itemStatus,
          evidence: {
            testMethod: test.testMethod,
            testCategory: test.testCategory,
          },
          itemOrder: orderIndex++,
        });
      }
    }

    // E. Laboratory Selection Evidence
    const selectedLabReview = (product.laboratoryReviews || []).find(
      (r: any) => r.decision === 'SELECTED' || r.decision === 'SHORTLISTED'
    );
    if (selectedLabReview) {
      pendingItems.push({
        itemType: 'LABORATORY_SELECTION',
        title: `Designated Laboratory: ${selectedLabReview.laboratory?.name || 'Selected Lab'}`,
        description: `BIS Recognized lab code ${selectedLabReview.laboratory?.code || 'N/A'} - City: ${selectedLabReview.laboratory?.city || 'India'}`,
        sourceType: 'LABORATORY',
        sourceEntityId: selectedLabReview.laboratoryId,
        verificationStatus: 'VERIFIED',
        required: true,
        status: 'VERIFIED',
        evidence: {
          labName: selectedLabReview.laboratory?.name,
          organizationType: selectedLabReview.laboratory?.organizationType,
          decision: selectedLabReview.decision,
        },
        itemOrder: orderIndex++,
      });
    } else {
      pendingItems.push({
        itemType: 'LABORATORY_SELECTION',
        title: 'Designated BIS Laboratory Selection',
        description: 'Third-party testing laboratory selection is required for official sample testing.',
        sourceType: 'LABORATORY',
        verificationStatus: 'UNVERIFIED',
        required: true,
        status: 'MISSING',
        itemOrder: orderIndex++,
      });
    }

    // 2. Calculate Dossier metrics
    const requiredItems = pendingItems.filter((i) => i.required);
    const verifiedItems = requiredItems.filter((i) => i.status === 'VERIFIED');
    const missingItems = requiredItems.filter((i) => i.status === 'MISSING');
    const unverifiedItems = requiredItems.filter(
      (i) => i.status === 'PRESENT' || i.status === 'NEEDS_REVIEW'
    );

    const completenessScore = requiredItems.length > 0
      ? Math.round((verifiedItems.length / requiredItems.length) * 100)
      : 100;

    let dossierStatus: ApplicationDossierStatus = 'DRAFT';
    if (completenessScore === 100) {
      dossierStatus = 'READY_FOR_OFFICIAL_ACTION';
    } else if (missingItems.length === 0 && unverifiedItems.length === 0) {
      dossierStatus = 'READY_FOR_REVIEW';
    } else if (missingItems.length > 0) {
      dossierStatus = 'INCOMPLETE';
    }

    // 3. Upsert Dossier in database
    const existingDossier = await prisma.applicationDossier.findFirst({
      where: { journeyId },
      orderBy: { version: 'desc' },
    });

    const dossierTitle = options?.title || `Preparation Dossier for ${product.name}`;
    const dossierSummary = options?.notes || `Preparation dossier compiled with ${pendingItems.length} evidence items. Completeness: ${completenessScore}%. Disclaimer: Not an official BIS application submission.`;

    let dossier;
    if (existingDossier) {
      await prisma.applicationDossierItem.deleteMany({
        where: { dossierId: existingDossier.id },
      });

      dossier = await prisma.applicationDossier.update({
        where: { id: existingDossier.id },
        data: {
          title: dossierTitle,
          summary: dossierSummary,
          status: dossierStatus,
          completenessScore,
          missingCount: missingItems.length,
          unverifiedCount: unverifiedItems.length,
          verifiedCount: verifiedItems.length,
          validatedAt: new Date(),
          metadata: {
            disclaimer: 'This is a structured preparation dossier generated by the platform and does not constitute official BIS application submission or guarantee of certification.',
            compiledAt: new Date().toISOString(),
          },
        },
      });
    } else {
      dossier = await prisma.applicationDossier.create({
        data: {
          journeyId,
          productId,
          version: 1,
          status: dossierStatus,
          title: dossierTitle,
          summary: dossierSummary,
          completenessScore,
          missingCount: missingItems.length,
          unverifiedCount: unverifiedItems.length,
          verifiedCount: verifiedItems.length,
          validatedAt: new Date(),
          metadata: {
            disclaimer: 'This is a structured preparation dossier generated by the platform and does not constitute official BIS application submission or guarantee of certification.',
            compiledAt: new Date().toISOString(),
          },
        },
      });
    }

    // 4. Create items
    await prisma.applicationDossierItem.createMany({
      data: pendingItems.map((item) => ({
        dossierId: dossier.id,
        requirementId: item.requirementId,
        itemType: item.itemType,
        title: item.title,
        description: item.description,
        sourceType: item.sourceType,
        sourceEntityId: item.sourceEntityId,
        documentId: item.documentId,
        verificationStatus: item.verificationStatus,
        required: item.required,
        status: item.status,
        evidence: item.evidence || {},
        itemOrder: item.itemOrder,
      })),
    });

    const createdItems = await prisma.applicationDossierItem.findMany({
      where: { dossierId: dossier.id },
      include: { document: true },
      orderBy: { itemOrder: 'asc' },
    });

    return {
      id: dossier.id,
      journeyId: dossier.journeyId,
      productId: dossier.productId,
      version: dossier.version,
      status: dossier.status as ApplicationDossierStatus,
      title: dossier.title,
      summary: dossier.summary,
      completenessScore: dossier.completenessScore,
      missingCount: dossier.missingCount,
      unverifiedCount: dossier.unverifiedCount,
      verifiedCount: dossier.verifiedCount,
      validatedAt: dossier.validatedAt ? dossier.validatedAt.toISOString() : null,
      exportedAt: dossier.exportedAt ? dossier.exportedAt.toISOString() : null,
      metadata: dossier.metadata,
      items: createdItems.map((i: any) => ({
        id: i.id,
        dossierId: i.dossierId,
        requirementId: i.requirementId,
        itemType: i.itemType,
        title: i.title,
        description: i.description,
        sourceType: i.sourceType,
        sourceEntityId: i.sourceEntityId,
        documentId: i.documentId,
        documentFileName: i.document?.originalFileName,
        verificationStatus: i.verificationStatus,
        required: i.required,
        status: i.status as DossierItemStatus,
        evidence: i.evidence,
        itemOrder: i.itemOrder,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      })),
      createdAt: dossier.createdAt.toISOString(),
      updatedAt: dossier.updatedAt.toISOString(),
    };
  }

  /**
   * Validates the completeness and integrity of a compiled dossier.
   */
  async validateDossier(journeyId: string, productId: string): Promise<ValidateDossierResponse> {
    logger.info('Validating Application Preparation Dossier', { journeyId, productId });

    let dossier = await prisma.applicationDossier.findFirst({
      where: { journeyId },
      include: {
        items: {
          include: { document: true },
          orderBy: { itemOrder: 'asc' },
        },
      },
    });

    if (!dossier) {
      await this.compileDossier(journeyId, productId);
      dossier = await prisma.applicationDossier.findFirst({
        where: { journeyId },
        include: {
          items: {
            include: { document: true },
            orderBy: { itemOrder: 'asc' },
          },
        },
      });
    }

    if (!dossier) {
      throw new Error(`Unable to find or compile dossier for journey ${journeyId}`);
    }

    const missingItems: ApplicationDossierItemResponse[] = [];
    const unverifiedItems: ApplicationDossierItemResponse[] = [];
    const blockers: string[] = [];
    const warnings: string[] = [];

    for (const item of dossier.items) {
      const itemResp: ApplicationDossierItemResponse = {
        id: item.id,
        dossierId: item.dossierId,
        requirementId: item.requirementId,
        itemType: item.itemType,
        title: item.title,
        description: item.description,
        sourceType: item.sourceType,
        sourceEntityId: item.sourceEntityId,
        documentId: item.documentId,
        documentFileName: item.document?.originalFileName,
        verificationStatus: item.verificationStatus,
        required: item.required,
        status: item.status as DossierItemStatus,
        evidence: item.evidence,
        itemOrder: item.itemOrder,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      };

      if (item.required && item.status === 'MISSING') {
        missingItems.push(itemResp);
        blockers.push(`Missing mandatory dossier item: ${item.title}`);
      } else if (item.required && (item.status === 'NEEDS_REVIEW' || item.verificationStatus !== 'VERIFIED')) {
        unverifiedItems.push(itemResp);
        warnings.push(`Dossier item requires human verification: ${item.title}`);
      }
    }

    const isValid = blockers.length === 0 && unverifiedItems.length === 0;
    const newStatus: ApplicationDossierStatus = isValid
      ? 'READY_FOR_OFFICIAL_ACTION'
      : blockers.length > 0
      ? 'INCOMPLETE'
      : 'READY_FOR_REVIEW';

    await prisma.applicationDossier.update({
      where: { id: dossier.id },
      data: {
        status: newStatus,
        validatedAt: new Date(),
      },
    });

    return {
      isValid,
      status: newStatus,
      completenessScore: dossier.completenessScore,
      missingItems,
      unverifiedItems,
      warnings,
      blockers,
      validatedAt: new Date().toISOString(),
    };
  }
}

export const applicationDossierService = new ApplicationDossierService();
