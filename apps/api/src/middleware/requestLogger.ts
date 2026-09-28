import { v4 as uuidv4 } from 'uuid';
import type { Request, Response, NextFunction } from 'express';
import { log } from '../config/logger.js';

// ─────────────────────────────────────────────────────────────────────────────
//  Request Logger Middleware
//  Logs structured request metadata for every inbound HTTP request.
//  Sensitive query-string parameters are scrubbed before logging.
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

/**
 * Sensitive query-string keys that must never appear in logs.
 * Values are replaced with '[REDACTED]'.
 */
const SENSITIVE_QUERY_KEYS = new Set([
  'token', 'access_token', 'refresh_token', 'id_token',
  'password', 'passwd', 'pwd',
  'key', 'api_key', 'apikey', 'secret',
  'auth', 'authorization',
  'session', 'session_id',
  'code', 'client_secret',
]);

function sanitizeQuery(query: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(query)) {
    sanitized[k] = SENSITIVE_QUERY_KEYS.has(k.toLowerCase()) ? '[REDACTED]' : v;
  }
  return sanitized;
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  req.requestId = uuidv4();
  req.startTime = Date.now();

  res.setHeader('X-Request-ID', req.requestId);

  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    const status = res.statusCode;
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

    const meta: Record<string, unknown> = {
      status,
      durationMs: duration,
      requestId: req.requestId,
      // Use X-Forwarded-For from trusted proxy, fall back to socket IP
      ip: req.ip ?? req.socket?.remoteAddress,
      method: req.method,
    };

    // Only include sanitized query params if non-empty
    const q = req.query as Record<string, unknown>;
    if (Object.keys(q).length > 0) {
      meta.query = sanitizeQuery(q);
    }

    // Emit a dedicated security event for client errors / server errors to aid triage
    if (status >= 400) {
      meta.userAgent = req.headers['user-agent'] ?? 'unknown';
      meta.securityEvent = status >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR';
    }

    log[level](`${req.method} ${req.path}`, meta);
  });

  next();
}
