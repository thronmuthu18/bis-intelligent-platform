import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

// ─────────────────────────────────────────────────────────────────────────────
//  Rate Limiters
//  Provides targeted throttling for sensitive endpoints to prevent brute-force,
//  credential stuffing, and bulk automation attacks.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Auth Rate Limiter
 * Protects /api/v1/auth/login and /api/v1/auth/register.
 * Intentionally tight in production to block credential stuffing.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: env.NODE_ENV === 'production' ? 25 : 200, // 25 attempts in prod, 200 in dev/test
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
    },
  },
});

/**
 * File Upload Rate Limiter
 * Protects document upload endpoints from bulk automated abuse.
 * Each IP is limited to 20 uploads per 15-minute window in production.
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 20 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many file uploads. Please try again in 15 minutes.',
    },
  },
});

/**
 * Write Operations Rate Limiter
 * Applied to sensitive mutation endpoints (create, update, delete).
 * 60 write operations per 15 minutes per IP in production.
 */
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 60 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many write operations. Please slow down and try again later.',
    },
  },
});
