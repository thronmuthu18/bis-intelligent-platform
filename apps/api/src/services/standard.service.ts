import { prisma } from '../db/client.js';
import { Prisma } from '@prisma/client';
import { normalizeIsNumber } from './ingestion/normalizer.js';
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
 * Searches and lists Indian Standards with filtering and pagination.
 */
export async function searchStandards(params: StandardSearchParams): Promise<StandardListResponse> {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, Number(params.limit) || DEFAULT_PAGE_LIMIT));
  const skip = (page - 1) * limit;

  const whereClause: Prisma.StandardWhereInput = {
    isActive: true,
  };

  // Status filter
  if (params.status) {
    whereClause.status = params.status as StandardStatus;
  }

  // Sector filter
  if (params.sector) {
    whereClause.sector = {
      contains: params.sector,
      mode: 'insensitive',
    };
  }

  // Department filter
  if (params.department) {
    whereClause.department = {
      contains: params.department,
      mode: 'insensitive',
    };
  }

  // Exact or normalized IS Number search
  if (params.isNumber) {
    const rawIs = params.isNumber.trim();
    const canonical = normalizeIsNumber(rawIs);

    whereClause.OR = [
      { isNumber: { contains: rawIs, mode: 'insensitive' } },
      { canonicalNumber: { contains: canonical, mode: 'insensitive' } },
    ];
  }

  // Keyword query search (searches IS number, title, shortTitle, and scope)
  if (params.q) {
    const term = params.q.trim();
    const canonicalTerm = normalizeIsNumber(term);

    const textSearchConditions: Prisma.StandardWhereInput[] = [
      { isNumber: { contains: term, mode: 'insensitive' } },
      { title: { contains: term, mode: 'insensitive' } },
      { shortTitle: { contains: term, mode: 'insensitive' } },
      { scope: { contains: term, mode: 'insensitive' } },
      { sector: { contains: term, mode: 'insensitive' } },
      { department: { contains: term, mode: 'insensitive' } },
    ];

    if (canonicalTerm && canonicalTerm !== 'IS') {
      textSearchConditions.push({
        canonicalNumber: { contains: canonicalTerm, mode: 'insensitive' },
      });
    }

    if (whereClause.OR) {
      whereClause.AND = [
        { OR: whereClause.OR },
        { OR: textSearchConditions },
      ];
      delete whereClause.OR;
    } else {
      whereClause.OR = textSearchConditions;
    }
  }

  const [total, records] = await Promise.all([
    prisma.standard.count({ where: whereClause }),
    prisma.standard.findMany({
      where: whereClause,
      include: {
        sourceDocument: true,
      },
      orderBy: [
        { isNumber: 'asc' },
      ],
      skip,
      take: limit,
    }),
  ]);

  const standards = records.map((record) => ({
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
    publicationDate: record.publicationDate?.toISOString() || undefined,
    sourceDocument: record.sourceDocument
      ? {
          id: record.sourceDocument.id,
          title: record.sourceDocument.title,
          url: record.sourceDocument.url,
          sourceType: record.sourceDocument.sourceType,
          authorityLevel: record.sourceDocument.authorityLevel,
          documentType: record.sourceDocument.documentType || undefined,
          publishedAt: record.sourceDocument.publishedAt?.toISOString() || undefined,
          retrievedAt: record.sourceDocument.retrievedAt.toISOString(),
          versionLabel: record.sourceDocument.versionLabel || undefined,
          status: record.sourceDocument.status,
          createdAt: record.sourceDocument.createdAt.toISOString(),
          updatedAt: record.sourceDocument.updatedAt.toISOString(),
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
