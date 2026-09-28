import crypto from 'crypto';
import { KnowledgeChunkType } from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  BIS Knowledge Chunker Engine (Phase 5)
// ─────────────────────────────────────────────────────────────────────────────

export interface RawChunkInput {
  chunkType: KnowledgeChunkType;
  sectionTitle?: string;
  content: string;
  chunkIndex: number;
  sourceDocumentId?: string;
  standardId?: string;
  standardVersionId?: string;
  standardAmendmentId?: string;
  qcoId?: string;
  schemeId?: string;
  productManualId?: string;
  metadata?: Record<string, unknown>;
}

export interface PreparedChunk extends RawChunkInput {
  contentHash: string;
}

/**
 * Computes SHA-256 hash of normalized chunk content for caching and cost control.
 */
export function computeChunkHash(content: string, type: string, sectionTitle?: string): string {
  const payload = `${type}::${sectionTitle || ''}::${content.trim()}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Builds deterministic, semantically coherent chunks for a full Standard entity.
 */
export function buildChunksForStandard(standard: any): PreparedChunk[] {
  const chunks: PreparedChunk[] = [];
  let chunkIndex = 0;

  // 1. Standard Scope & Core Specification Chunk
  const scopeContent = [
    `Indian Standard: ${standard.isNumber} (Canonical ID: ${standard.canonicalNumber})`,
    `Title: ${standard.title}`,
    standard.shortTitle ? `Short Title: ${standard.shortTitle}` : null,
    `Sector: ${standard.sector || 'General'} | Department: ${standard.department || 'Bureau of Indian Standards'}`,
    `Status: ${standard.status} | Edition: ${standard.currentEdition || 'Current'}`,
    standard.scope ? `Scope & Technical Requirements:\n${standard.scope}` : null,
    standard.sourceDocument ? `Official BIS Source: ${standard.sourceDocument.title} (${standard.sourceDocument.url})` : null,
  ]
    .filter(Boolean)
    .join('\n');

  chunks.push({
    chunkType: 'STANDARD_SCOPE',
    sectionTitle: 'Standard Scope & Specifications',
    content: scopeContent,
    chunkIndex: chunkIndex++,
    standardId: standard.id,
    sourceDocumentId: standard.sourceDocumentId || undefined,
    contentHash: computeChunkHash(scopeContent, 'STANDARD_SCOPE', 'Standard Scope & Specifications'),
    metadata: {
      isNumber: standard.isNumber,
      canonicalNumber: standard.canonicalNumber,
      sector: standard.sector,
      department: standard.department,
      status: standard.status,
    },
  });

  // 2. Standard Metadata Chunk
  const metadataContent = [
    `Indian Standard: ${standard.isNumber}`,
    `Title: ${standard.title}`,
    `Language: ${standard.language || 'English'}`,
    standard.publicationDate ? `Publication Date: ${new Date(standard.publicationDate).toISOString().split('T')[0]}` : null,
    standard.withdrawalDate ? `Withdrawal Date: ${new Date(standard.withdrawalDate).toISOString().split('T')[0]}` : null,
    standard.sourceDocument
      ? `Authority Level: ${standard.sourceDocument.authorityLevel} | Source Type: ${standard.sourceDocument.sourceType}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  chunks.push({
    chunkType: 'STANDARD_METADATA',
    sectionTitle: 'Standard Metadata & Gazette Details',
    content: metadataContent,
    chunkIndex: chunkIndex++,
    standardId: standard.id,
    sourceDocumentId: standard.sourceDocumentId || undefined,
    contentHash: computeChunkHash(metadataContent, 'STANDARD_METADATA', 'Standard Metadata & Gazette Details'),
    metadata: {
      isNumber: standard.isNumber,
      authorityLevel: standard.sourceDocument?.authorityLevel || 'AUTHORITATIVE',
    },
  });

  // 3. Historical Versions / Editions Chunks
  if (standard.versions && Array.isArray(standard.versions)) {
    for (const v of standard.versions) {
      const versionContent = [
        `Indian Standard Edition History: ${standard.isNumber}`,
        `Edition: ${v.edition}`,
        v.year ? `Edition Year: ${v.year}` : null,
        `Status: ${v.status}`,
        v.publicationDate ? `Published: ${new Date(v.publicationDate).toISOString().split('T')[0]}` : null,
        v.documentUrl ? `Document Reference: ${v.documentUrl}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      chunks.push({
        chunkType: 'STANDARD_VERSION',
        sectionTitle: `Edition: ${v.edition}`,
        content: versionContent,
        chunkIndex: chunkIndex++,
        standardId: standard.id,
        standardVersionId: v.id,
        sourceDocumentId: v.sourceDocumentId || standard.sourceDocumentId || undefined,
        contentHash: computeChunkHash(versionContent, 'STANDARD_VERSION', `Edition: ${v.edition}`),
        metadata: {
          isNumber: standard.isNumber,
          edition: v.edition,
          status: v.status,
        },
      });
    }
  }

  // 4. Amendments Chunks
  if (standard.amendments && Array.isArray(standard.amendments)) {
    for (const a of standard.amendments) {
      const amendmentContent = [
        `Indian Standard Amendment: ${standard.isNumber}`,
        `Amendment Number: ${a.amendmentNumber}`,
        a.title ? `Title / Clauses: ${a.title}` : null,
        a.effectiveDate ? `Effective Date: ${new Date(a.effectiveDate).toISOString().split('T')[0]}` : null,
        a.documentUrl ? `Gazette Notification / PDF: ${a.documentUrl}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      chunks.push({
        chunkType: 'STANDARD_AMENDMENT',
        sectionTitle: `Amendment: ${a.amendmentNumber}`,
        content: amendmentContent,
        chunkIndex: chunkIndex++,
        standardId: standard.id,
        standardAmendmentId: a.id,
        sourceDocumentId: a.sourceDocumentId || standard.sourceDocumentId || undefined,
        contentHash: computeChunkHash(amendmentContent, 'STANDARD_AMENDMENT', `Amendment: ${a.amendmentNumber}`),
        metadata: {
          isNumber: standard.isNumber,
          amendmentNumber: a.amendmentNumber,
        },
      });
    }
  }

  // 5. Quality Control Orders (QCOs) Chunks
  if (standard.qcoMappings && Array.isArray(standard.qcoMappings)) {
    for (const mapItem of standard.qcoMappings) {
      const qco = mapItem.qco || {};
      const qcoContent = [
        `Quality Control Order (Mandatory Compliance): ${qco.name || 'BIS QCO'}`,
        `Gazette Order Number: ${qco.orderNumber}`,
        qco.ministry ? `Notifying Ministry: ${qco.ministry}` : null,
        `Mandatory Indian Standard: ${standard.isNumber}`,
        mapItem.productDescription ? `Notified Product Coverage: ${mapItem.productDescription}` : null,
        qco.effectiveDate ? `Mandatory In Force Date: ${new Date(qco.effectiveDate).toISOString().split('T')[0]}` : null,
        qco.documentUrl ? `Official Gazette Link: ${qco.documentUrl}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      chunks.push({
        chunkType: 'QCO',
        sectionTitle: `Quality Control Order: ${qco.orderNumber}`,
        content: qcoContent,
        chunkIndex: chunkIndex++,
        standardId: standard.id,
        qcoId: qco.id || mapItem.qcoId,
        sourceDocumentId: qco.sourceDocumentId || standard.sourceDocumentId || undefined,
        contentHash: computeChunkHash(qcoContent, 'QCO', `Quality Control Order: ${qco.orderNumber}`),
        metadata: {
          isNumber: standard.isNumber,
          orderNumber: qco.orderNumber,
          ministry: qco.ministry,
        },
      });
    }
  }

  // 6. Schemes Chunks
  if (standard.schemeMappings && Array.isArray(standard.schemeMappings)) {
    for (const sm of standard.schemeMappings) {
      const scheme = sm.scheme || {};
      const schemeContent = [
        `BIS Conformity Assessment Scheme: ${scheme.name || scheme.code}`,
        `Scheme Code: ${scheme.code}`,
        `Applicable Standard: ${standard.isNumber}`,
        scheme.description ? `Description: ${scheme.description}` : null,
        sm.notes ? `Scheme Notes: ${sm.notes}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      chunks.push({
        chunkType: 'SCHEME',
        sectionTitle: `Conformity Scheme: ${scheme.code}`,
        content: schemeContent,
        chunkIndex: chunkIndex++,
        standardId: standard.id,
        schemeId: scheme.id || sm.schemeId,
        sourceDocumentId: scheme.sourceDocumentId || standard.sourceDocumentId || undefined,
        contentHash: computeChunkHash(schemeContent, 'SCHEME', `Conformity Scheme: ${scheme.code}`),
        metadata: {
          isNumber: standard.isNumber,
          schemeCode: scheme.code,
        },
      });
    }
  }

  // 7. Product Manuals / STI Chunks
  if (standard.productManuals && Array.isArray(standard.productManuals)) {
    for (const pm of standard.productManuals) {
      const manualContent = [
        `BIS Product Manual / Scheme of Testing & Inspection (STI): ${pm.title}`,
        `Governing Standard: ${standard.isNumber}`,
        pm.version ? `Document Version: ${pm.version}` : null,
        pm.publicationDate ? `Publication Date: ${new Date(pm.publicationDate).toISOString().split('T')[0]}` : null,
        pm.documentUrl ? `Document Link: ${pm.documentUrl}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      chunks.push({
        chunkType: 'PRODUCT_MANUAL',
        sectionTitle: `Product Manual: ${pm.title}`,
        content: manualContent,
        chunkIndex: chunkIndex++,
        standardId: standard.id,
        productManualId: pm.id,
        sourceDocumentId: pm.sourceDocumentId || standard.sourceDocumentId || undefined,
        contentHash: computeChunkHash(manualContent, 'PRODUCT_MANUAL', `Product Manual: ${pm.title}`),
        metadata: {
          isNumber: standard.isNumber,
          manualTitle: pm.title,
        },
      });
    }
  }

  return chunks;
}
