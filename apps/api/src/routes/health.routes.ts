import { Router } from 'express';
import {
  getHealth,
  getHealthSimple,
  getLiveness,
  getReadiness,
} from '../controllers/health.controller.js';

const router = Router();

/**
 * GET /api/v1/health
 * Returns API and database health status.
 */
router.get('/', getHealth);
router.get('/live', getLiveness);
router.get('/liveness', getLiveness);
router.get('/ready', getReadiness);
router.get('/readiness', getReadiness);
router.get('/simple', getHealthSimple);

export { router as healthRouter };
