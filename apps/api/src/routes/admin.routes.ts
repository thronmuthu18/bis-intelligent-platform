// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin & Knowledge Data Management Routes
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { AdminController } from '../controllers/admin.controller.js';

const router = Router();

// Enforce authentication AND elevated role (ADMIN or DATA_MANAGER) on ALL admin routes
router.use(requireAuth);
router.use(requireRole('ADMIN', 'DATA_MANAGER'));

// 1. Dashboard
router.get('/dashboard', AdminController.getDashboardMetrics);

// 2. Sources Registry
router.get('/sources', AdminController.getSources);
router.get('/sources/:id', AdminController.getSourceById);
router.post('/sources', AdminController.createSource);
router.put('/sources/:id', AdminController.updateSource);
router.post('/sources/:id/verify', AdminController.verifySource);
router.delete('/sources/:id', AdminController.deleteSource);

// 3. Standards
router.get('/standards', AdminController.getStandards);
router.get('/standards/:id', AdminController.getStandardById);
router.post('/standards', AdminController.createStandard);
router.put('/standards/:id', AdminController.updateStandard);
router.post('/standards/:id/publish', AdminController.publishStandard);
router.post('/standards/:id/archive', AdminController.archiveStandard);

// 4. QCOs
router.get('/qcos', AdminController.getQcos);
router.get('/qcos/:id', AdminController.getQcoById);
router.post('/qcos', AdminController.createQco);
router.put('/qcos/:id', AdminController.updateQco);
router.delete('/qcos/:id', AdminController.deleteQco);

// 5. Schemes
router.get('/schemes', AdminController.getSchemes);
router.get('/schemes/:id', AdminController.getSchemeById);
router.post('/schemes', AdminController.createScheme);
router.put('/schemes/:id', AdminController.updateScheme);
router.post('/schemes/map', AdminController.mapStandardScheme);

// 6. Knowledge Chunks
router.get('/knowledge', AdminController.getKnowledgeChunks);
router.get('/knowledge/:id', AdminController.getKnowledgeChunkById);
router.post('/knowledge/:id/reindex', AdminController.reindexKnowledgeChunk);

// 7. Embeddings
router.get('/embeddings/status', AdminController.getEmbeddingStatus);
router.post('/embeddings/reindex', AdminController.triggerReindex);

// 8. Ingestion Runs
router.get('/ingestion', AdminController.getIngestionRuns);
router.post('/ingestion/trigger', AdminController.triggerIngestionRun);

// 9. Laboratories
router.get('/laboratories', AdminController.getLaboratories);
router.post('/laboratories', AdminController.createLaboratory);
router.put('/laboratories/:id', AdminController.updateLaboratory);

// 10. Hallmarking Centres
router.get('/hallmarking-centres', AdminController.getHallmarkingCentres);
router.post('/hallmarking-centres', AdminController.createHallmarkingCentre);
router.put('/hallmarking-centres/:id', AdminController.updateHallmarkingCentre);

// 11. Consumer Services
router.get('/consumer-services', AdminController.getConsumerServices);
router.post('/consumer-services', AdminController.createConsumerService);
router.put('/consumer-services/:id', AdminController.updateConsumerService);

// 12. Regulatory Changes
router.get('/regulatory-changes', AdminController.getRegulatoryChanges);
router.post('/regulatory-changes', AdminController.createRegulatoryChange);

// 13. Data Quality Diagnostics
router.get('/data-quality', AdminController.getDataQualityReport);

// 14. Audit Logs
router.get('/audit', AdminController.getAuditLogs);

export default router;
