import { createHash } from 'crypto';
import { prisma } from '../../db/client.js';
import { AppError } from '../../utils/AppError.js';
import { analyzeProductStandards } from '../intelligence/product-intelligence.service.js';
import {
  resolveCandidateSchemes,
  extractQcoInformation,
} from './scheme-resolver.js';
import {
  buildDocumentationChecklist,
  buildApplicationRequirements,
} from './checklist-builder.js';
import {
  buildFeeEstimates,
  evaluateCertificationReadiness,
} from './fee-calculator.js';
import type {
  ProductCertificationAnalysisResponse,
  ProductSchemeRecommendationItem,
  ProductSchemeReviewItem,
  SchemeDetailResponse,
  ReviewDecision,
} from '@bis/shared';

export const CERTIFICATION_INTELLIGENCE_VERSION = '1.0.0';

/**
 * Computes a deterministic SHA-256 hash representing all certification inputs.
 */
export function computeCertificationInputHash(
  product: any,
  matchedStandards: any[],
  attributes: any[],
  version: string = CERTIFICATION_INTELLIGENCE_VERSION
): string {
  const normProduct = {
    id: product.id,
    name: product.name?.trim().toLowerCase() || '',
    category: product.category?.trim().toLowerCase() || '',
    intendedUse: product.intendedUse?.trim().toLowerCase() || '',
    manufacturerName: product.manufacturerName?.trim().toLowerCase() || '',
    manufacturerAddress: product.manufacturerAddress?.trim().toLowerCase() || '',
    targetMarket: product.targetMarket?.trim().toLowerCase() || '',
  };

  const normAttributes = (attributes || [])
    .map((a: any) => ({
      key: a.attributeKey?.trim().toLowerCase() || '',
      val: a.normalizedValue || a.attributeValue?.trim().toLowerCase() || '',
    }))
    .sort((a: any, b: any) => a.key.localeCompare(b.key));

  const standardIds = (matchedStandards || [])
    .map((s: any) => (s.standardId || s.id || s.standard?.id))
    .filter(Boolean)
    .sort();

  const payload = JSON.stringify({
    version,
    product: normProduct,
    attributes: normAttributes,
    standardIds,
  });

  return createHash('sha256').update(payload).digest('hex');
}

/**
 * Certification Intelligence Service
 */
export class CertificationIntelligenceService {
  /**
   * Executes or retrieves cached certification analysis for a product.
   */
  async analyzeProductCertification(
    productId: string,
    userId: string,
    forceRefresh: boolean = false
  ): Promise<ProductCertificationAnalysisResponse> {
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

    // 2. Load latest standard analysis (or run if none exists)
    let standardAnalysis = await prisma.productStandardAnalysis.findFirst({
      where: {
        productId,
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        matches: {
          orderBy: { rank: 'asc' },
          include: {
            standard: {
              include: {
                sourceDocument: true,
                qcoMappings: {
                  include: {
                    qco: {
                      include: { sourceDocument: true },
                    },
                  },
                },
                schemeMappings: {
                  include: {
                    scheme: {
                      include: { sourceDocument: true },
                    },
                    sourceDocument: true,
                  },
                },
                productManuals: {
                  include: { sourceDocument: true },
                },
              },
            },
          },
        },
      },
    });

    if (!standardAnalysis || standardAnalysis.matches.length === 0) {
      // Trigger standard analysis first if needed
      await analyzeProductStandards(productId, userId, { forceRefresh: false });
      standardAnalysis = await prisma.productStandardAnalysis.findFirst({
        where: {
          productId,
          status: 'COMPLETED',
        },
        orderBy: { createdAt: 'desc' },
        include: {
          matches: {
            orderBy: { rank: 'asc' },
            include: {
              standard: {
                include: {
                  sourceDocument: true,
                  qcoMappings: {
                    include: {
                      qco: {
                        include: { sourceDocument: true },
                      },
                    },
                  },
                  schemeMappings: {
                    include: {
                      scheme: {
                        include: { sourceDocument: true },
                      },
                      sourceDocument: true,
                    },
                  },
                  productManuals: {
                    include: { sourceDocument: true },
                  },
                },
              },
            },
          },
        },
      });
    }

    const matchedStandards = (standardAnalysis?.matches || []).map((m: any) => m.standard).filter(Boolean);

    // 3. Compute input hash
    const inputHash = computeCertificationInputHash(product, matchedStandards, attributes);

    // 4. Check Cache
    if (!forceRefresh) {
      const cached = await prisma.productCertificationAnalysis.findFirst({
        where: {
          productId,
          inputHash,
          status: 'COMPLETED',
          analysisVersion: CERTIFICATION_INTELLIGENCE_VERSION,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          schemeRecommendations: {
            orderBy: { rank: 'asc' },
            include: {
              scheme: {
                include: { sourceDocument: true },
              },
              standard: {
                include: { sourceDocument: true },
              },
            },
          },
          feeEstimates: true,
          documentationChecklist: {
            orderBy: { rank: 'asc' },
          },
          applicationRequirements: {
            orderBy: { rank: 'asc' },
          },
          qcoInformation: {
            include: {
              qco: true,
              standard: true,
            },
          },
        },
      });

      if (cached) {
        return this.formatCertificationResponse(cached, product, matchedStandards, true, userId);
      }
    }

    // 5. Execute Analysis
    const resolvedSchemes = resolveCandidateSchemes(product, matchedStandards);
    const qcoItems = extractQcoInformation(matchedStandards);
    const documentation = buildDocumentationChecklist(product, matchedStandards, resolvedSchemes);
    const appRequirements = buildApplicationRequirements(resolvedSchemes);
    const feeEstimates = buildFeeEstimates(resolvedSchemes);
    const readiness = evaluateCertificationReadiness(
      product,
      matchedStandards,
      resolvedSchemes,
      documentation
    );

    // 6. Persist Analysis Record
    const createdAnalysis = await prisma.$transaction(async (tx: any) => {
      const analysis = await tx.productCertificationAnalysis.create({
        data: {
          productId,
          productStandardAnalysisId: standardAnalysis?.id || null,
          status: 'COMPLETED',
          analysisVersion: CERTIFICATION_INTELLIGENCE_VERSION,
          inputHash,
          readinessStatus: readiness.status,
          readinessScore: readiness.score,
          readinessSummary: readiness.summary,
          completedAt: new Date(),
        },
      });

      // Persist Scheme Recommendations
      for (const schemeItem of resolvedSchemes) {
        await tx.productSchemeRecommendation.create({
          data: {
            analysisId: analysis.id,
            schemeId: schemeItem.schemeId,
            standardId: schemeItem.standardId,
            relevanceLevel: schemeItem.relevanceLevel,
            confidenceScore: schemeItem.confidenceScore,
            reasons: schemeItem.reasons,
            evidence: schemeItem.evidence,
            rank: schemeItem.rank,
          },
        });
      }

      // Persist Fee Estimates
      for (const fee of feeEstimates) {
        await tx.certificationFeeEstimate.create({
          data: {
            analysisId: analysis.id,
            schemeId: fee.schemeId,
            feeType: fee.feeType,
            amount: fee.amount,
            currency: fee.currency,
            status: fee.status,
            source: fee.source,
            effectiveDate: fee.effectiveDate,
            notes: fee.notes,
          },
        });
      }

      // Persist Documentation Checklist
      for (const doc of documentation) {
        await tx.productDocumentationChecklistItem.create({
          data: {
            analysisId: analysis.id,
            schemeId: doc.schemeId,
            category: doc.category,
            documentName: doc.documentName,
            requiredStatus: doc.requiredStatus,
            reason: doc.reason,
            source: doc.source,
            notes: doc.notes,
            rank: doc.rank,
          },
        });
      }

      // Persist Application Requirements
      for (const req of appRequirements) {
        await tx.productApplicationRequirementItem.create({
          data: {
            analysisId: analysis.id,
            schemeId: req.schemeId,
            formName: req.formName,
            formPurpose: req.formPurpose,
            applicableScheme: req.applicableScheme,
            source: req.source,
            officialUrl: req.officialUrl,
            rank: req.rank,
          },
        });
      }

      // Persist QCO Information Items
      for (const qco of qcoItems) {
        await tx.productQcoInformationItem.create({
          data: {
            analysisId: analysis.id,
            qcoId: qco.qcoId,
            standardId: qco.standardId,
            qcoTitle: qco.qcoTitle,
            orderNumber: qco.orderNumber,
            issuingAuthority: qco.issuingAuthority,
            notificationDate: qco.notificationDate ? new Date(qco.notificationDate) : null,
            effectiveDate: qco.effectiveDate ? new Date(qco.effectiveDate) : null,
            sourceUrl: qco.sourceUrl,
            status: qco.status,
            isMandatory: qco.isMandatory,
            notes: qco.notes,
          },
        });
      }

      return tx.productCertificationAnalysis.findUnique({
        where: { id: analysis.id },
        include: {
          schemeRecommendations: {
            orderBy: { rank: 'asc' },
            include: {
              scheme: {
                include: { sourceDocument: true },
              },
              standard: {
                include: { sourceDocument: true },
              },
            },
          },
          feeEstimates: true,
          documentationChecklist: {
            orderBy: { rank: 'asc' },
          },
          applicationRequirements: {
            orderBy: { rank: 'asc' },
          },
          qcoInformation: {
            include: {
              qco: true,
              standard: true,
            },
          },
        },
      });
    });

    return this.formatCertificationResponse(createdAnalysis, product, matchedStandards, false, userId);
  }

  /**
   * Retrieves the latest certification analysis for a product.
   */
  async getLatestCertificationAnalysis(
    productId: string,
    userId: string
  ): Promise<ProductCertificationAnalysisResponse | null> {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId, isActive: true },
    });

    if (!product) {
      throw AppError.notFound('Product not found or access denied');
    }

    const latest = await prisma.productCertificationAnalysis.findFirst({
      where: {
        productId,
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        schemeRecommendations: {
          orderBy: { rank: 'asc' },
          include: {
            scheme: {
              include: { sourceDocument: true },
            },
            standard: {
              include: { sourceDocument: true },
            },
          },
        },
        feeEstimates: true,
        documentationChecklist: {
          orderBy: { rank: 'asc' },
        },
        applicationRequirements: {
          orderBy: { rank: 'asc' },
        },
        qcoInformation: {
          include: {
            qco: true,
            standard: true,
          },
        },
      },
    });

    if (!latest) return null;

    const matchedStandards = (latest.schemeRecommendations || [])
      .map((r: any) => r.standard)
      .filter(Boolean);

    return this.formatCertificationResponse(latest, product, matchedStandards, true, userId);
  }

  /**
   * Saves or updates a user's scheme review decision (CONFIRMED, REJECTED, NEEDS_REVIEW).
   */
  async saveProductSchemeReview(
    productId: string,
    userId: string,
    schemeId: string,
    decision: ReviewDecision,
    note?: string
  ): Promise<ProductSchemeReviewItem> {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId, isActive: true },
    });

    if (!product) {
      throw AppError.notFound('Product not found or access denied');
    }

    const scheme = await prisma.scheme.findUnique({
      where: { id: schemeId },
    });

    if (!scheme) {
      throw AppError.notFound('Conformity assessment scheme not found');
    }

    const review = await prisma.productSchemeReview.upsert({
      where: {
        productId_schemeId: {
          productId,
          schemeId,
        },
      },
      create: {
        productId,
        schemeId,
        decision,
        note: note || null,
      },
      update: {
        decision,
        note: note || null,
      },
    });

    return {
      id: review.id,
      productId: review.productId,
      schemeId: review.schemeId,
      decision: review.decision as ReviewDecision,
      note: review.note,
      createdAt: typeof review.createdAt === 'string' ? review.createdAt : review.createdAt.toISOString(),
      updatedAt: typeof review.updatedAt === 'string' ? review.updatedAt : review.updatedAt.toISOString(),
    };
  }

  /**
   * Retrieves user scheme reviews for a product.
   */
  async getProductSchemeReviews(productId: string, userId: string): Promise<ProductSchemeReviewItem[]> {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId, isActive: true },
    });

    if (!product) {
      throw AppError.notFound('Product not found or access denied');
    }

    const reviews = await prisma.productSchemeReview.findMany({
      where: { productId },
      orderBy: { updatedAt: 'desc' },
    });

    return reviews.map((r: any) => ({
      id: r.id,
      productId: r.productId,
      schemeId: r.schemeId,
      decision: r.decision as ReviewDecision,
      note: r.note,
      createdAt: typeof r.createdAt === 'string' ? r.createdAt : r.createdAt.toISOString(),
      updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : r.updatedAt.toISOString(),
    }));
  }

  /**
   * Retrieves comprehensive breakdown for a specific scheme and product.
   */
  async getSchemeDetail(
    productId: string,
    userId: string,
    schemeId: string
  ): Promise<SchemeDetailResponse> {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId, isActive: true },
    });

    if (!product) {
      throw AppError.notFound('Product not found or access denied');
    }

    const scheme = await prisma.scheme.findUnique({
      where: { id: schemeId },
      include: {
        sourceDocument: true,
        standardMappings: {
          include: {
            standard: {
              include: {
                sourceDocument: true,
                productManuals: true,
                qcoMappings: {
                  include: {
                    qco: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!scheme) {
      throw AppError.notFound('Conformity assessment scheme not found');
    }

    const associatedStandards = (scheme.standardMappings || []).map((m: any) => ({
      id: m.standard.id,
      isNumber: m.standard.isNumber,
      title: m.standard.title,
      notes: m.notes || null,
    }));

    const productManuals: any[] = [];
    const qcos: any[] = [];
    for (const m of scheme.standardMappings || []) {
      if (m.standard?.productManuals) {
        for (const pm of m.standard.productManuals) {
          productManuals.push({
            id: pm.id,
            title: pm.title,
            version: pm.version || null,
            documentUrl: pm.documentUrl || null,
          });
        }
      }
      if (m.standard?.qcoMappings) {
        for (const qm of m.standard.qcoMappings) {
          if (qm.qco) {
            qcos.push({
              id: qm.qco.id,
              name: qm.qco.name,
              orderNumber: qm.qco.orderNumber,
              ministry: qm.qco.ministry || null,
              effectiveDate: qm.qco.effectiveDate ? new Date(qm.qco.effectiveDate).toISOString() : null,
            });
          }
        }
      }
    }

    const resolvedDummy = [
      {
        schemeId: scheme.id,
        schemeCode: scheme.code,
        schemeName: scheme.name,
      },
    ];

    const documentation = buildDocumentationChecklist(product, associatedStandards, resolvedDummy);
    const applicationRequirements = buildApplicationRequirements(resolvedDummy);
    const fees = buildFeeEstimates(resolvedDummy);

    const sourceEvidence: any[] = [];
    if (scheme.sourceDocument && scheme.sourceDocument.authorityLevel !== 'UNVERIFIED') {
      sourceEvidence.push({
        title: scheme.sourceDocument.title,
        url: scheme.sourceDocument.url,
        authorityLevel: scheme.sourceDocument.authorityLevel,
      });
    }

    return {
      scheme: {
        id: scheme.id,
        code: scheme.code,
        name: scheme.name,
        description: scheme.description || null,
      },
      associatedStandards,
      productManuals,
      qcos,
      documentation,
      applicationRequirements,
      fees,
      sourceEvidence,
    };
  }

  /**
   * Formats raw Prisma records into a standardized API response.
   */
  private async formatCertificationResponse(
    analysisRecord: any,
    product: any,
    _matchedStandards: any[],
    fromCache: boolean,
    userId: string
  ): Promise<ProductCertificationAnalysisResponse> {
    const userReviews = await this.getProductSchemeReviews(product.id, userId);
    const reviewMap = new Map<string, ProductSchemeReviewItem>(
      userReviews.map((r) => [r.schemeId, r])
    );

    const schemes: ProductSchemeRecommendationItem[] = (
      analysisRecord.schemeRecommendations || []
    ).map((rec: any) => {
      const userReview = reviewMap.get(rec.schemeId) || null;
      const reasons = Array.isArray(rec.reasons) ? rec.reasons : [];
      const evidence = typeof rec.evidence === 'object' ? rec.evidence : null;

      return {
        id: rec.id,
        schemeId: rec.schemeId,
        standardId: rec.standardId,
        schemeCode: rec.scheme?.code || 'SCHEME_I_ISI',
        schemeName: rec.scheme?.name || 'Scheme-I (ISI Mark)',
        schemeDescription: rec.scheme?.description || null,
        standardIsNumber: rec.standard?.isNumber || '',
        standardTitle: rec.standard?.title || '',
        relevanceLevel: rec.relevanceLevel,
        confidenceScore: rec.confidenceScore,
        reasons,
        evidence,
        rank: rec.rank,
        userReview,
      };
    });

    const documentation = (analysisRecord.documentationChecklist || []).map((d: any) => ({
      id: d.id,
      schemeId: d.schemeId,
      category: d.category,
      documentName: d.documentName,
      requiredStatus: d.requiredStatus,
      reason: d.reason,
      source: d.source,
      notes: d.notes,
      rank: d.rank,
    }));

    const applicationRequirements = (analysisRecord.applicationRequirements || []).map((a: any) => ({
      id: a.id,
      schemeId: a.schemeId,
      formName: a.formName,
      formPurpose: a.formPurpose,
      applicableScheme: a.applicableScheme,
      source: a.source,
      officialUrl: a.officialUrl,
      rank: a.rank,
    }));

    const fees = (analysisRecord.feeEstimates || []).map((f: any) => ({
      id: f.id,
      schemeId: f.schemeId,
      feeType: f.feeType,
      amount: f.amount,
      currency: f.currency,
      status: f.status,
      source: f.source,
      effectiveDate: f.effectiveDate,
      notes: f.notes,
    }));

    const qcoInformation = (analysisRecord.qcoInformation || []).map((q: any) => ({
      id: q.id,
      qcoId: q.qcoId,
      standardId: q.standardId,
      qcoTitle: q.qcoTitle,
      orderNumber: q.orderNumber,
      issuingAuthority: q.issuingAuthority,
      notificationDate: q.notificationDate ? new Date(q.notificationDate).toISOString() : null,
      effectiveDate: q.effectiveDate ? new Date(q.effectiveDate).toISOString() : null,
      sourceUrl: q.sourceUrl,
      status: q.status,
      isMandatory: q.isMandatory,
      notes: q.notes,
    }));

    // Collect Unique Authoritative Sources
    const sourceMap = new Map<string, any>();
    for (const rec of schemes) {
      if (rec.evidence?.sourceDocument) {
        sourceMap.set(rec.evidence.sourceDocument.url, rec.evidence.sourceDocument);
      }
    }
    for (const qco of qcoInformation) {
      if (qco.sourceUrl) {
        sourceMap.set(qco.sourceUrl, {
          title: `Government Gazette — ${qco.qcoTitle}`,
          url: qco.sourceUrl,
          authorityLevel: 'AUTHORITATIVE',
          sourceType: 'GOVERNMENT_GAZETTE',
        });
      }
    }
    for (const req of applicationRequirements) {
      if (req.officialUrl) {
        sourceMap.set(req.officialUrl, {
          title: `Official BIS Portal — ${req.applicableScheme}`,
          url: req.officialUrl,
          authorityLevel: 'AUTHORITATIVE',
          sourceType: 'BIS_OFFICIAL',
        });
      }
    }

    const sources = Array.from(sourceMap.values());

    const readiness = {
      status: analysisRecord.readinessStatus,
      score: analysisRecord.readinessScore,
      summary: analysisRecord.readinessSummary || 'Certification readiness evaluation completed.',
      blockers: [] as string[],
      recommendations: [
        'Review and confirm candidate scheme applicability.',
        'Compile statutory document checklist items for verification.',
      ],
    };

    return {
      analysisId: analysisRecord.id,
      productId: analysisRecord.productId,
      productStandardAnalysisId: analysisRecord.productStandardAnalysisId,
      status: analysisRecord.status,
      analysisVersion: analysisRecord.analysisVersion,
      inputHash: analysisRecord.inputHash,
      generatedAt: typeof analysisRecord.createdAt === 'string'
        ? analysisRecord.createdAt
        : analysisRecord.createdAt.toISOString(),
      fromCache,
      schemes,
      qcoInformation,
      documentation,
      applicationRequirements,
      fees,
      readiness,
      sources,
    };
  }
}

export const certificationIntelligenceService = new CertificationIntelligenceService();
