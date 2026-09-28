import type { Request, Response, NextFunction } from 'express';
import { AUTH_COOKIE_NAME, verifyAuthToken, type TokenPayload } from '../services/session.service.js';
import { AppError } from '../utils/AppError.js';
import { API_ERROR_CODES, type UserRole } from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Express Request User Augmentation
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware: requireAuth
 * Extracts token from HTTP-only cookie or Authorization header.
 * Verifies JWT and attaches payload to req.user.
 * Returns 401 Unauthorized if token is missing or invalid.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  let token: string | undefined;

  // 1. Check HTTP-only cookie first (preferred browser method)
  if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
    token = req.cookies[AUTH_COOKIE_NAME];
  }

  // 2. Check Authorization Bearer header as secondary (useful for API clients/testing)
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7);
  }

  if (!token) {
    throw new AppError(
      'Authentication required. Please sign in to continue.',
      401,
      API_ERROR_CODES.UNAUTHORIZED,
    );
  }

  const payload = verifyAuthToken(token);

  if (!payload) {
    throw new AppError(
      'Session expired or invalid. Please sign in again.',
      401,
      API_ERROR_CODES.UNAUTHORIZED,
    );
  }

  req.user = payload;
  next();
}

/**
 * Middleware: requireRole
 * Role-based access control guard.
 * Prepares authorization for future admin/manager capabilities.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(
        'Authentication required.',
        401,
        API_ERROR_CODES.UNAUTHORIZED,
      );
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      throw new AppError(
        'You do not have permission to perform this action.',
        403,
        API_ERROR_CODES.FORBIDDEN,
      );
    }

    next();
  };
}

/**
 * Middleware: optionalAuth
 * Extracts and attaches user if valid token exists, but does NOT throw if missing.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  let token: string | undefined;

  if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
    token = req.cookies[AUTH_COOKIE_NAME];
  }

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7);
  }

  if (token) {
    const payload = verifyAuthToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
}
