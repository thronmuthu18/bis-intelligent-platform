// ─────────────────────────────────────────────────────────────────────────────
//  Phase 12 — Multilingual & Accessibility (i18n) Routes
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { I18nController } from '../controllers/i18n.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Public language catalog
router.get('/languages', I18nController.getLanguages);

// Public terminology dictionary
router.get('/terms', I18nController.getAllTerms);
router.get('/terms/:key', I18nController.getTermByKey);

// Translation API (Public with rate-limit protection)
router.post('/translate', I18nController.translate);

// User preferences (Authenticated)
router.get('/preferences', requireAuth, I18nController.getPreferences);
router.put('/preferences', requireAuth, I18nController.updatePreferences);

export default router;
