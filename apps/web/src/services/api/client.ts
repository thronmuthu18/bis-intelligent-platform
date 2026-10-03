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
//  Token Management & Browser Refresh Persistence
// ─────────────────────────────────────────────────────────────────────────────

const AUTH_TOKEN_KEY = 'bis_auth_token';

function getPersistedToken(): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  }
  return null;
}

let accessToken: string | null = getPersistedToken();

export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      if (token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    } catch {
      // LocalStorage access might fail under restricted sandbox/privacy modes
    }
  }
}

export function clearAccessToken(): void {
  setAccessToken(null);
}

export function getAccessToken(): string | null {
  if (!accessToken) {
    accessToken = getPersistedToken();
  }
  return accessToken;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Core Request Function
// ─────────────────────────────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, signal } = options;

  const url = `${config.apiBaseUrl}${path}`;

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  if (!isFormData) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const token = getAccessToken();
  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
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
