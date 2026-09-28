import type { Request, Response, NextFunction } from 'express';
import { OFFICIAL_SOURCE_REGISTRY } from '../config/sourceRegistry.js';
import {
  triggerOfficialIngestion,
  getIngestionRuns,
} from '../services/ingestion/ingestion.service.js';
import { buildRagContext } from '../services/rag/ragContextBuilder.js';
import {
  reindexAllEmbeddings,
  getEmbeddingStatus,
} from '../services/rag/embedding.service.js';
import { AppError } from '../utils/AppError.js';
import { API_ERROR_CODES, RagRetrieveInput } from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Knowledge Layer, RAG Retrieval & Ingestion Controller (Phase 4 & 5)
// ─────────────────────────────────────────────────────────────────────────────

export async function listSources(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sources = Object.values(OFFICIAL_SOURCE_REGISTRY);
    res.status(200).json({
      success: true,
      data: sources,
    });
  } catch (error) {
    next(error);
  }
}

export async function listIngestionRuns(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const runs = await getIngestionRuns(limit);
    res.status(200).json({
      success: true,
      data: runs,
    });
  } catch (error) {
    next(error);
  }
}

export async function triggerIngest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sourceKey } = req.body;
    if (!sourceKey) {
      throw new AppError('sourceKey is required.', 400, API_ERROR_CODES.BAD_REQUEST);
    }

    const userId = req.user?.id;
    const result = await triggerOfficialIngestion(sourceKey, userId);

    res.status(200).json({
      success: true,
      message: 'Official source ingestion completed successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Phase 5: Retrieves source-grounded RAG context evidence blocks for a query.
 * Does NOT generate AI synthetic answers.
 */
export async function retrieveRagContextHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input: RagRetrieveInput = {
      query: req.body.query,
      topK: req.body.topK ? parseInt(req.body.topK, 10) : 5,
      filters: req.body.filters,
      maxCharacters: req.body.maxCharacters ? parseInt(req.body.maxCharacters, 10) : 6000,
    };

    if (!input.query || typeof input.query !== 'string' || input.query.trim().length === 0) {
      throw new AppError('Query string is required for RAG context retrieval.', 400, API_ERROR_CODES.BAD_REQUEST);
    }

    const context = await buildRagContext(input);
    res.status(200).json({
      success: true,
      data: context,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Phase 5: Reindexes embeddings across all stored standards.
 * Strictly restricted to ADMIN and DATA_MANAGER roles.
 */
export async function reindexEmbeddingsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { forceReindex, batchSize } = req.body || {};
    const result = await reindexAllEmbeddings({ forceReindex, batchSize });

    res.status(200).json({
      success: true,
      message: 'Knowledge embeddings reindexed successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Phase 5: Returns current embedding indexing status.
 */
export async function getEmbeddingStatusHandler(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = await getEmbeddingStatus();
    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
}
