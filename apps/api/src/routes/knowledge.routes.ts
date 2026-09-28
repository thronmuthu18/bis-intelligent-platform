import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import {
  listSources,
  listIngestionRuns,
  triggerIngest,
  retrieveRagContextHandler,
  reindexEmbeddingsHandler,
  getEmbeddingStatusHandler,
} from '../controllers/knowledge.controller.js';

// ─────────────────────────────────────────────────────────────────────────────
//  Knowledge Layer, RAG Retrieval & Ingestion Routes (Phase 4 & 5)
// ─────────────────────────────────────────────────────────────────────────────

const knowledgeRouter = Router();

knowledgeRouter.use(requireAuth);

// Read-only knowledge and RAG retrieval for all authenticated users
knowledgeRouter.get('/sources', listSources);
knowledgeRouter.get('/ingestion-runs', listIngestionRuns);
knowledgeRouter.post('/retrieve', retrieveRagContextHandler);
knowledgeRouter.post('/rag-context', retrieveRagContextHandler);

// Admin & Data Manager protected embedding operations
knowledgeRouter.post('/ingest', requireRole('ADMIN', 'DATA_MANAGER'), triggerIngest);
knowledgeRouter.post('/embeddings/reindex', requireRole('ADMIN', 'DATA_MANAGER'), reindexEmbeddingsHandler);
knowledgeRouter.get('/embeddings/status', requireRole('ADMIN', 'DATA_MANAGER'), getEmbeddingStatusHandler);

export { knowledgeRouter };
