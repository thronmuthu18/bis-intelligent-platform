// ─────────────────────────────────────────────────────────────────────────────
//  Phase 16 — User Activity Routes (/api/v1/activity)
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { AssistantController } from '../controllers/assistant.controller.js';

const activityRouter = Router();

activityRouter.use(requireAuth);

activityRouter.get('/', AssistantController.getUserActivity);

export { activityRouter };
