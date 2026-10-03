import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import type { CookieOptions } from 'express';
import { env, INSECURE_DEV_JWT_SECRETS } from '../config/env.js';

// ─────────────────────────────────────────────────────────────────────────────
//  Session & Token Service
//  Manages JWT signing, verification, and HttpOnly cookie configurations.
// ─────────────────────────────────────────────────────────────────────────────

export const AUTH_COOKIE_NAME = 'bis_auth_token';

// 7 days in milliseconds
export const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  name: string;
}

const DEFAULT_JWT_SECRET = INSECURE_DEV_JWT_SECRETS[0];

export function getJwtSecret(): Secret {
  const secret = env.JWT_SECRET;

  if (!secret || INSECURE_DEV_JWT_SECRETS.includes(secret)) {
    if (env.NODE_ENV === 'production') {
      // Hard failure: running production with a default / missing secret is a critical security risk
      console.error(
        '\n[SECURITY CRITICAL] JWT_SECRET is not set or is using the insecure development default.\n' +
        'Set a cryptographically strong, unique JWT_SECRET in your production environment.\n' +
        'Refusing to start.\n',
      );
      process.exit(1);
    } else {
      // Warn once during startup in non-production environments
      console.warn(
        '[SECURITY WARNING] Using the default development JWT_SECRET. ' +
        'This must NEVER be used in production. Set JWT_SECRET in your .env file.',
      );
    }
  }

  return (secret || DEFAULT_JWT_SECRET) as Secret;
}

export function getAuthCookieOptions(): CookieOptions {
  const isProduction = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: '/',
  };
}

export function createAuthToken(payload: TokenPayload): string {
  const secret = getJwtSecret();
  const options: SignOptions = {
    expiresIn: '7d',
    issuer: 'bis-intelligent-platform',
    audience: 'bis-users',
  };
  return jwt.sign(payload, secret, options);
}

export function verifyAuthToken(token: string): TokenPayload | null {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, {
      issuer: 'bis-intelligent-platform',
      audience: 'bis-users',
    }) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}
