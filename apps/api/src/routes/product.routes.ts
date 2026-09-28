import { Router } from 'express';
import {
  createProductHandler,
  getProductsHandler,
  getProductByIdHandler,
  updateProductHandler,
  archiveProductHandler,
  getProductStatsHandler,
} from '../controllers/product.controller.js';
import {
  analyzeProductStandardsHandler,
  getLatestAnalysisHandler,
  saveProductReviewHandler,
  getProductReviewsHandler,
  getProductAttributesHandler,
  upsertProductAttributesHandler,
} from '../controllers/product-intelligence.controller.js';
import { certificationController } from '../controllers/certification.controller.js';
import {
  analyzeTesting,
  getTestingAnalysis,
  getTestRequirements,
  getLaboratories,
  createLaboratoryReview,
  getLaboratoryReviews,
} from '../controllers/testing.controller.js';
import {
  documentController,
  documentUploadMiddleware,
} from '../controllers/document.controller.js';
import { complianceController } from '../controllers/compliance.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';

// ─────────────────────────────────────────────────────────────────────────────
//  Product Routes (/api/v1/products)
//  All endpoints require authenticated user session.
// ─────────────────────────────────────────────────────────────────────────────

const productRouter = Router();

// Protect all product endpoints with authentication middleware
productRouter.use(requireAuth);

// Basic Product CRUD
productRouter.post('/', createProductHandler);
productRouter.get('/', getProductsHandler);
productRouter.get('/stats', getProductStatsHandler);
productRouter.get('/:id', getProductByIdHandler);
productRouter.patch('/:id', updateProductHandler);
productRouter.delete('/:id', archiveProductHandler);

// Phase 6 Product Intelligence & Standard Matching
productRouter.post('/:id/intelligence/analyze', analyzeProductStandardsHandler);
productRouter.get('/:id/intelligence/analysis', getLatestAnalysisHandler);
productRouter.post('/:id/intelligence/reviews', saveProductReviewHandler);
productRouter.get('/:id/intelligence/reviews', getProductReviewsHandler);
productRouter.get('/:id/attributes', getProductAttributesHandler);
productRouter.post('/:id/attributes', upsertProductAttributesHandler);

// Phase 7 Certification Intelligence & Scheme Recommendation
productRouter.post('/:id/certification/analyze', certificationController.analyze.bind(certificationController));
productRouter.get('/:id/certification', certificationController.getLatest.bind(certificationController));
productRouter.get('/:id/certification/schemes/:schemeId', certificationController.getSchemeDetail.bind(certificationController));
productRouter.post('/:id/certification/reviews', certificationController.saveReview.bind(certificationController));
productRouter.get('/:id/certification/reviews', certificationController.getReviews.bind(certificationController));

// Phase 8 Testing & Laboratory Intelligence
productRouter.post('/:id/testing/analyze', analyzeTesting);
productRouter.get('/:id/testing', getTestingAnalysis);
productRouter.get('/:id/testing/requirements', getTestRequirements);
productRouter.get('/:id/testing/laboratories', getLaboratories);
productRouter.post('/:id/testing/laboratories/reviews', createLaboratoryReview);
productRouter.get('/:id/testing/laboratories/reviews', getLaboratoryReviews);

// Phase 9 Document Intelligence
productRouter.post('/:id/documents', uploadRateLimiter, documentUploadMiddleware, documentController.uploadDocument.bind(documentController));
productRouter.get('/:id/documents', documentController.getDocuments.bind(documentController));
productRouter.get('/:id/documents/completeness', documentController.getCompleteness.bind(documentController));
productRouter.get('/:id/documents/requirements', documentController.getRequirementMappings.bind(documentController));
productRouter.get('/:id/documents/:documentId', documentController.getDocumentById.bind(documentController));
productRouter.post('/:id/documents/:documentId/verify', documentController.verifyDocument.bind(documentController));
productRouter.delete('/:id/documents/:documentId', documentController.deleteDocument.bind(documentController));
productRouter.get('/:id/documents/:documentId/evidence', documentController.getDocumentEvidence.bind(documentController));
productRouter.get('/:id/documents/:documentId/download', documentController.downloadDocument.bind(documentController));

// Phase 10 Compliance Automation & Journey Orchestration
productRouter.post('/:id/compliance/initialize', complianceController.initializeJourney.bind(complianceController));
productRouter.get('/:id/compliance', complianceController.getJourneyOverview.bind(complianceController));
productRouter.post('/:id/compliance/recalculate', complianceController.recalculateJourney.bind(complianceController));
productRouter.get('/:id/compliance/tasks', complianceController.getTasks.bind(complianceController));
productRouter.post('/:id/compliance/tasks/:taskId/complete', complianceController.completeTask.bind(complianceController));
productRouter.post('/:id/compliance/tasks/:taskId/reopen', complianceController.reopenTask.bind(complianceController));
productRouter.get('/:id/compliance/readiness', complianceController.getReadiness.bind(complianceController));
productRouter.get('/:id/compliance/timeline', complianceController.getTimeline.bind(complianceController));
productRouter.get('/:id/compliance/dossier', complianceController.getDossier.bind(complianceController));
productRouter.post('/:id/compliance/dossier/compile', complianceController.compileDossier.bind(complianceController));
productRouter.post('/:id/compliance/dossier/validate', complianceController.validateDossier.bind(complianceController));
productRouter.get('/:id/compliance/alerts', complianceController.getAlerts.bind(complianceController));
productRouter.post('/:id/compliance/alerts/:alertId/read', complianceController.markAlertRead.bind(complianceController));
productRouter.get('/:id/compliance/regulatory-impact', complianceController.getRegulatoryImpact.bind(complianceController));

export { productRouter };


