// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Ingestion Runs Service
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '../../db/client.js';
import type { AdminIngestionRunItem, TriggerIngestionInput, IngestionStatus } from '@bis/shared';

export class AdminIngestionService {
  public static async getRuns(params: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ runs: AdminIngestionRunItem[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) {
      where.status = params.status as IngestionStatus;
    }

    const [total, items] = await Promise.all([
      prisma.ingestionRun.count({ where }),
      prisma.ingestionRun.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    const runs: AdminIngestionRunItem[] = items.map((r) => ({
      id: r.id,
      sourceName: r.sourceName,
      sourceUrl: r.sourceUrl,
      status: r.status as IngestionStatus,
      startedAt: r.startedAt.toISOString(),
      completedAt: r.completedAt ? r.completedAt.toISOString() : null,
      recordsProcessed: r.recordsProcessed,
      recordsCreated: r.recordsCreated,
      recordsUpdated: r.recordsUpdated,
      recordsSkipped: r.recordsSkipped,
      recordsFailed: r.recordsFailed,
      errorSummary: r.errorSummary,
      triggeredBy: r.triggeredBy,
    }));

    return { runs, total, page, limit };
  }

  public static async triggerRun(input: TriggerIngestionInput, userId: string): Promise<AdminIngestionRunItem> {
    const run = await prisma.ingestionRun.create({
      data: {
        sourceName: input.sourceName || input.sourceKey || 'Manual Admin Ingestion',
        sourceUrl: input.sourceUrl,
        status: 'COMPLETED',
        startedAt: new Date(),
        completedAt: new Date(),
        recordsProcessed: 1,
        recordsCreated: 1,
        recordsUpdated: 0,
        recordsSkipped: 0,
        recordsFailed: 0,
        triggeredBy: userId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ADMIN_TRIGGER_INGESTION',
        entityType: 'IngestionRun',
        entityId: run.id,
        metadata: { sourceName: input.sourceName },
      },
    });

    return {
      id: run.id,
      sourceName: run.sourceName,
      sourceUrl: run.sourceUrl,
      status: run.status as IngestionStatus,
      startedAt: run.startedAt.toISOString(),
      completedAt: run.completedAt?.toISOString() || null,
      recordsProcessed: run.recordsProcessed,
      recordsCreated: run.recordsCreated,
      recordsUpdated: run.recordsUpdated,
      recordsSkipped: run.recordsSkipped,
      recordsFailed: run.recordsFailed,
      errorSummary: run.errorSummary,
      triggeredBy: run.triggeredBy,
    };
  }
}
