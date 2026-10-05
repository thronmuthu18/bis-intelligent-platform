import { prisma } from '../db/client.js';
import { Prisma } from '@prisma/client';
import { normalizeIsNumber } from './ingestion/normalizer.js';
import { tokenizeSearchQuery } from './intelligence/normalizer.js';
import { BIS_TECHNICAL_DIVISIONS, getCompatibleBisSectors } from './intelligence/category-sector-mapper.js';
import { AppError } from '../utils/AppError.js';
import {
  API_ERROR_CODES,
  StandardSearchParams,
  StandardListResponse,
  StandardDetailResponse,
  StandardStatus,
} from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  BIS Knowledge Layer — Standards Query & Search Service
// ─────────────────────────────────────────────────────────────────────────────

const MAX_PAGE_LIMIT = 50;
const DEFAULT_PAGE_LIMIT = 10;

/**
 * Searches and lists Indian Standards with tokenized filtering, synonym expansion, and pagination.
 */
export async function searchStandards(params: StandardSearchParams): Promise<StandardListResponse> {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, Number(params.limit) || DEFAULT_PAGE_LIMIT));
  const skip = (page - 1) * limit;

  // 1. Resolve Sector mapping
  let sectorFilter: Prisma.StandardWhereInput | undefined = undefined;
  if (params.sector) {
    const rawSector = params.sector.trim();
    const isDirectDivision = BIS_TECHNICAL_DIVISIONS.some(
      (div) => div.toLowerCase() === rawSector.toLowerCase()
    );

    if (isDirectDivision) {
      sectorFilter = {
        sector: { contains: rawSector, mode: Prisma.QueryMode.insensitive },
      };
    } else {
      const compatible = getCompatibleBisSectors(rawSector);
      if (compatible.length > 0) {
        sectorFilter = {
          OR: [
            { sector: { contains: rawSector, mode: Prisma.QueryMode.insensitive } },
            ...compatible.map((sec) => ({ sector: { contains: sec, mode: Prisma.QueryMode.insensitive } })),
          ],
        };
      } else {
        sectorFilter = {
          sector: { contains: rawSector, mode: Prisma.QueryMode.insensitive },
        };
      }
    }
  }

  // 2. Build Where Clause Builder (allows fallback if sector filter is too restrictive)
  const buildWhere = (includeSector = true): Prisma.StandardWhereInput => {
    const where: Prisma.StandardWhereInput = {
      isActive: true,
    };

    if (params.status) {
      where.status = params.status as StandardStatus;
    }

    const andConditions: Prisma.StandardWhereInput[] = [];

    if (includeSector && sectorFilter) {
      if (sectorFilter.sector) {
        where.sector = sectorFilter.sector;
      } else {
        andConditions.push(sectorFilter);
      }
    }

    if (params.department) {
      andConditions.push({
        department: {
          contains: params.department,
          mode: Prisma.QueryMode.insensitive,
        },
      });
    }

    // Exact or normalized IS Number search
    if (params.isNumber) {
      const rawIs = params.isNumber.trim();
      const canonical = normalizeIsNumber(rawIs);
      andConditions.push({
        OR: [
          { isNumber: { contains: rawIs, mode: Prisma.QueryMode.insensitive } },
          { canonicalNumber: { contains: canonical, mode: Prisma.QueryMode.insensitive } },
        ],
      });
    }

    // Tokenized and multi-branch keyword search
    if (params.q) {
      const tokenized = tokenizeSearchQuery(params.q);
      const queryConditions: Prisma.StandardWhereInput[] = [];

      // 1. Exact canonical IS number if extracted
      if (tokenized.explicitIsNumber) {
        queryConditions.push(
          { isNumber: { contains: tokenized.explicitIsNumber, mode: Prisma.QueryMode.insensitive } },
          { canonicalNumber: { contains: normalizeIsNumber(tokenized.explicitIsNumber), mode: Prisma.QueryMode.insensitive } }
        );
      }

      // 2. Full normalized text phrase match
      if (tokenized.cleanText) {
        queryConditions.push(
          { isNumber: { contains: tokenized.cleanText, mode: Prisma.QueryMode.insensitive } },
          { title: { contains: tokenized.cleanText, mode: Prisma.QueryMode.insensitive } },
          { shortTitle: { contains: tokenized.cleanText, mode: Prisma.QueryMode.insensitive } },
          { scope: { contains: tokenized.cleanText, mode: Prisma.QueryMode.insensitive } },
          { sector: { contains: tokenized.cleanText, mode: Prisma.QueryMode.insensitive } },
          { department: { contains: tokenized.cleanText, mode: Prisma.QueryMode.insensitive } }
        );
      }

      // 3. Primary keywords token match
      for (const token of tokenized.primaryTokens) {
        if (token.length >= 2) {
          queryConditions.push(
            { isNumber: { contains: token, mode: Prisma.QueryMode.insensitive } },
            { title: { contains: token, mode: Prisma.QueryMode.insensitive } },
            { shortTitle: { contains: token, mode: Prisma.QueryMode.insensitive } },
            { scope: { contains: token, mode: Prisma.QueryMode.insensitive } },
            { sector: { contains: token, mode: Prisma.QueryMode.insensitive } }
          );
        }
      }

      // 4. Expanded domain synonym tokens match
      for (const token of tokenized.expandedTokens) {
        if (token.length >= 3) {
          queryConditions.push(
            { title: { contains: token, mode: Prisma.QueryMode.insensitive } },
            { shortTitle: { contains: token, mode: Prisma.QueryMode.insensitive } },
            { scope: { contains: token, mode: Prisma.QueryMode.insensitive } }
          );
        }
      }

      if (queryConditions.length > 0) {
        andConditions.push({ OR: queryConditions });
      }
    }

    if (andConditions.length === 1 && (andConditions[0] as any).OR) {
      where.OR = (andConditions[0] as any).OR;
    } else if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    return where;
  };

  let whereClause = buildWhere(true);
  let [total, records] = await Promise.all([
    prisma.standard.count({ where: whereClause }),
    prisma.standard.findMany({
      where: whereClause,
      include: {
        sourceDocument: true,
      },
      take: 100,
    }),
  ]);

  // Fallback: If sector constraint yielded 0 results and a text query or IS number was specified,
  // retry without sector constraint so standards are not blocked by classification nuances.
  if (total === 0 && sectorFilter && (params.q || params.isNumber)) {
    whereClause = buildWhere(false);
    [total, records] = await Promise.all([
      prisma.standard.count({ where: whereClause }),
      prisma.standard.findMany({
        where: whereClause,
        include: {
          sourceDocument: true,
        },
        take: 100,
      }),
    ]);
  }

  // 3. Relevance Scoring & Sorting
  const tokenizedQuery = params.q ? tokenizeSearchQuery(params.q) : null;
  const scoredRecords = records.map((record) => {
    let score = 0.5; // baseline match score
    if (tokenizedQuery) {
      const titleLower = record.title.toLowerCase();
      const scopeLower = (record.scope || '').toLowerCase();
      const isNumLower = record.isNumber.toLowerCase();

      // Exact IS match
      if (tokenizedQuery.explicitIsNumber && isNumLower.includes(tokenizedQuery.explicitIsNumber.toLowerCase())) {
        score += 0.50;
      }
      // Exact phrase match
      if (tokenizedQuery.cleanText && titleLower.includes(tokenizedQuery.cleanText)) {
        score += 0.35;
      } else if (tokenizedQuery.cleanText && scopeLower.includes(tokenizedQuery.cleanText)) {
        score += 0.20;
      }
      // Primary tokens
      for (const tok of tokenizedQuery.primaryTokens) {
        if (titleLower.includes(tok)) {
          score += 0.15;
        } else if (scopeLower.includes(tok)) {
          score += 0.08;
        }
      }
      // Synonym tokens
      for (const tok of tokenizedQuery.expandedTokens) {
        if (titleLower.includes(tok)) {
          score += 0.12;
        } else if (scopeLower.includes(tok)) {
          score += 0.06;
        }
      }
    }
    return { record, relevanceScore: Math.min(1.0, parseFloat(score.toFixed(4))) };
  });

  // Sort descending by relevance score
  scoredRecords.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Apply pagination
  const pagedItems = scoredRecords.slice(skip, skip + limit);

  const standards = pagedItems.map(({ record, relevanceScore }) => ({
    id: record.id,
    isNumber: record.isNumber,
    canonicalNumber: record.canonicalNumber,
    title: record.title,
    shortTitle: record.shortTitle || undefined,
    scope: record.scope || undefined,
    status: record.status as StandardStatus,
    sector: record.sector || undefined,
    department: record.department || undefined,
    currentEdition: record.currentEdition || undefined,
    relevanceScore,
    publicationDate: record.publicationDate instanceof Date
      ? record.publicationDate.toISOString()
      : (record.publicationDate ? String(record.publicationDate) : undefined),
    sourceDocument: record.sourceDocument
      ? {
          id: record.sourceDocument.id,
          title: record.sourceDocument.title,
          url: record.sourceDocument.url,
          sourceType: record.sourceDocument.sourceType,
          authorityLevel: record.sourceDocument.authorityLevel,
          documentType: record.sourceDocument.documentType || undefined,
          publishedAt: record.sourceDocument.publishedAt instanceof Date
            ? record.sourceDocument.publishedAt.toISOString()
            : (record.sourceDocument.publishedAt ? String(record.sourceDocument.publishedAt) : undefined),
          retrievedAt: record.sourceDocument.retrievedAt instanceof Date
            ? record.sourceDocument.retrievedAt.toISOString()
            : String(record.sourceDocument.retrievedAt || new Date().toISOString()),
          versionLabel: record.sourceDocument.versionLabel || undefined,
          status: record.sourceDocument.status,
          createdAt: record.sourceDocument.createdAt instanceof Date
            ? record.sourceDocument.createdAt.toISOString()
            : String(record.sourceDocument.createdAt || new Date().toISOString()),
          updatedAt: record.sourceDocument.updatedAt instanceof Date
            ? record.sourceDocument.updatedAt.toISOString()
            : String(record.sourceDocument.updatedAt || new Date().toISOString()),
        }
      : undefined,
  }));

  return {
    standards,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Retrieves full standard details by ID, including versions, amendments, QCOs, schemes, and manuals.
 */
export async function getStandardById(id: string): Promise<StandardDetailResponse> {
  const record = await prisma.standard.findUnique({
    where: { id },
    include: {
      sourceDocument: true,
      versions: {
        orderBy: { publicationDate: 'desc' },
      },
      amendments: {
        orderBy: { publicationDate: 'desc' },
      },
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
        },
      },
      productManuals: {
        orderBy: { publicationDate: 'desc' },
      },
    },
  });

  if (!record) {
    throw new AppError('Standard not found.', 404, API_ERROR_CODES.NOT_FOUND);
  }

  return {
    id: record.id,
    isNumber: record.isNumber,
    canonicalNumber: record.canonicalNumber,
    title: record.title,
    shortTitle: record.shortTitle || undefined,
    scope: record.scope || undefined,
    status: record.status as StandardStatus,
    sector: record.sector || undefined,
    department: record.department || undefined,
    language: record.language,
    currentEdition: record.currentEdition || undefined,
    publicationDate: record.publicationDate?.toISOString() || undefined,
    withdrawalDate: record.withdrawalDate?.toISOString() || undefined,
    sourceDocumentId: record.sourceDocumentId || undefined,
    sourceDocument: record.sourceDocument
      ? {
          id: record.sourceDocument.id,
          title: record.sourceDocument.title,
          url: record.sourceDocument.url,
          sourceType: record.sourceDocument.sourceType,
          authorityLevel: record.sourceDocument.authorityLevel,
          documentType: record.sourceDocument.documentType || undefined,
          publishedAt: record.sourceDocument.publishedAt
            ? typeof record.sourceDocument.publishedAt === 'string'
              ? record.sourceDocument.publishedAt
              : record.sourceDocument.publishedAt.toISOString()
            : undefined,
          retrievedAt: record.sourceDocument.retrievedAt
            ? typeof record.sourceDocument.retrievedAt === 'string'
              ? record.sourceDocument.retrievedAt
              : record.sourceDocument.retrievedAt.toISOString()
            : new Date().toISOString(),
          versionLabel: record.sourceDocument.versionLabel || undefined,
          status: record.sourceDocument.status,
          createdAt: record.sourceDocument.createdAt
            ? typeof record.sourceDocument.createdAt === 'string'
              ? record.sourceDocument.createdAt
              : record.sourceDocument.createdAt.toISOString()
            : new Date().toISOString(),
          updatedAt: record.sourceDocument.updatedAt
            ? typeof record.sourceDocument.updatedAt === 'string'
              ? record.sourceDocument.updatedAt
              : record.sourceDocument.updatedAt.toISOString()
            : new Date().toISOString(),
        }
      : undefined,
    versions: (record.versions || []).map((v) => ({
      id: v.id,
      standardId: v.standardId,
      edition: v.edition,
      year: v.year || undefined,
      publicationDate: v.publicationDate?.toISOString() || undefined,
      status: v.status as StandardStatus,
      documentUrl: v.documentUrl || undefined,
      sourceDocumentId: v.sourceDocumentId || undefined,
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
    })),
    amendments: (record.amendments || []).map((a) => ({
      id: a.id,
      standardId: a.standardId,
      amendmentNumber: a.amendmentNumber,
      title: a.title || undefined,
      publicationDate: a.publicationDate?.toISOString() || undefined,
      effectiveDate: a.effectiveDate?.toISOString() || undefined,
      documentUrl: a.documentUrl || undefined,
      sourceDocumentId: a.sourceDocumentId || undefined,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
    qcoMappings: (record.qcoMappings || []).map((m) => ({
      id: m.id,
      qcoId: m.qcoId,
      standardId: m.standardId,
      productDescription: m.productDescription || undefined,
      notes: m.notes || undefined,
      createdAt: m.createdAt.toISOString(),
      qco: {
        id: m.qco?.id || m.qcoId,
        name: m.qco?.name || 'QCO',
        orderNumber: m.qco?.orderNumber || 'S.O.',
        ministry: m.qco?.ministry || undefined,
        notificationDate: m.qco?.notificationDate?.toISOString() || undefined,
        effectiveDate: m.qco?.effectiveDate?.toISOString() || undefined,
        status: m.qco?.status || 'IN_FORCE',
        documentUrl: m.qco?.documentUrl || undefined,
        sourceDocumentId: m.qco?.sourceDocumentId || undefined,
        createdAt: m.qco?.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: m.qco?.updatedAt?.toISOString() || new Date().toISOString(),
      },
    })),
    schemeMappings: (record.schemeMappings || []).map((sm) => ({
      id: sm.id,
      standardId: sm.standardId,
      schemeId: sm.schemeId,
      sourceDocumentId: sm.sourceDocumentId || undefined,
      notes: sm.notes || undefined,
      createdAt: sm.createdAt.toISOString(),
      scheme: {
        id: sm.scheme?.id || sm.schemeId,
        name: sm.scheme?.name || 'Scheme',
        code: sm.scheme?.code || 'SCHEME',
        description: sm.scheme?.description || undefined,
        sourceDocumentId: sm.scheme?.sourceDocumentId || undefined,
        createdAt: sm.scheme?.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: sm.scheme?.updatedAt?.toISOString() || new Date().toISOString(),
      },
    })),
    productManuals: (record.productManuals || []).map((pm) => ({
      id: pm.id,
      standardId: pm.standardId,
      title: pm.title,
      documentUrl: pm.documentUrl || undefined,
      version: pm.version || undefined,
      publicationDate: pm.publicationDate?.toISOString() || undefined,
      sourceDocumentId: pm.sourceDocumentId || undefined,
      createdAt: pm.createdAt.toISOString(),
      updatedAt: pm.updatedAt.toISOString(),
    })),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

/**
 * Sub-resource queries
 */
export async function getStandardVersions(standardId: string) {
  const standard = await prisma.standard.findUnique({ where: { id: standardId } });
  if (!standard) {
    throw new AppError('Standard not found.', 404, API_ERROR_CODES.NOT_FOUND);
  }
  return prisma.standardVersion.findMany({
    where: { standardId },
    orderBy: { publicationDate: 'desc' },
  });
}

export async function getStandardAmendments(standardId: string) {
  const standard = await prisma.standard.findUnique({ where: { id: standardId } });
  if (!standard) {
    throw new AppError('Standard not found.', 404, API_ERROR_CODES.NOT_FOUND);
  }
  return prisma.standardAmendment.findMany({
    where: { standardId },
    orderBy: { publicationDate: 'desc' },
  });
}

export async function getStandardQCOs(standardId: string) {
  const standard = await prisma.standard.findUnique({ where: { id: standardId } });
  if (!standard) {
    throw new AppError('Standard not found.', 404, API_ERROR_CODES.NOT_FOUND);
  }
  return prisma.qCOStandardMapping.findMany({
    where: { standardId },
    include: { qco: true },
  });
}

export async function getStandardManuals(standardId: string) {
  const standard = await prisma.standard.findUnique({ where: { id: standardId } });
  if (!standard) {
    throw new AppError('Standard not found.', 404, API_ERROR_CODES.NOT_FOUND);
  }
  return prisma.productManual.findMany({
    where: { standardId },
    orderBy: { publicationDate: 'desc' },
  });
}
