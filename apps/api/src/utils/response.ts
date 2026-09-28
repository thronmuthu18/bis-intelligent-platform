import type { ApiResponse, ApiError, ApiResponsePaginated, Pagination } from '@bis/shared';
import type { Response } from 'express';

// ─────────────────────────────────────────────────────────────────────────────
//  Response Helpers
//  Enforce consistent response envelope across all controllers.
// ─────────────────────────────────────────────────────────────────────────────

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const body: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
  res.status(statusCode).json(body);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: Pagination,
  statusCode = 200,
): void {
  const body: ApiResponsePaginated<T> = {
    success: true,
    data,
    pagination,
  };
  res.status(statusCode).json(body);
}

export function sendError(res: Response, statusCode: number, code: string, message: string, details?: unknown): void {
  const body: ApiError = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  };
  res.status(statusCode).json(body);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Pagination Helper
// ─────────────────────────────────────────────────────────────────────────────

export function buildPagination(page: number, limit: number, total: number): Pagination {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
