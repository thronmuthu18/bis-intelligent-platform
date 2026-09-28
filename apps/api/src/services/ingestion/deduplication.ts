import { prisma } from '../../db/client.js';
import { normalizeIsNumber, normalizeText } from './normalizer.js';
import { RawStandardIngestItem } from './validator.js';

// ─────────────────────────────────────────────────────────────────────────────
//  BIS Ingestion Layer — Deduplication & Persistence Manager
// ─────────────────────────────────────────────────────────────────────────────

export interface PersistResult {
  action: 'CREATED' | 'UPDATED' | 'SKIPPED';
  standardId: string;
  isNumber: string;
}

/**
 * Persists a validated standard record with historical versions, amendments, and QCO relations.
 * Guarantees no duplicate standard records and preserves historical provenance.
 */
export async function persistStandardRecord(
  rawItem: RawStandardIngestItem
): Promise<PersistResult> {
  const canonicalNumber = normalizeIsNumber(rawItem.isNumber);

  // 1. Ensure or find the SourceDocument
  let sourceDoc = await prisma.sourceDocument.findFirst({
    where: { url: rawItem.sourceDocument.url },
  });

  if (!sourceDoc) {
    sourceDoc = await prisma.sourceDocument.create({
      data: {
        title: rawItem.sourceDocument.title,
        url: rawItem.sourceDocument.url,
        sourceType: rawItem.sourceDocument.sourceType,
        authorityLevel: rawItem.sourceDocument.authorityLevel,
        documentType: rawItem.sourceDocument.documentType,
        publishedAt: rawItem.sourceDocument.publishedAt
          ? new Date(rawItem.sourceDocument.publishedAt)
          : null,
        versionLabel: rawItem.sourceDocument.versionLabel,
        retrievedAt: new Date(),
      },
    });
  }

  // 2. Look for existing Standard by isNumber or canonicalNumber
  let existingStandard = await prisma.standard.findFirst({
    where: {
      OR: [
        { isNumber: rawItem.isNumber.trim() },
        { canonicalNumber },
      ],
    },
    include: {
      versions: true,
      amendments: true,
      qcoMappings: true,
    },
  });

  let action: 'CREATED' | 'UPDATED' = 'CREATED';
  let standardId: string;

  if (existingStandard) {
    action = 'UPDATED';
    standardId = existingStandard.id;

    // Update standard metadata non-destructively
    await prisma.standard.update({
      where: { id: standardId },
      data: {
        title: rawItem.title.trim(),
        shortTitle: normalizeText(rawItem.shortTitle),
        scope: rawItem.scope ? rawItem.scope.trim() : existingStandard.scope,
        status: rawItem.status || existingStandard.status,
        sector: normalizeText(rawItem.sector) || existingStandard.sector,
        department: normalizeText(rawItem.department) || existingStandard.department,
        language: rawItem.language || existingStandard.language,
        currentEdition: normalizeText(rawItem.currentEdition) || existingStandard.currentEdition,
        publicationDate: rawItem.publicationDate
          ? new Date(rawItem.publicationDate)
          : existingStandard.publicationDate,
        withdrawalDate: rawItem.withdrawalDate
          ? new Date(rawItem.withdrawalDate)
          : existingStandard.withdrawalDate,
        sourceDocumentId: sourceDoc.id,
      },
    });
  } else {
    // Create new standard
    const created = await prisma.standard.create({
      data: {
        isNumber: rawItem.isNumber.trim(),
        canonicalNumber,
        title: rawItem.title.trim(),
        shortTitle: normalizeText(rawItem.shortTitle),
        scope: normalizeText(rawItem.scope),
        status: rawItem.status || 'CURRENT',
        sector: normalizeText(rawItem.sector),
        department: normalizeText(rawItem.department),
        language: rawItem.language || 'English',
        currentEdition: normalizeText(rawItem.currentEdition),
        publicationDate: rawItem.publicationDate ? new Date(rawItem.publicationDate) : null,
        withdrawalDate: rawItem.withdrawalDate ? new Date(rawItem.withdrawalDate) : null,
        sourceDocumentId: sourceDoc.id,
      },
    });
    standardId = created.id;
  }

  // 3. Process Versions (Preserving all historical editions)
  if (rawItem.versions && rawItem.versions.length > 0) {
    for (const v of rawItem.versions) {
      const existingVer = await prisma.standardVersion.findFirst({
        where: {
          standardId,
          edition: v.edition.trim(),
        },
      });

      if (!existingVer) {
        await prisma.standardVersion.create({
          data: {
            standardId,
            edition: v.edition.trim(),
            year: v.year,
            publicationDate: v.publicationDate ? new Date(v.publicationDate) : null,
            status: v.status || 'CURRENT',
            documentUrl: v.documentUrl,
            sourceDocumentId: sourceDoc.id,
          },
        });
      }
    }
  }

  // 4. Process Amendments
  if (rawItem.amendments && rawItem.amendments.length > 0) {
    for (const a of rawItem.amendments) {
      const existingAm = await prisma.standardAmendment.findFirst({
        where: {
          standardId,
          amendmentNumber: a.amendmentNumber.trim(),
        },
      });

      if (!existingAm) {
        await prisma.standardAmendment.create({
          data: {
            standardId,
            amendmentNumber: a.amendmentNumber.trim(),
            title: normalizeText(a.title),
            publicationDate: a.publicationDate ? new Date(a.publicationDate) : null,
            effectiveDate: a.effectiveDate ? new Date(a.effectiveDate) : null,
            documentUrl: a.documentUrl,
            sourceDocumentId: sourceDoc.id,
          },
        });
      }
    }
  }

  // 5. Process QCOs and Mappings
  if (rawItem.qcos && rawItem.qcos.length > 0) {
    for (const q of rawItem.qcos) {
      let qco = await prisma.qCO.findUnique({
        where: { orderNumber: q.orderNumber.trim() },
      });

      if (!qco) {
        qco = await prisma.qCO.create({
          data: {
            name: q.name.trim(),
            orderNumber: q.orderNumber.trim(),
            ministry: normalizeText(q.ministry),
            notificationDate: q.notificationDate ? new Date(q.notificationDate) : null,
            effectiveDate: q.effectiveDate ? new Date(q.effectiveDate) : null,
            status: q.status || 'IN_FORCE',
            documentUrl: q.documentUrl,
            sourceDocumentId: sourceDoc.id,
          },
        });
      }

      // Map QCO to Standard
      const existingMapping = await prisma.qCOStandardMapping.findUnique({
        where: {
          qcoId_standardId: {
            qcoId: qco.id,
            standardId,
          },
        },
      });

      if (!existingMapping) {
        await prisma.qCOStandardMapping.create({
          data: {
            qcoId: qco.id,
            standardId,
            productDescription: normalizeText(q.productDescription),
          },
        });
      }
    }
  }

  // 6. Process Schemes
  if (rawItem.schemes && rawItem.schemes.length > 0) {
    for (const s of rawItem.schemes) {
      let scheme = await prisma.scheme.findUnique({
        where: { code: s.code.trim() },
      });

      if (!scheme) {
        scheme = await prisma.scheme.create({
          data: {
            code: s.code.trim(),
            name: s.name.trim(),
            description: normalizeText(s.description),
            sourceDocumentId: sourceDoc.id,
          },
        });
      }

      const existingSchemeMap = await prisma.standardSchemeMapping.findUnique({
        where: {
          standardId_schemeId: {
            standardId,
            schemeId: scheme.id,
          },
        },
      });

      if (!existingSchemeMap) {
        await prisma.standardSchemeMapping.create({
          data: {
            standardId,
            schemeId: scheme.id,
            notes: normalizeText(s.notes),
            sourceDocumentId: sourceDoc.id,
          },
        });
      }
    }
  }

  // 7. Process Product Manuals
  if (rawItem.productManuals && rawItem.productManuals.length > 0) {
    for (const m of rawItem.productManuals) {
      const existingManual = await prisma.productManual.findFirst({
        where: {
          standardId,
          title: m.title.trim(),
        },
      });

      if (!existingManual) {
        await prisma.productManual.create({
          data: {
            standardId,
            title: m.title.trim(),
            version: normalizeText(m.version),
            publicationDate: m.publicationDate ? new Date(m.publicationDate) : null,
            documentUrl: m.documentUrl,
            sourceDocumentId: sourceDoc.id,
          },
        });
      }
    }
  }

  return {
    action,
    standardId,
    isNumber: rawItem.isNumber,
  };
}
