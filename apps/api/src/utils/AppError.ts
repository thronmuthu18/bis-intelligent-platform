import { API_ERROR_CODES, type ApiErrorCode } from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Application Error Class
//  Throw this from services/controllers to produce structured API errors.
// ─────────────────────────────────────────────────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ApiErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    code: ApiErrorCode = API_ERROR_CODES.INTERNAL_SERVER_ERROR,
    details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static notFound(message = 'Resource not found', code: ApiErrorCode = API_ERROR_CODES.NOT_FOUND) {
    return new AppError(message, 404, code);
  }

  static badRequest(message: string, code: ApiErrorCode = API_ERROR_CODES.BAD_REQUEST, details?: unknown) {
    return new AppError(message, 400, code, details);
  }

  static unauthorized(message = 'Unauthorized', code: ApiErrorCode = API_ERROR_CODES.UNAUTHORIZED) {
    return new AppError(message, 401, code);
  }

  static forbidden(message = 'Forbidden', code: ApiErrorCode = API_ERROR_CODES.FORBIDDEN) {
    return new AppError(message, 403, code);
  }

  static conflict(message: string, code: ApiErrorCode = API_ERROR_CODES.CONFLICT) {
    return new AppError(message, 409, code);
  }

  static serviceUnavailable(message = 'Service temporarily unavailable') {
    return new AppError(message, 503, API_ERROR_CODES.SERVICE_UNAVAILABLE);
  }

  static internal(message = 'Internal server error') {
    return new AppError(message, 500, API_ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
}
