// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Dashboard Service
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '../../db/client.js';
import type { AdminDashboardMetrics } from '@bis/shared';

export class AdminDashboardService {
  /**
   * Aggregate operational metrics across knowledge base, search index,
   * sources, consumer registries, data quality, and compliance tracking.
   */
  public static async getMetrics(): Promise<AdminDashboardMetrics> {
    const now = new Date();
    const staleThreshold = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [
      totalStandards,
      activeStandards,
      standardVersions,
      amendments,
      qcos,
      schemes,
      productManuals,
      knowledgeChunks,
      embeddedChunks,
      pendingEmbeddings,
      failedEmbeddings,
      totalSources,
      verifiedSources,
      staleSources,
      consumerServices,
      hallmarkingCentres,
      laboratories,
      regulatoryChangeEvents,
      activeAlerts,
      unresolvedImpacts,
      standardsWithoutSource,
      orphanChunks,
    ] = await Promise.all([
      prisma.standard.count(),
      prisma.standard.count({ where: { isActive: true, status: 'CURRENT' } }),
      prisma.standardVersion.count(),
      prisma.standardAmendment.count(),
      prisma.qCO.count(),
      prisma.scheme.count(),
      prisma.productManual.count(),
      prisma.knowledgeChunk.count(),
      prisma.knowledgeChunk.count({ where: { embeddingStatus: 'COMPLETED' } }),
      prisma.knowledgeChunk.count({ where: { embeddingStatus: 'PENDING' } }),
      prisma.knowledgeChunk.count({ where: { embeddingStatus: 'FAILED' } }),
      prisma.sourceDocument.count(),
      prisma.sourceDocument.count({ where: { authorityLevel: 'AUTHORITATIVE', status: 'ACTIVE' } }),
      prisma.sourceDocument.count({ where: { retrievedAt: { lt: staleThreshold } } }),
      prisma.consumerService.count(),
      prisma.hallmarkingCentre.count(),
      prisma.laboratory.count(),
      prisma.regulatoryChangeEvent.count(),
      prisma.complianceAlert.count({ where: { isRead: false } }),
      prisma.regulatoryImpact.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.standard.count({ where: { sourceDocumentId: null } }),
      prisma.knowledgeChunk.count({
        where: { standardId: null, qcoId: null, schemeId: null, sourceDocumentId: null },
      }),
    ]);

    const totalIssues = standardsWithoutSource + orphanChunks + failedEmbeddings + staleSources;
    const criticalIssues = standardsWithoutSource;

    return {
      knowledge: {
        totalStandards,
        activeStandards,
        standardVersions,
        amendments,
        qcos,
        schemes,
        productManuals,
        knowledgeChunks,
      },
      search: {
        totalIndexedChunks: knowledgeChunks,
        embeddedChunks,
        pendingEmbeddings,
        failedEmbeddings,
        lexicalOnlyRecords: pendingEmbeddings + failedEmbeddings,
      },
      sources: {
        totalSources,
        verifiedSources,
        staleSources,
        failedIngestion: 0,
        pendingVerification: totalSources - verifiedSources,
      },
      consumer: {
        consumerServices,
        hallmarkingCentres,
        laboratories,
      },
      dataQuality: {
        totalIssues,
        criticalIssues,
        missingSourceCount: standardsWithoutSource,
        staleRecordCount: staleSources,
        duplicateRecordCount: 0,
        orphanChunkCount: orphanChunks,
        missingEmbeddingCount: pendingEmbeddings + failedEmbeddings,
      },
      compliance: {
        regulatoryChangeEvents,
        activeAlerts,
        unresolvedImpacts,
      },
    };
  }
}
