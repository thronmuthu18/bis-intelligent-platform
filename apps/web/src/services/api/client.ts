import type { ApiResult, ApiError } from '@bis/shared';
import { config } from '@/lib/config';

// ─────────────────────────────────────────────────────────────────────────────
//  API Client Error Class
// ─────────────────────────────────────────────────────────────────────────────

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, code: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Request Options
// ─────────────────────────────────────────────────────────────────────────────

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Token Management (to be expanded in Phase 1 — Auth)
// ─────────────────────────────────────────────────────────────────────────────

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Core Request Function
// ─────────────────────────────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, signal } = options;

  const url = `${config.apiBaseUrl}${path}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...headers,
  };

  if (accessToken) {
    requestHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
      credentials: 'include',
    });
  } catch {
    throw new ApiClientError(
      'Unable to connect to the server. Please check your connection.',
      'NETWORK_ERROR',
      0,
    );
  }

  let data: ApiResult<T>;

  try {
    data = (await response.json()) as ApiResult<T>;
  } catch {
    throw new ApiClientError(
      'The server returned an invalid response.',
      'INVALID_RESPONSE',
      response.status,
    );
  }

  if (!data.success) {
    const errorData = data as ApiError;
    throw new ApiClientError(
      errorData.error.message,
      errorData.error.code,
      response.status,
      errorData.error.details,
    );
  }

  return (data as { success: true; data: T }).data;
}

// ─────────────────────────────────────────────────────────────────────────────
//  HTTP Method Helpers
// ─────────────────────────────────────────────────────────────────────────────

export const apiClient = {
  get: <T>(path: string, signal?: AbortSignal): Promise<T> =>
    request<T>(path, { method: 'GET', signal }),

  post: <T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> =>
    request<T>(path, { method: 'POST', body, signal }),

  put: <T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> =>
    request<T>(path, { method: 'PUT', body, signal }),

  patch: <T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> =>
    request<T>(path, { method: 'PATCH', body, signal }),

  delete: <T>(path: string, signal?: AbortSignal): Promise<T> =>
    request<T>(path, { method: 'DELETE', signal }),
};
