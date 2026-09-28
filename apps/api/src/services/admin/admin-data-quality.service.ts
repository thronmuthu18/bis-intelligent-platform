// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Data Quality Center Service
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '../../db/client.js';
import type { DataQualityReport, DataQualityIssue } from '@bis/shared';

export class AdminDataQualityService {
  /**
   * Run live data-quality diagnostics across the knowledge repository.
   */
  public static async scan(): Promise<DataQualityReport> {
    const issues: DataQualityIssue[] = [];
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oneEightyDaysAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    // 1. Standards missing source documents (CRITICAL)
    const standardsWithoutSource = await prisma.standard.findMany({
      where: { sourceDocumentId: null },
      select: { id: true, isNumber: true, title: true },
      take: 20,
    });

    standardsWithoutSource.forEach((s) => {
      issues.push({
        id: `dq-std-source-${s.id}`,
        category: 'MISSING_SOURCE',
        severity: 'CRITICAL',
        title: `Standard ${s.isNumber} lacks authoritative source reference`,
        description: `Standard "${s.title}" has no linked SourceDocument. Decisions generated from this standard cannot guarantee official provenance.`,
        entityType: 'Standard',
        entityId: s.id,
        remediation: 'Link this standard to a verified BIS Gazette or official standard document in the Source Registry.',
        detectedAt: now.toISOString(),
      });
    });

    // 2. QCOs missing source documents (CRITICAL)
    const qcosWithoutSource = await prisma.qCO.findMany({
      where: { sourceDocumentId: null },
      select: { id: true, orderNumber: true, name: true },
      take: 20,
    });

    qcosWithoutSource.forEach((q) => {
      issues.push({
        id: `dq-qco-source-${q.id}`,
        category: 'MISSING_SOURCE',
        severity: 'CRITICAL',
        title: `QCO ${q.orderNumber} lacks Gazette source reference`,
        description: `Quality Control Order "${q.name}" does not cite its official Gazette publication document.`,
        entityType: 'QCO',
        entityId: q.id,
        remediation: 'Attach the official Ministry Gazette notification source document.',
        detectedAt: now.toISOString(),
      });
    });

    // 3. Stale source documents (WARNING)
    const staleSources = await prisma.sourceDocument.findMany({
      where: { retrievedAt: { lt: ninetyDaysAgo }, status: 'ACTIVE' },
      select: { id: true, title: true, url: true, retrievedAt: true },
      take: 20,
    });

    staleSources.forEach((src) => {
      const days = Math.floor((now.getTime() - new Date(src.retrievedAt).getTime()) / (24 * 60 * 60 * 1000));
      issues.push({
        id: `dq-stale-source-${src.id}`,
        category: 'STALE_RECORD',
        severity: 'WARNING',
        title: `Source "${src.title}" is stale (${days} days since last verification)`,
        description: `Authoritative source URL ${src.url} has not been re-verified within the recommended 90-day threshold.`,
        entityType: 'SourceDocument',
        entityId: src.id,
        remediation: 'Click "Re-verify" in the Source Registry after confirming the URL content remains active on official portals.',
        detectedAt: now.toISOString(),
      });
    });

    // 4. Orphan Knowledge Chunks (ERROR)
    const orphanChunks = await prisma.knowledgeChunk.findMany({
      where: { standardId: null, qcoId: null, schemeId: null, sourceDocumentId: null },
      select: { id: true, chunkType: true },
      take: 20,
    });

    orphanChunks.forEach((c) => {
      issues.push({
        id: `dq-orphan-chunk-${c.id}`,
        category: 'ORPHAN_CHUNK',
        severity: 'ERROR',
        title: `Orphan Knowledge Chunk (${c.chunkType})`,
        description: 'Knowledge chunk has no linked standard, QCO, scheme, or source document.',
        entityType: 'KnowledgeChunk',
        entityId: c.id,
        remediation: 'Reassign this chunk to an Indian Standard or remove it from the index.',
        detectedAt: now.toISOString(),
      });
    });

    // 5. Failed / Pending Embeddings (WARNING)
    const failedChunks = await prisma.knowledgeChunk.findMany({
      where: { embeddingStatus: 'FAILED' },
      select: { id: true, chunkType: true },
      take: 20,
    });

    failedChunks.forEach((c) => {
      issues.push({
        id: `dq-failed-emb-${c.id}`,
        category: 'MISSING_EMBEDDING',
        severity: 'WARNING',
        title: `Embedding generation failed for chunk ${c.id.substring(0, 8)}`,
        description: `Chunk type ${c.chunkType} is not searchable via vector retrieval.`,
        entityType: 'KnowledgeChunk',
        entityId: c.id,
        remediation: 'Trigger "Reindex Failed" from the Embeddings & Search Index management page.',
        detectedAt: now.toISOString(),
      });
    });

    // 6. Stale Laboratories (INFO / WARNING)
    const staleLabs = await prisma.laboratory.findMany({
      where: {
        OR: [
          { lastVerifiedAt: null },
          { lastVerifiedAt: { lt: oneEightyDaysAgo } },
        ],
        isActive: true,
      },
      select: { id: true, name: true, city: true },
      take: 10,
    });

    staleLabs.forEach((lab) => {
      issues.push({
        id: `dq-stale-lab-${lab.id}`,
        category: 'STALE_RECORD',
        severity: 'INFO',
        title: `Laboratory recognition for "${lab.name}" (${lab.city || 'India'}) requires periodic review`,
        description: 'Laboratory scope and NABL accreditation status have not been refreshed in > 180 days.',
        entityType: 'Laboratory',
        entityId: lab.id,
        remediation: 'Review NABL / BIS lab directory and update verification timestamp.',
        detectedAt: now.toISOString(),
      });
    });

    let criticalCount = 0;
    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;

    issues.forEach((iss) => {
      if (iss.severity === 'CRITICAL') criticalCount++;
      else if (iss.severity === 'ERROR') errorCount++;
      else if (iss.severity === 'WARNING') warningCount++;
      else if (iss.severity === 'INFO') infoCount++;
    });

    return {
      scannedAt: now.toISOString(),
      totalIssues: issues.length,
      criticalCount,
      errorCount,
      warningCount,
      infoCount,
      issues,
    };
  }
}
