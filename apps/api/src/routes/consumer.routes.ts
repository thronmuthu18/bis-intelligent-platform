// ─────────────────────────────────────────────────────────────────────────────
//  Consumer Routes — Phase 11 Citizen & Consumer Services
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { ConsumerController } from '../controllers/consumer.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// 1. Citizen Services Catalog
router.get('/services', ConsumerController.getServices);
router.get('/services/:serviceId', ConsumerController.getServiceById);

// 2. Plain-Language Indian Standards Search
router.get('/standards/search', ConsumerController.searchStandards);

// 3. BIS Licence Verification (Optional Auth to allow saving history)
router.post('/licence/verify', optionalAuth, ConsumerController.verifyLicence);

// 4. Assaying & Hallmarking Centres Discovery
router.get('/hallmarking-centres', ConsumerController.getHallmarkingCentres);
router.get('/hallmarking-centres/:id', optionalAuth, ConsumerController.getHallmarkingCentreById);

// 5. Hallmarking Educational Intelligence
router.get('/hallmarking/education', ConsumerController.getHallmarkingEducation);

// 6. HUID Verification (Optional Auth to allow saving history)
router.post('/huid/verify', optionalAuth, ConsumerController.verifyHuid);

// 7. Saved Verifications (Authenticated)
router.get('/verifications', requireAuth, ConsumerController.getVerifications);
router.delete('/verifications/:id', requireAuth, ConsumerController.deleteVerification);

// 8. Official Citizen Guidance & Complaint Redressal
router.get('/guidance/:serviceType', optionalAuth, ConsumerController.getGuidance);

export default router;
