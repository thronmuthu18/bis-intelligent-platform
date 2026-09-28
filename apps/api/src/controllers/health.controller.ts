import type { Request, Response, NextFunction } from 'express';
import { checkDatabaseHealth } from '../db/client.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { API_ERROR_CODES, PLATFORM } from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Health Controller
// ─────────────────────────────────────────────────────────────────────────────

export async function getHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dbHealth = await checkDatabaseHealth();

    const healthData = {
      service: 'bis-intelligent-platform-api',
      status: 'healthy' as const,
      version: PLATFORM.version,
      timestamp: new Date().toISOString(),
      database: {
        connected: dbHealth.connected,
        latencyMs: dbHealth.latencyMs,
        ...(dbHealth.error ? { error: dbHealth.error } : {}),
      },
    };

    if (!dbHealth.connected) {
      sendError(
        res,
        503,
        API_ERROR_CODES.DATABASE_UNAVAILABLE,
        'API is running but database connection failed',
      );
      return;
    }

    sendSuccess(res, healthData);
  } catch (err) {
    next(err);
  }
}

export async function getHealthSimple(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, {
    service: 'bis-intelligent-platform-api',
    status: 'healthy',
  });
}

/**
 * GET /api/v1/health/liveness (or /api/v1/health/live)
 * Ultra-fast process liveness check. Always returns 200 without DB calls.
 */
export async function getLiveness(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, {
    service: 'bis-intelligent-platform-api',
    status: 'healthy',
    check: 'liveness',
    timestamp: new Date().toISOString(),
  });
}

/**
 * GET /api/v1/health/readiness (or /api/v1/health/ready)
 * Readiness check validating database connectivity without leaking credentials.
 */
export async function getReadiness(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dbHealth = await checkDatabaseHealth();

    if (!dbHealth.connected) {
      sendError(
        res,
        503,
        API_ERROR_CODES.DATABASE_UNAVAILABLE,
        'API is not ready: database connectivity check failed',
        { database: 'disconnected', latencyMs: dbHealth.latencyMs },
      );
      return;
    }

    sendSuccess(res, {
      service: 'bis-intelligent-platform-api',
      status: 'ready',
      check: 'readiness',
      database: {
        status: 'connected',
        latencyMs: dbHealth.latencyMs,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
