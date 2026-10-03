import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db/client.js';
import { registerUser, loginUser, getUserById } from '../services/auth.service.js';
import { AUTH_COOKIE_NAME, getAuthCookieOptions, createAuthToken } from '../services/session.service.js';
import { sendSuccess } from '../utils/response.js';

// ─────────────────────────────────────────────────────────────────────────────
//  Validation Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters'),
  email: z
    .string({ required_error: 'Official email is required' })
    .trim()
    .email('Please provide a valid email address')
    .max(255, 'Email must not exceed 255 characters'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    // 128-char max prevents DoS via bcrypt long-input attacks
    .max(128, 'Password must not exceed 128 characters')
    .refine(
      (p) => /[a-zA-Z]/.test(p),
      'Password must contain at least one letter',
    )
    .refine(
      (p) => /[0-9]/.test(p),
      'Password must contain at least one number',
    ),
  organizationName: z
    .string()
    .trim()
    .max(150, 'Organization name must not exceed 150 characters')
    .optional(),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Please provide a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

// ─────────────────────────────────────────────────────────────────────────────
//  Auth Controller Handlers
// ─────────────────────────────────────────────────────────────────────────────

export async function registerHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const validated = registerSchema.parse(req.body);
    const { user, token } = await registerUser(validated);

    // Set secure HTTP-only cookie
    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    sendSuccess(res, { user, token }, 201);
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const validated = loginSchema.parse(req.body);
    const { user, token } = await loginUser(validated);

    // Set secure HTTP-only cookie
    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    sendSuccess(res, { user, token }, 200);
  } catch (err) {
    next(err);
  }
}

export async function logoutHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // If authenticated user is logging out, create audit record
    if (req.user?.id) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'USER_LOGOUT',
          entityType: 'User',
          entityId: req.user.id,
        },
      }).catch(() => {});
    }

    // Invalidate cookie securely
    res.clearCookie(AUTH_COOKIE_NAME, {
      ...getAuthCookieOptions(),
      maxAge: 0,
    });

    sendSuccess(res, { message: 'Logged out successfully' }, 200);
  } catch (err) {
    next(err);
  }
}

export async function getMeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    const user = await getUserById(userId);

    const token = createAuthToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    sendSuccess(res, { user, token }, 200);
  } catch (err) {
    next(err);
  }
}
