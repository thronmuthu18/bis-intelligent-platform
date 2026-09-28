import type {
  ProductQcoInformationItem,
  SchemeRelevanceLevel,
} from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Phase 7 — Scheme Resolver & QCO Extractor
// ─────────────────────────────────────────────────────────────────────────────

export interface ResolvedSchemeCandidate {
  schemeId: string;
  standardId: string;
  schemeCode: string;
  schemeName: string;
  schemeDescription: string | null;
  standardIsNumber: string;
  standardTitle: string;
  relevanceLevel: SchemeRelevanceLevel;
  confidenceScore: number;
  reasons: string[];
  evidence: {
    mappingNotes: string | null;
    sourceDocument: {
      title: string;
      url: string;
      authorityLevel: string;
    } | null;
    productManual: {
      title: string;
      version: string | null;
      documentUrl: string | null;
    } | null;
  } | null;
  rank: number;
}

/**
 * Resolves candidate schemes from matched standards in the knowledge repository.
 * Strictly uses authoritative StandardSchemeMapping records without fabricating schemes.
 */
export function resolveCandidateSchemes(
  _product: any,
  matchedStandards: any[]
): ResolvedSchemeCandidate[] {
  const candidates: ResolvedSchemeCandidate[] = [];
  const seenSchemeStandardPairs = new Set<string>();

  let currentRank = 1;

  for (const stdMatch of matchedStandards) {
    const std = stdMatch.standard || stdMatch;
    if (!std || !std.schemeMappings || std.schemeMappings.length === 0) {
      continue;
    }

    const hasQco = std.qcoMappings && std.qcoMappings.length > 0;
    const productManual = std.productManuals && std.productManuals.length > 0 ? std.productManuals[0] : null;

    for (const mapping of std.schemeMappings) {
      const scheme = mapping.scheme;
      if (!scheme) continue;

      const key = `${scheme.id}-${std.id}`;
      if (seenSchemeStandardPairs.has(key)) continue;
      seenSchemeStandardPairs.add(key);

      const reasons: string[] = [];
      let baseScore = 0.70;

      // 1. Direct standard mapping reason
      reasons.push(
        `Direct conformity assessment mapping established in BIS Knowledge Repository for ${std.isNumber}`
      );

      // 2. QCO mandate boost
      if (hasQco) {
        baseScore += 0.15;
        const qco = std.qcoMappings[0].qco || std.qcoMappings[0];
        reasons.push(
          `Mandatory Quality Control Order published (${qco.name || qco.orderNumber || 'Government QCO'}) requires certification under this framework`
        );
      }

      // 3. Product Manual availability
      if (productManual) {
        baseScore += 0.10;
        reasons.push(
          `Official BIS Product Manual published: ${productManual.title} (${productManual.version || 'Latest STI'})`
        );
      }

      // 4. Scheme specifics
      if (scheme.code === 'SCHEME_I_ISI') {
        reasons.push(
          'Scheme-I (ISI Mark) provides product certification through factory audits, quality control verification, and testing'
        );
      } else if (scheme.code === 'SCHEME_II_CRS') {
        reasons.push(
          'Scheme-II (Compulsory Registration Scheme - CRS) provides registration based on self-declaration and accredited laboratory testing'
        );
      } else if (scheme.code === 'SCHEME_IV') {
        reasons.push(
          'Scheme-IV provides Certificate of Conformity based on specialized batch or product conformity testing'
        );
      }

      if (mapping.notes) {
        reasons.push(`Mapping note: ${mapping.notes}`);
      }

      // Determine relevance level
      let relevanceLevel: SchemeRelevanceLevel = 'POTENTIALLY_RELEVANT';
      const confidenceScore = Math.min(Number(baseScore.toFixed(2)), 0.98);

      if (confidenceScore >= 0.85) {
        relevanceLevel = 'RELEVANT';
      } else if (confidenceScore >= 0.65) {
        relevanceLevel = 'POTENTIALLY_RELEVANT';
      } else {
        relevanceLevel = 'NEEDS_REVIEW';
      }

      // Source provenance
      const sourceDoc = mapping.sourceDocument || scheme.sourceDocument || std.sourceDocument;
      const srcEvidence = sourceDoc && sourceDoc.authorityLevel !== 'UNVERIFIED'
        ? {
            title: sourceDoc.title,
            url: sourceDoc.url,
            authorityLevel: sourceDoc.authorityLevel,
          }
        : null;

      const manualEvidence = productManual
        ? {
            title: productManual.title,
            version: productManual.version || null,
            documentUrl: productManual.documentUrl || null,
          }
        : null;

      candidates.push({
        schemeId: scheme.id,
        standardId: std.id,
        schemeCode: scheme.code,
        schemeName: scheme.name,
        schemeDescription: scheme.description || null,
        standardIsNumber: std.isNumber,
        standardTitle: std.title,
        relevanceLevel,
        confidenceScore,
        reasons,
        evidence: {
          mappingNotes: mapping.notes || null,
          sourceDocument: srcEvidence,
          productManual: manualEvidence,
        },
        rank: currentRank++,
      });
    }
  }

  // Sort by confidenceScore descending
  return candidates.sort((a, b) => b.confidenceScore - a.confidenceScore);
}

/**
 * Extracts QCO information from matched standards.
 */
export function extractQcoInformation(
  matchedStandards: any[]
): ProductQcoInformationItem[] {
  const items: ProductQcoInformationItem[] = [];
  const seenQcos = new Set<string>();

  for (const stdMatch of matchedStandards) {
    const std = stdMatch.standard || stdMatch;
    if (!std || !std.qcoMappings) continue;

    for (const mapItem of std.qcoMappings) {
      const qco = mapItem.qco || mapItem;
      if (!qco || !qco.id) continue;

      const key = `${qco.id}-${std.id}`;
      if (seenQcos.has(key)) continue;
      seenQcos.add(key);

      const srcDoc = qco.sourceDocument || (mapItem.qco && mapItem.qco.sourceDocument);

      items.push({
        id: `qco-info-${items.length + 1}`,
        qcoId: qco.id,
        standardId: std.id,
        qcoTitle: qco.name || 'Quality Control Order',
        orderNumber: qco.orderNumber,
        issuingAuthority: qco.ministry || 'Government of India',
        notificationDate: qco.notificationDate ? new Date(qco.notificationDate).toISOString() : null,
        effectiveDate: qco.effectiveDate ? new Date(qco.effectiveDate).toISOString() : null,
        sourceUrl: qco.documentUrl || (srcDoc ? srcDoc.url : null),
        status: qco.status || 'IN_FORCE',
        isMandatory: qco.status !== 'REVOKED',
        notes: mapItem.notes || mapItem.productDescription || null,
      });
    }
  }

  return items;
}
