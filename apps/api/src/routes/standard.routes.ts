import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  listStandards,
  searchStandardsHandler,
  getStandard,
  listStandardVersions,
  listStandardAmendments,
  listStandardQCOs,
  listStandardManuals,
} from '../controllers/standard.controller.js';

// ─────────────────────────────────────────────────────────────────────────────
//  Standards Routes
// ─────────────────────────────────────────────────────────────────────────────

const standardRouter = Router();

// All standards knowledge endpoints require authentication
standardRouter.use(requireAuth);

standardRouter.get('/', listStandards);
standardRouter.get('/search', searchStandardsHandler);
standardRouter.get('/:id', getStandard);
standardRouter.get('/:id/versions', listStandardVersions);
standardRouter.get('/:id/amendments', listStandardAmendments);
standardRouter.get('/:id/qcos', listStandardQCOs);
standardRouter.get('/:id/manuals', listStandardManuals);

export { standardRouter };
