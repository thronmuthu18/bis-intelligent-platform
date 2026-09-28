import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError.js';
import { sendError } from '../utils/response.js';
import { log } from '../config/logger.js';
import { env } from '../config/env.js';
import { API_ERROR_CODES } from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Global Error Handler Middleware
//  Must be registered LAST in the Express middleware chain.
//  Translates known error types to safe, structured JSON responses.
//  NEVER leaks internal stack traces, DB errors, or raw messages in production.
// ─────────────────────────────────────────────────────────────────────────────

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // ── Zod validation errors ──────────────────────────────────────────────────
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    sendError(res, 400, API_ERROR_CODES.VALIDATION_ERROR, 'Request validation failed', details);
    return;
  }

  // ── Known operational errors ───────────────────────────────────────────────
  if (err instanceof AppError) {
    log.warn('Operational error', {
      code: err.code,
      statusCode: err.statusCode,
      message: err.message,
      path: req.path,
      requestId: req.requestId,
    });
    sendError(
      res,
      err.statusCode,
      err.code,
      err.message,
      env.NODE_ENV === 'development' ? err.details : undefined,
    );
    return;
  }

  // ── Prisma-specific errors — translate without leaking schema details ───────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Unique constraint violation
    if (err.code === 'P2002') {
      log.warn('Database unique constraint violation', {
        prismaCode: err.code,
        path: req.path,
        requestId: req.requestId,
      });
      sendError(res, 409, API_ERROR_CODES.CONFLICT, 'A record with this information already exists.');
      return;
    }
    // P2025: Record not found
    if (err.code === 'P2025') {
      log.warn('Database record not found', {
        prismaCode: err.code,
        path: req.path,
        requestId: req.requestId,
      });
      sendError(res, 404, API_ERROR_CODES.NOT_FOUND, 'The requested resource was not found.');
      return;
    }
    // All other Prisma known errors — log internally, return generic 500
    log.error('Prisma known request error', {
      prismaCode: err.code,
      message: env.NODE_ENV === 'development' ? err.message : '[redacted]',
      path: req.path,
      requestId: req.requestId,
    });
    sendError(
      res,
      500,
      API_ERROR_CODES.INTERNAL_SERVER_ERROR,
      env.NODE_ENV === 'production'
        ? 'A database error occurred. Please try again later.'
        : `Database error: ${err.message}`,
    );
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    log.error('Prisma validation error', {
      message: env.NODE_ENV === 'development' ? err.message : '[redacted]',
      path: req.path,
      requestId: req.requestId,
    });
    sendError(
      res,
      400,
      API_ERROR_CODES.BAD_REQUEST,
      env.NODE_ENV === 'production'
        ? 'Invalid data submitted. Please check your request.'
        : `Prisma validation: ${err.message}`,
    );
    return;
  }

  // ── Unknown / programming errors ───────────────────────────────────────────
  const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
  const stack = err instanceof Error ? err.stack : undefined;

  log.error('Unhandled error', {
    message: errorMessage,
    stack: env.NODE_ENV !== 'production' ? stack : '[redacted]',
    path: req.path,
    method: req.method,
    requestId: req.requestId,
  });

  // Never expose stack traces or internals in production
  const responseMessage =
    env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : errorMessage;

  sendError(res, 500, API_ERROR_CODES.INTERNAL_SERVER_ERROR, responseMessage);
}

// ─────────────────────────────────────────────────────────────────────────────
//  404 Not Found Handler
// ─────────────────────────────────────────────────────────────────────────────

export function notFoundHandler(req: Request, res: Response): void {
  sendError(
    res,
    404,
    API_ERROR_CODES.NOT_FOUND,
    `Route ${req.method} ${req.path} not found`,
  );
}
