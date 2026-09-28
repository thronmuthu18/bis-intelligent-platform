import { prisma } from '../../db/client.js';
import { OFFICIAL_SOURCE_REGISTRY } from '../../config/sourceRegistry.js';
import { VERIFIED_SEED_STANDARDS } from '../../data/seedStandards.js';
import { validateStandardItem, validateSourceKey, RawStandardIngestItem } from './validator.js';
import { persistStandardRecord } from './deduplication.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../config/logger.js';
import { API_ERROR_CODES } from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  BIS Knowledge Layer — Ingestion Service
// ─────────────────────────────────────────────────────────────────────────────

export interface IngestionExecutionResult {
  runId: string;
  sourceName: string;
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED';
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  recordsFailed: number;
  errors: string[];
}

/**
 * Triggers an official ingestion run for a registered knowledge source.
 * In Phase 4, processes verified official source payloads through the full pipeline.
 */
export async function triggerOfficialIngestion(
  sourceKey: string,
  triggeredByUserId?: string
): Promise<IngestionExecutionResult> {
  validateSourceKey(sourceKey);

  const registryItem = OFFICIAL_SOURCE_REGISTRY[sourceKey];
  if (!registryItem) {
    throw new AppError(
      `Source key '${sourceKey}' is not a registered official BIS source. Arbitrary ingestion is rejected.`,
      400,
      API_ERROR_CODES.BAD_REQUEST
    );
  }

  // 1. Create IngestionRun entry
  const run = await prisma.ingestionRun.create({
    data: {
      sourceName: registryItem.name,
      sourceUrl: registryItem.url,
      status: 'RUNNING',
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      recordsFailed: 0,
      triggeredBy: triggeredByUserId || 'SYSTEM',
    },
  });

  const errors: string[] = [];
  let recordsProcessed = 0;
  let recordsCreated = 0;
  let recordsUpdated = 0;
  let recordsSkipped = 0;
  let recordsFailed = 0;

  try {
    // 2. Fetch/Load official records for this registered source
    const itemsToIngest: RawStandardIngestItem[] = VERIFIED_SEED_STANDARDS;

    for (const rawItem of itemsToIngest) {
      recordsProcessed++;

      // 3. Validate item
      const validation = validateStandardItem(rawItem);
      if (!validation.isValid) {
        recordsFailed++;
        const errorMsg = `Validation failed for ${rawItem.isNumber}: ${validation.errors.join(', ')}`;
        errors.push(errorMsg);
        logger.warn(errorMsg);
        continue;
      }

      // 4. Deduplicate & Persist
      try {
        const persistResult = await persistStandardRecord(rawItem);
        if (persistResult.action === 'CREATED') {
          recordsCreated++;
        } else if (persistResult.action === 'UPDATED') {
          recordsUpdated++;
        } else {
          recordsSkipped++;
        }
      } catch (err: unknown) {
        recordsFailed++;
        const message = err instanceof Error ? err.message : String(err);
        const errorMsg = `Persistence error for ${rawItem.isNumber}: ${message}`;
        errors.push(errorMsg);
        logger.error(errorMsg, { error: err });
      }
    }

    const finalStatus = recordsFailed === 0 ? 'COMPLETED' : recordsCreated + recordsUpdated > 0 ? 'PARTIAL' : 'FAILED';

    await prisma.ingestionRun.update({
      where: { id: run.id },
      data: {
        completedAt: new Date(),
        status: finalStatus,
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsSkipped,
        recordsFailed,
        errorSummary: errors.length > 0 ? errors.join('\n') : null,
      },
    });

    return {
      runId: run.id,
      sourceName: registryItem.name,
      status: finalStatus,
      recordsProcessed,
      recordsCreated,
      recordsUpdated,
      recordsSkipped,
      recordsFailed,
      errors,
    };
  } catch (fatalErr: unknown) {
    logger.error('Fatal error during ingestion run', { error: fatalErr });
    const fatalMessage = fatalErr instanceof Error ? fatalErr.message : String(fatalErr);
    await prisma.ingestionRun.update({
      where: { id: run.id },
      data: {
        completedAt: new Date(),
        status: 'FAILED',
        errorSummary: fatalMessage,
      },
    });

    throw new AppError(
      `Ingestion failed: ${fatalMessage}`,
      500,
      API_ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * Returns historical ingestion runs.
 */
export async function getIngestionRuns(limit = 20) {
  return prisma.ingestionRun.findMany({
    orderBy: { startedAt: 'desc' },
    take: Math.min(limit, 50),
  });
}
