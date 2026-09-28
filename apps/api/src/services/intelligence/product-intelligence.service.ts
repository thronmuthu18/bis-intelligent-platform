import crypto from 'crypto';
import { prisma } from '../../db/client.js';
import { executeHybridSearch } from '../rag/hybridSearch.js';
import { normalizeAttribute } from './normalizer.js';
import {
  generateCandidateQueries,
  ProductSearchProfile,
} from './query-generator.js';
import {
  rankCandidateStandards,
  RawCandidateStandard,
} from './matching-engine.js';
import { logger } from '../../config/logger.js';
import {
  ProductStandardAnalysisResponse,
  CandidateStandardMatchItem,
  AnalyzeProductInput,
  CreateProductReviewInput,
  UpsertProductAttributeInput,
  ProductAttribute,
  ProductStandardReviewItem,
  ReviewDecision,
  MatchLevel,
} from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Product Intelligence & Standard Matching Orchestrator (Phase 6)
// ─────────────────────────────────────────────────────────────────────────────

export const PRODUCT_INTELLIGENCE_VERSION = '1.0.0';

export class ProductIntelligenceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code: string = 'INTELLIGENCE_ERROR'
  ) {
    super(message);
    this.name = 'ProductIntelligenceError';
  }
}

/**
 * Computes deterministic SHA-256 hash of the normalized product profile.
 */
export function computeProfileInputHash(profile: ProductSearchProfile): string {
  const payload = {
    version: PRODUCT_INTELLIGENCE_VERSION,
    name: profile.name.trim().toLowerCase(),
    category: profile.category.trim().toLowerCase(),
    description: (profile.description || '').trim().toLowerCase(),
    intendedUse: (profile.intendedUse || '').trim().toLowerCase(),
    sector: (profile.sector || '').trim().toLowerCase(),
    material: (profile.material || '').trim().toLowerCase(),
    attributes: Object.entries(profile.attributes || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k.toLowerCase()}:${v.trim().toLowerCase()}`),
  };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex');
}

/**
 * Loads a product and constructs its structured search profile.
 */
export async function buildProductSearchProfile(
  productId: string,
  userId: string
): Promise<ProductSearchProfile> {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      userId,
      isActive: true,
    },
    include: {
      attributes: true,
    },
  });

  if (!product) {
    throw new ProductIntelligenceError(
      'Product not found or access denied.',
      404,
      'NOT_FOUND'
    );
  }

  const attributesMap: Record<string, string> = {};
  if (product.attributes) {
    for (const attr of product.attributes) {
      attributesMap[attr.attributeKey] = attr.attributeValue;
    }
  }

  return {
    productId: product.id,
    name: product.name,
    category: product.category,
    description: product.description || undefined,
    intendedUse: product.intendedUse || undefined,
    sector: product.productCategory || undefined,
    material: attributesMap.material || attributesMap.composition || undefined,
    application: attributesMap.application || undefined,
    attributes: attributesMap,
    normalizedTokens: [],
  };
}

/**
 * Executes or retrieves candidate standard analysis for a product profile.
 */
export async function analyzeProductStandards(
  productId: string,
  userId: string,
  input: AnalyzeProductInput = {}
): Promise<ProductStandardAnalysisResponse> {
  const startTime = Date.now();
  const profile = await buildProductSearchProfile(productId, userId);
  const inputHash = computeProfileInputHash(profile);

  // 1. Check for valid cached analysis if forceRefresh is false
  if (!input.forceRefresh) {
    const existingAnalysis = await prisma.productStandardAnalysis.findFirst({
      where: {
        productId,
        inputHash,
        status: 'COMPLETED',
        analysisVersion: PRODUCT_INTELLIGENCE_VERSION,
      },
      include: {
        matches: {
          include: {
            standard: {
              include: {
                sourceDocument: true,
                qcoMappings: {
                  include: {
                    qco: true,
                  },
                },
              },
            },
          },
          orderBy: {
            rank: 'asc',
          },
        },
      },
    });

    if (existingAnalysis && existingAnalysis.matches.length > 0) {
      // Fetch user reviews
      const userReviews = await prisma.productStandardReview.findMany({
        where: { productId },
      });
      const reviewMap = new Map<string, (typeof userReviews)[0]>();
      userReviews.forEach((r) => reviewMap.set(r.standardId, r));

      const candidateStandards: CandidateStandardMatchItem[] = existingAnalysis.matches.map((m) => {
        const std = m.standard;
        const rev = reviewMap.get(std.id);

        return {
          id: m.id,
          standardId: std.id,
          isNumber: std.isNumber,
          canonicalNumber: std.canonicalNumber,
          title: std.title,
          shortTitle: std.shortTitle,
          scope: std.scope,
          status: std.status,
          sector: std.sector,
          department: std.department,
          currentEdition: std.currentEdition,
          relevanceScore: m.relevanceScore,
          matchLevel: m.matchLevel as MatchLevel,
          rank: m.rank,
          reasons: (m.reasons as string[]) || [],
          evidence: (m.evidence as any) || undefined,
          sourceDocument: std.sourceDocument
            ? {
                title: std.sourceDocument.title,
                url: std.sourceDocument.url,
                authorityLevel: std.sourceDocument.authorityLevel,
              }
            : null,
          userReview: rev
            ? {
                decision: rev.decision as ReviewDecision,
                note: rev.note,
                updatedAt: rev.updatedAt.toISOString(),
              }
            : null,
        };
      });

      return {
        analysisId: existingAnalysis.id,
        productId,
        status: 'COMPLETED',
        analysisVersion: existingAnalysis.analysisVersion,
        inputHash: existingAnalysis.inputHash,
        candidateStandards,
        totalCandidates: candidateStandards.length,
        generatedAt: existingAnalysis.createdAt.toISOString(),
        fromCache: true,
        productProfile: {
          name: profile.name,
          category: profile.category,
          sector: profile.sector,
          material: profile.material,
          intendedUse: profile.intendedUse,
          application: profile.application,
          attributes: profile.attributes,
        },
        meta: {
          querySignalsUsed: [],
          durationMs: Date.now() - startTime,
        },
      };
    }
  }

  // 2. Generate Retrieval Query Signals
  const queryGen = generateCandidateQueries(profile);
  const candidateMap = new Map<string, RawCandidateStandard>();

  // 3. Execute Phase 5 Hybrid Retrieval for Each Query Signal
  for (const q of queryGen.queries) {
    try {
      const searchRes = await executeHybridSearch({
        q,
        mode: 'hybrid',
        limit: 15,
        page: 1,
      });

      for (const res of searchRes.results) {
        if (!candidateMap.has(res.id)) {
          // Fetch full standard with QCO mappings & source document
          const fullStd = await prisma.standard.findUnique({
            where: { id: res.id },
            include: {
              sourceDocument: true,
              qcoMappings: {
                include: {
                  qco: true,
                },
              },
            },
          });

          if (fullStd) {
            candidateMap.set(res.id, {
              id: fullStd.id,
              isNumber: fullStd.isNumber,
              canonicalNumber: fullStd.canonicalNumber,
              title: fullStd.title,
              shortTitle: fullStd.shortTitle,
              scope: fullStd.scope,
              status: fullStd.status,
              sector: fullStd.sector,
              department: fullStd.department,
              currentEdition: fullStd.currentEdition,
              sourceDocument: fullStd.sourceDocument
                ? {
                    title: fullStd.sourceDocument.title,
                    url: fullStd.sourceDocument.url,
                    authorityLevel: fullStd.sourceDocument.authorityLevel,
                  }
                : null,
              qcoMappings: fullStd.qcoMappings,
              retrievalScore: res.relevanceScore,
              matchedChunks: res.matchedChunks,
            });
          }
        }
      }
    } catch (err) {
      logger.warn(`Query retrieval error for signal "${q}": ${err}`);
    }
  }

  // 4. Run Matching & Ranking Engine
  const rawCandidates = Array.from(candidateMap.values());
  const rankedMatches = rankCandidateStandards(rawCandidates, queryGen.profile);

  // 5. Persist Analysis and Matches in Transaction
  const analysisRecord = await prisma.productStandardAnalysis.create({
    data: {
      productId,
      status: 'COMPLETED',
      analysisVersion: PRODUCT_INTELLIGENCE_VERSION,
      inputHash,
      completedAt: new Date(),
    },
  });

  if (rankedMatches.length > 0) {
    for (const match of rankedMatches) {
      await prisma.productStandardMatch.create({
        data: {
          analysisId: analysisRecord.id,
          standardId: match.standardId,
          relevanceScore: match.relevanceScore,
          matchLevel: match.matchLevel,
          reasons: match.reasons,
          evidence: match.evidence ? JSON.parse(JSON.stringify(match.evidence)) : undefined,
          rank: match.rank,
        },
      });
    }
  }

  // 6. Fetch User Reviews for this Product
  const userReviews = await prisma.productStandardReview.findMany({
    where: { productId },
  });
  const reviewMap = new Map<string, (typeof userReviews)[0]>();
  userReviews.forEach((r) => reviewMap.set(r.standardId, r));

  const candidateStandards: CandidateStandardMatchItem[] = rankedMatches.map((m) => {
    const rev = reviewMap.get(m.standardId);
    return {
      ...m,
      userReview: rev
        ? {
            decision: rev.decision as ReviewDecision,
            note: rev.note,
            updatedAt: rev.updatedAt.toISOString(),
          }
        : null,
    };
  });

  return {
    analysisId: analysisRecord.id,
    productId,
    status: 'COMPLETED',
    analysisVersion: PRODUCT_INTELLIGENCE_VERSION,
    inputHash,
    candidateStandards,
    totalCandidates: candidateStandards.length,
    generatedAt: analysisRecord.createdAt.toISOString(),
    fromCache: false,
    productProfile: {
      name: profile.name,
      category: profile.category,
      sector: profile.sector,
      material: profile.material,
      intendedUse: profile.intendedUse,
      application: profile.application,
      attributes: profile.attributes,
    },
    meta: {
      querySignalsUsed: queryGen.queries,
      durationMs: Date.now() - startTime,
    },
  };
}

/**
 * Retrieves existing product standard review decisions made by the user.
 */
export async function getProductStandardReviews(
  productId: string,
  userId: string
): Promise<ProductStandardReviewItem[]> {
  const product = await prisma.product.findFirst({
    where: { id: productId, userId, isActive: true },
  });

  if (!product) {
    throw new ProductIntelligenceError('Product not found or access denied.', 404);
  }

  const reviews = await prisma.productStandardReview.findMany({
    where: { productId },
    include: {
      standard: {
        select: {
          isNumber: true,
          title: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return reviews.map((r) => ({
    id: r.id,
    productId: r.productId,
    standardId: r.standardId,
    decision: r.decision as ReviewDecision,
    note: r.note,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    standard: r.standard,
  }));
}

/**
 * Creates or updates a user confirmation review decision for a standard.
 */
export async function saveProductStandardReview(
  productId: string,
  userId: string,
  input: CreateProductReviewInput
): Promise<ProductStandardReviewItem> {
  const product = await prisma.product.findFirst({
    where: { id: productId, userId, isActive: true },
  });

  if (!product) {
    throw new ProductIntelligenceError('Product not found or access denied.', 404);
  }

  const standard = await prisma.standard.findUnique({
    where: { id: input.standardId },
  });

  if (!standard) {
    throw new ProductIntelligenceError('Indian Standard not found.', 404);
  }

  const review = await prisma.productStandardReview.upsert({
    where: {
      productId_standardId: {
        productId,
        standardId: input.standardId,
      },
    },
    create: {
      productId,
      standardId: input.standardId,
      decision: input.decision,
      note: input.note,
    },
    update: {
      decision: input.decision,
      note: input.note,
    },
    include: {
      standard: {
        select: {
          isNumber: true,
          title: true,
        },
      },
    },
  });

  return {
    id: review.id,
    productId: review.productId,
    standardId: review.standardId,
    decision: review.decision as ReviewDecision,
    note: review.note,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
    standard: review.standard,
  };
}

/**
 * Lists structured product attributes.
 */
export async function getProductAttributes(
  productId: string,
  userId: string
): Promise<ProductAttribute[]> {
  const product = await prisma.product.findFirst({
    where: { id: productId, userId, isActive: true },
    include: {
      attributes: {
        orderBy: { attributeKey: 'asc' },
      },
    },
  });

  if (!product) {
    throw new ProductIntelligenceError('Product not found or access denied.', 404);
  }

  return (product.attributes || []).map((a) => ({
    id: a.id,
    productId: a.productId,
    attributeKey: a.attributeKey,
    attributeValue: a.attributeValue,
    normalizedValue: a.normalizedValue,
    source: a.source as any,
    confidence: a.confidence,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));
}

/**
 * Upserts structured product attributes.
 */
export async function upsertProductAttributes(
  productId: string,
  userId: string,
  attributes: UpsertProductAttributeInput[]
): Promise<ProductAttribute[]> {
  const product = await prisma.product.findFirst({
    where: { id: productId, userId, isActive: true },
  });

  if (!product) {
    throw new ProductIntelligenceError('Product not found or access denied.', 404);
  }

  const results: ProductAttribute[] = [];

  for (const attr of attributes) {
    const norm = normalizeAttribute(attr.attributeValue);

    const record = await prisma.productAttribute.upsert({
      where: {
        productId_attributeKey: {
          productId,
          attributeKey: attr.attributeKey,
        },
      },
      create: {
        productId,
        attributeKey: attr.attributeKey,
        attributeValue: attr.attributeValue,
        normalizedValue: norm.normalizedValue,
        source: attr.source || 'USER',
        confidence: attr.confidence !== undefined ? attr.confidence : 1.0,
      },
      update: {
        attributeValue: attr.attributeValue,
        normalizedValue: norm.normalizedValue,
        source: attr.source || 'USER',
        confidence: attr.confidence !== undefined ? attr.confidence : 1.0,
      },
    });

    results.push({
      id: record.id,
      productId: record.productId,
      attributeKey: record.attributeKey,
      attributeValue: record.attributeValue,
      normalizedValue: record.normalizedValue,
      source: record.source as any,
      confidence: record.confidence,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    });
  }

  return results;
}
