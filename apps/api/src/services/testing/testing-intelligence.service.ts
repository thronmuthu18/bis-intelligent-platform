import { createHash } from 'crypto';
import { prisma } from '../../db/client.js';
import { AppError } from '../../utils/AppError.js';
import { extractTestRequirements } from './test-requirement-extractor.js';
import {
  extractEquipmentRequirements,
  extractCalibrationRequirements,
} from './equipment-extractor.js';
import { evaluateExternalLabRequirements } from './external-lab-evaluator.js';
import { matchLaboratories } from './laboratory-matching.service.js';
import { evaluateTestingReadiness } from './testing-readiness-evaluator.js';
import { analyzeProductStandards } from '../intelligence/product-intelligence.service.js';
import { CertificationIntelligenceService } from '../certification/certification-intelligence.service.js';
import type {
  ProductTestingAnalysisResponse,
  ProductTestRequirementItem,
  ProductTestEquipmentItem,
  ProductCalibrationRequirementItem,
  ProductExternalLabRequirementItem,
  LaboratoryMatchResult,
  ProductLaboratoryReviewItem,
  CreateProductLaboratoryReviewInput,
  LaboratoryFilterParams,
  TestCategory,
  TestRequirementStatus,
} from '@bis/shared';

export const TESTING_INTELLIGENCE_VERSION = '1.0.0';

/**
 * Computes a deterministic SHA-256 hash representing all testing intelligence inputs.
 */
export function computeTestingInputHash(
  product: any,
  matchedStandards: any[],
  certificationAnalysis: any,
  attributes: any[],
  version: string = TESTING_INTELLIGENCE_VERSION
): string {
  const normProduct = {
    id: product.id,
    name: product.name?.trim().toLowerCase() || '',
    category: product.category?.trim().toLowerCase() || '',
    intendedUse: product.intendedUse?.trim().toLowerCase() || '',
    manufacturerName: product.manufacturerName?.trim().toLowerCase() || '',
  };

  const normAttributes = (attributes || [])
    .map((a: any) => ({
      key: a.attributeKey?.trim().toLowerCase() || '',
      val: a.normalizedValue || a.attributeValue?.trim().toLowerCase() || '',
    }))
    .sort((a: any, b: any) => a.key.localeCompare(b.key));

  const standardIds = (matchedStandards || [])
    .map((s: any) => s.standardId || s.id || s.standard?.id)
    .filter(Boolean)
    .sort();

  const certId = certificationAnalysis?.id || '';
  const certStatus = certificationAnalysis?.status || '';

  const payload = JSON.stringify({
    version,
    product: normProduct,
    attributes: normAttributes,
    standardIds,
    certId,
    certStatus,
  });

  return createHash('sha256').update(payload).digest('hex');
}

/**
 * Master Testing & Laboratory Intelligence Service
 */
export class TestingIntelligenceService {
  private certService = new CertificationIntelligenceService();

  /**
   * Executes or retrieves cached testing analysis for a product.
   */
  async analyzeProductTesting(
    productId: string,
    userId: string,
    forceRefresh: boolean = false
  ): Promise<ProductTestingAnalysisResponse> {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId, isActive: true },
    });

    if (!product) {
      throw AppError.notFound('Product not found or access denied');
    }

    // 1. Load attributes
    const attributes = await prisma.productAttribute.findMany({
      where: { productId },
    });

    // 2. Load latest standard analysis
    let standardAnalysis = await prisma.productStandardAnalysis.findFirst({
      where: { productId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      include: {
        matches: {
          include: { standard: { include: { sourceDocument: true } } },
          orderBy: { rank: 'asc' },
        },
      },
    });

    if (!standardAnalysis) {
      await analyzeProductStandards(productId, userId);
      standardAnalysis = await prisma.productStandardAnalysis.findFirst({
        where: { productId, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        include: {
          matches: {
            include: { standard: { include: { sourceDocument: true } } },
            orderBy: { rank: 'asc' },
          },
        },
      });
    }

    // 3. Load latest certification analysis
    let certAnalysis = await prisma.productCertificationAnalysis.findFirst({
      where: { productId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      include: {
        schemeRecommendations: {
          include: { scheme: true, standard: true },
          orderBy: { rank: 'asc' },
        },
      },
    });

    if (!certAnalysis) {
      await this.certService.analyzeProductCertification(productId, userId);
      certAnalysis = await prisma.productCertificationAnalysis.findFirst({
        where: { productId, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        include: {
          schemeRecommendations: {
            include: { scheme: true, standard: true },
            orderBy: { rank: 'asc' },
          },
        },
      });
    }

    // Determine relevant standards & schemes
    const standardReviews = await prisma.productStandardReview.findMany({
      where: { productId },
    });
    const schemeReviews = await prisma.productSchemeReview.findMany({
      where: { productId },
    });

    const confirmedStdIds = new Set(
      standardReviews.filter((r) => r.decision === 'CONFIRMED').map((r) => r.standardId)
    );
    const rejectedStdIds = new Set(
      standardReviews.filter((r) => r.decision === 'REJECTED').map((r) => r.standardId)
    );

    let activeMatches = (standardAnalysis?.matches || []).filter(
      (m) => !rejectedStdIds.has(m.standardId)
    );
    if (confirmedStdIds.size > 0) {
      activeMatches = activeMatches.filter((m) => confirmedStdIds.has(m.standardId));
    }

    const matchedStandards = activeMatches.map((m) => m.standard).filter(Boolean);


    const confirmedScheme = (certAnalysis?.schemeRecommendations || []).find(
      (r) => schemeReviews.find((rev) => rev.schemeId === r.schemeId)?.decision === 'CONFIRMED'
    );
    const targetScheme = confirmedScheme?.scheme || certAnalysis?.schemeRecommendations?.[0]?.scheme || null;

    // 4. Compute Hash and Check Cache
    const inputHash = computeTestingInputHash(
      product,
      matchedStandards,
      certAnalysis,
      attributes,
      TESTING_INTELLIGENCE_VERSION
    );

    if (!forceRefresh) {
      const cached = await prisma.productTestingAnalysis.findFirst({
        where: {
          productId,
          inputHash,
          status: 'COMPLETED',
          analysisVersion: TESTING_INTELLIGENCE_VERSION,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          requirements: {
            include: { standard: true, scheme: true, sourceDocument: true },
            orderBy: { rank: 'asc' },
          },
          equipment: { orderBy: { rank: 'asc' } },
          calibration: { orderBy: { rank: 'asc' } },
          laboratoryRequirements: {
            include: { scheme: true },
            orderBy: { rank: 'asc' },
          },
        },
      });

      if (cached) {
        return this.formatAnalysisResponse(cached, product, matchedStandards, userId);
      }
    }

    // 5. Audit log: Started
    await prisma.auditLog.create({
      data: {
        userId,
        productId,
        action: 'TESTING_ANALYSIS_STARTED',
        entityType: 'ProductTestingAnalysis',
        metadata: { inputHash, version: TESTING_INTELLIGENCE_VERSION },
      },
    });

    try {
      // 6. Extract Structured Intelligence
      const allRequirements: ProductTestRequirementItem[] = [];
      const allEquipment: ProductTestEquipmentItem[] = [];
      const allCalibration: ProductCalibrationRequirementItem[] = [];
      const allLabReqs: ProductExternalLabRequirementItem[] = [];

      for (const std of matchedStandards) {
        const productManual = await prisma.productManual.findFirst({
          where: { standardId: std.id },
          include: { sourceDocument: true },
        });

        const reqs = extractTestRequirements(std, targetScheme, productManual, std.sourceDocument);
        allRequirements.push(...reqs);

        const equip = extractEquipmentRequirements(std, productManual);
        allEquipment.push(...equip);

        const cal = extractCalibrationRequirements(std, productManual);
        allCalibration.push(...cal);

        const labReq = evaluateExternalLabRequirements(std, targetScheme, productManual);
        allLabReqs.push(...labReq);
      }

      // Load existing lab reviews
      const existingReviews = await this.getProductLaboratoryReviews(productId, userId);

      // Evaluate Readiness
      const readiness = evaluateTestingReadiness(
        allRequirements,
        allEquipment,
        allLabReqs,
        existingReviews
      );

      // 7. Persist Analysis in DB Transaction
      const savedAnalysis = await prisma.$transaction(async (tx) => {
        const created = await tx.productTestingAnalysis.create({
          data: {
            productId,
            certificationAnalysisId: certAnalysis?.id || null,
            status: 'COMPLETED',
            analysisVersion: TESTING_INTELLIGENCE_VERSION,
            inputHash,
            readinessStatus: readiness.status,
            readinessScore: readiness.score,
            readinessSummary: readiness.summary,
            blockers: readiness.blockers as any,
            nextSteps: readiness.nextSteps as any,
            completedAt: new Date(),
          },
        });

        // Insert Requirements
        for (let i = 0; i < allRequirements.length; i++) {
          const r = allRequirements[i];
          await tx.productTestRequirement.create({
            data: {
              analysisId: created.id,
              standardId: r.standardId,
              schemeId: r.schemeId || null,
              testName: r.testName,
              testCategory: r.testCategory,
              testMethod: r.testMethod || null,
              clause: r.clause || null,
              parameter: r.parameter || null,
              requirementValue: r.requirementValue ?? null,
              unit: r.unit || null,
              applicability: r.applicability,
              sourceDocumentId: r.sourceDocumentId || null,
              sourceUrl: r.sourceUrl || null,
              evidence: r.evidence as any,
              status: r.status,
              rank: i + 1,
            },
          });
        }

        // Insert Equipment
        for (let i = 0; i < allEquipment.length; i++) {
          const e = allEquipment[i];
          await tx.productTestEquipment.create({
            data: {
              analysisId: created.id,
              equipmentName: e.equipmentName,
              purpose: e.purpose,
              requiredStatus: e.requiredStatus,
              calibrationRequired: e.calibrationRequired,
              calibrationInterval: e.calibrationInterval || null,
              source: e.source || null,
              notes: e.notes || null,
              rank: i + 1,
            },
          });
        }

        // Insert Calibration Requirements
        for (let i = 0; i < allCalibration.length; i++) {
          const c = allCalibration[i];
          await tx.productCalibrationRequirement.create({
            data: {
              analysisId: created.id,
              equipmentName: c.equipmentName,
              parameterMeasured: c.parameterMeasured,
              traceabilityStandard: c.traceabilityStandard || null,
              calibrationInterval: c.calibrationInterval || null,
              calibrationAgencyType: c.calibrationAgencyType,
              source: c.source || null,
              notes: c.notes || null,
              rank: i + 1,
            },
          });
        }

        // Insert External Lab Requirements
        for (let i = 0; i < allLabReqs.length; i++) {
          const l = allLabReqs[i];
          await tx.productExternalLabRequirement.create({
            data: {
              analysisId: created.id,
              schemeId: l.schemeId || null,
              requirementType: l.requirementType,
              reason: l.reason,
              sampleSize: l.sampleSize || null,
              testingDuration: l.testingDuration || null,
              source: l.source || null,
              notes: l.notes || null,
              rank: i + 1,
            },
          });
        }

        return tx.productTestingAnalysis.findUnique({
          where: { id: created.id },
          include: {
            requirements: {
              include: { standard: true, scheme: true, sourceDocument: true },
              orderBy: { rank: 'asc' },
            },
            equipment: { orderBy: { rank: 'asc' } },
            calibration: { orderBy: { rank: 'asc' } },
            laboratoryRequirements: {
              include: { scheme: true },
              orderBy: { rank: 'asc' },
            },
          },
        });
      });

      // 8. Audit log: Completed
      await prisma.auditLog.create({
        data: {
          userId,
          productId,
          action: 'TESTING_ANALYSIS_COMPLETED',
          entityType: 'ProductTestingAnalysis',
          entityId: savedAnalysis?.id,
          metadata: {
            requirementsCount: allRequirements.length,
            equipmentCount: allEquipment.length,
            readinessScore: readiness.score,
          },
        },
      });

      return this.formatAnalysisResponse(savedAnalysis, product, matchedStandards, userId);
    } catch (err: any) {
      await prisma.auditLog.create({
        data: {
          userId,
          productId,
          action: 'TESTING_ANALYSIS_FAILED',
          entityType: 'ProductTestingAnalysis',
          metadata: { error: err.message },
        },
      });
      throw err;
    }
  }

  /**
   * Retrieves latest completed testing analysis for a product.
   */
  async getLatestTestingAnalysis(
    productId: string,
    userId: string
  ): Promise<ProductTestingAnalysisResponse | null> {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId, isActive: true },
    });

    if (!product) {
      throw AppError.notFound('Product not found or access denied');
    }

    const latest = await prisma.productTestingAnalysis.findFirst({
      where: { productId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      include: {
        requirements: {
          include: { standard: true, scheme: true, sourceDocument: true },
          orderBy: { rank: 'asc' },
        },
        equipment: { orderBy: { rank: 'asc' } },
        calibration: { orderBy: { rank: 'asc' } },
        laboratoryRequirements: {
          include: { scheme: true },
          orderBy: { rank: 'asc' },
        },
      },
    });

    if (!latest) {
      return null;
    }

    const standardIds = Array.from(new Set(latest.requirements.map((r) => r.standardId)));
    const standards = await prisma.standard.findMany({
      where: { id: { in: standardIds } },
    });

    return this.formatAnalysisResponse(latest, product, standards, userId);
  }

  /**
   * Retrieves test requirements with optional filtering.
   */
  async getTestRequirements(
    productId: string,
    userId: string,
    filters?: {
      standardId?: string;
      schemeId?: string;
      category?: TestCategory;
      status?: TestRequirementStatus;
    }
  ): Promise<ProductTestRequirementItem[]> {
    const analysis = await this.getLatestTestingAnalysis(productId, userId);
    if (!analysis) return [];

    let reqs = analysis.requirements;

    if (filters?.standardId) {
      reqs = reqs.filter((r) => r.standardId === filters.standardId);
    }
    if (filters?.schemeId) {
      reqs = reqs.filter((r) => r.schemeId === filters.schemeId);
    }
    if (filters?.category) {
      reqs = reqs.filter((r) => r.testCategory === filters.category);
    }
    if (filters?.status) {
      reqs = reqs.filter((r) => r.status === filters.status);
    }

    return reqs;
  }

  /**
   * Retrieves registered laboratories with capability match scoring and filters.
   */
  async getLaboratories(
    productId: string,
    userId: string,
    filters?: LaboratoryFilterParams
  ): Promise<LaboratoryMatchResult[]> {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId, isActive: true },
    });

    if (!product) {
      throw AppError.notFound('Product not found or access denied');
    }

    const analysis = await this.getLatestTestingAnalysis(productId, userId);
    let standardIds: string[] = [];
    let requirements: ProductTestRequirementItem[] = [];

    if (analysis) {
      standardIds = Array.from(new Set(analysis.requirements.map((r) => r.standardId)));
      requirements = analysis.requirements;
    } else {
      const stdAnalysis = await prisma.productStandardAnalysis.findFirst({
        where: { productId, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        include: { matches: { select: { standardId: true } } },
      });
      if (stdAnalysis) {
        standardIds = stdAnalysis.matches.map((m) => m.standardId);
      }
    }

    const standards = await prisma.standard.findMany({
      where: { id: { in: standardIds } },
    });

    const reviews = await this.getProductLaboratoryReviews(productId, userId);
    const reviewMap = new Map(reviews.map((r) => [r.laboratoryId, r]));

    const matches = await matchLaboratories(standards, requirements, filters);

    // Attach user reviews
    return matches.map((m) => {
      const userReview = reviewMap.get(m.laboratory.id) || null;
      return {
        ...m,
        laboratory: {
          ...m.laboratory,
          userReview,
        },
      };
    });
  }

  /**
   * Saves or updates a user laboratory review (Shortlist, Select, Reject, Needs Review).
   */
  async saveProductLaboratoryReview(
    productId: string,
    userId: string,
    input: CreateProductLaboratoryReviewInput
  ): Promise<ProductLaboratoryReviewItem> {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId, isActive: true },
    });

    if (!product) {
      throw AppError.notFound('Product not found or access denied');
    }

    const laboratory = await prisma.laboratory.findUnique({
      where: { id: input.laboratoryId },
    });

    if (!laboratory) {
      throw AppError.notFound('Laboratory not found');
    }

    // If selecting, unselect other labs for this product
    if (input.decision === 'SELECTED') {
      await prisma.productLaboratoryReview.updateMany({
        where: { productId, decision: 'SELECTED' },
        data: { decision: 'SHORTLISTED' },
      });
    }

    const review = await prisma.productLaboratoryReview.upsert({
      where: {
        productId_laboratoryId: {
          productId,
          laboratoryId: input.laboratoryId,
        },
      },
      create: {
        productId,
        laboratoryId: input.laboratoryId,
        userId,
        decision: input.decision,
        note: input.note || null,
      },
      update: {
        decision: input.decision,
        note: input.note !== undefined ? input.note : undefined,
      },
      include: { laboratory: true },
    });

    // Record Audit Log
    const actionName =
      input.decision === 'SHORTLISTED'
        ? 'LABORATORY_SHORTLISTED'
        : input.decision === 'SELECTED'
        ? 'LABORATORY_SELECTED'
        : 'LABORATORY_REVIEWED';

    await prisma.auditLog.create({
      data: {
        userId,
        productId,
        action: actionName,
        entityType: 'ProductLaboratoryReview',
        entityId: review.id,
        metadata: {
          laboratoryId: input.laboratoryId,
          laboratoryName: laboratory.name,
          decision: input.decision,
        },
      },
    });

    return {
      id: review.id,
      productId: review.productId,
      laboratoryId: review.laboratoryId,
      laboratoryName: laboratory.name,
      decision: review.decision,
      note: review.note,
      userId: review.userId,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
    };
  }

  /**
   * Retrieves laboratory reviews for a product.
   */
  async getProductLaboratoryReviews(
    productId: string,
    userId: string
  ): Promise<ProductLaboratoryReviewItem[]> {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId, isActive: true },
    });

    if (!product) {
      throw AppError.notFound('Product not found or access denied');
    }

    const reviews = await prisma.productLaboratoryReview.findMany({
      where: { productId },
      include: { laboratory: true },
      orderBy: { updatedAt: 'desc' },
    });

    return reviews.map((r) => ({
      id: r.id,
      productId: r.productId,
      laboratoryId: r.laboratoryId,
      laboratoryName: r.laboratory.name,
      decision: r.decision,
      note: r.note,
      userId: r.userId,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  /**
   * Helper to format database record into full response payload.
   */
  private async formatAnalysisResponse(
    record: any,
    product: any,
    standards: any[],
    userId: string
  ): Promise<ProductTestingAnalysisResponse> {
    const formattedReqs: ProductTestRequirementItem[] = (record.requirements || []).map(
      (r: any) => ({
        id: r.id,
        analysisId: r.analysisId,
        standardId: r.standardId,
        standardNumber: r.standard?.isNumber || '',
        standardTitle: r.standard?.title || '',
        schemeId: r.schemeId,
        schemeCode: r.scheme?.code || null,
        testName: r.testName,
        testCategory: r.testCategory,
        testMethod: r.testMethod,
        clause: r.clause,
        parameter: r.parameter,
        requirementValue: r.requirementValue,
        unit: r.unit,
        applicability: r.applicability,
        sourceDocumentId: r.sourceDocumentId,
        sourceUrl: r.sourceUrl || r.sourceDocument?.url || 'https://www.services.bis.gov.in',
        sourceTitle: r.sourceDocument?.title || 'BIS Official Publication',
        authorityLevel: r.sourceDocument?.authorityLevel || 'AUTHORITATIVE',
        evidence: r.evidence,
        status: r.status,
        rank: r.rank,
        createdAt: r.createdAt.toISOString(),
      })
    );

    const formattedEquip: ProductTestEquipmentItem[] = (record.equipment || []).map(
      (e: any) => ({
        id: e.id,
        analysisId: e.analysisId,
        equipmentName: e.equipmentName,
        purpose: e.purpose,
        requiredStatus: e.requiredStatus,
        calibrationRequired: e.calibrationRequired,
        calibrationInterval: e.calibrationInterval,
        source: e.source,
        notes: e.notes,
        rank: e.rank,
        createdAt: e.createdAt.toISOString(),
      })
    );

    const formattedCal: ProductCalibrationRequirementItem[] = (record.calibration || []).map(
      (c: any) => ({
        id: c.id,
        analysisId: c.analysisId,
        equipmentName: c.equipmentName,
        parameterMeasured: c.parameterMeasured,
        traceabilityStandard: c.traceabilityStandard,
        calibrationInterval: c.calibrationInterval,
        calibrationAgencyType: c.calibrationAgencyType,
        source: c.source,
        notes: c.notes,
        rank: c.rank,
        createdAt: c.createdAt.toISOString(),
      })
    );

    const formattedLabReqs: ProductExternalLabRequirementItem[] = (
      record.laboratoryRequirements || []
    ).map((l: any) => ({
      id: l.id,
      analysisId: l.analysisId,
      schemeId: l.schemeId,
      schemeCode: l.scheme?.code || null,
      requirementType: l.requirementType,
      reason: l.reason,
      sampleSize: l.sampleSize,
      testingDuration: l.testingDuration,
      source: l.source,
      notes: l.notes,
      rank: l.rank,
      createdAt: l.createdAt.toISOString(),
    }));

    // Match laboratories
    const matchedLabs = await matchLaboratories(standards, formattedReqs);
    const labReviews = await this.getProductLaboratoryReviews(product.id, userId);
    const reviewMap = new Map(labReviews.map((r) => [r.laboratoryId, r]));

    const labsWithReviews = matchedLabs.map((l) => ({
      ...l,
      laboratory: {
        ...l.laboratory,
        userReview: reviewMap.get(l.laboratory.id) || null,
      },
    }));

    const selectedLabReview = labReviews.find((r) => r.decision === 'SELECTED');
    const userSelectedLaboratory = selectedLabReview
      ? labsWithReviews.find((l) => l.laboratory.id === selectedLabReview.laboratoryId) || null
      : null;

    // Evaluate live readiness
    const readiness = evaluateTestingReadiness(
      formattedReqs,
      formattedEquip,
      formattedLabReqs,
      labReviews
    );

    // Collect Unique Sources
    const sourcesMap = new Map<string, any>();
    for (const r of formattedReqs) {
      if (r.sourceUrl) {
        sourcesMap.set(r.sourceUrl, {
          title: r.sourceTitle || 'BIS Official Publication',
          url: r.sourceUrl,
          authorityLevel: r.authorityLevel || 'AUTHORITATIVE',
          sourceType: 'BIS_OFFICIAL',
        });
      }
    }
    for (const l of labsWithReviews) {
      if (l.source?.url) {
        sourcesMap.set(l.source.url, {
          title: l.source.title || 'Laboratory Official Directory',
          url: l.source.url,
          authorityLevel: l.source.authorityLevel || 'AUTHORITATIVE',
          sourceType: 'BIS_OFFICIAL',
        });
      }
    }

    return {
      id: record.id,
      productId: product.id,
      certificationAnalysisId: record.certificationAnalysisId,
      status: record.status,
      analysisVersion: record.analysisVersion,
      inputHash: record.inputHash,
      readiness,
      requirements: formattedReqs,
      equipment: formattedEquip,
      calibration: formattedCal,
      laboratoryRequirements: formattedLabReqs,
      laboratories: labsWithReviews,
      userSelectedLaboratory,
      sources: Array.from(sourcesMap.values()),
      completedAt: record.completedAt?.toISOString() || null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}

export const testingIntelligenceService = new TestingIntelligenceService();
