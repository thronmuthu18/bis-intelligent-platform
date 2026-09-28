import type { Request, Response, NextFunction } from 'express';

// ─────────────────────────────────────────────────────────────────────────────
//  Input Sanitization Middleware
//  Strips HTML tags and null bytes from all string fields in JSON request bodies.
//  This is a defence-in-depth measure — primary validation is Zod schema-based.
//  Note: This does NOT replace output encoding; always encode on output too.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recursively strips HTML tags and null bytes from all string values.
 * Operates in-place on the object tree.
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return (
      value
        // Remove null bytes (can cause truncation in some databases)
        .replace(/\0/g, '')
        // Strip HTML tags (defence against stored XSS via API)
        .replace(/<[^>]*>/g, '')
    );
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      sanitized[k] = sanitizeValue(v);
    }
    return sanitized;
  }

  return value;
}

/**
 * Express middleware that sanitizes the request body in-place before
 * it reaches route handlers and Zod validators.
 */
export function inputSanitizer(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  next();
}
