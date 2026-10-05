import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, ApiClientError } from '../services/api/client';
import { documentService } from '../services/api/document.service';

describe('ApiClient & Error Handling Regression Tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('1. Successfully parses responses that omit "success: true" without throwing TypeError on undefined error.message', async () => {
    // Simulates the exact response from /api/v1/products/:id/documents when there are 0 documents
    const mockResponse = {
      status: 'success',
      data: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await apiClient.get<unknown[]>('/products/test-id/documents');
    expect(result).toEqual([]);
  });

  it('2. Successfully unwraps standard ApiResponse envelopes { success: true, data: ... }', async () => {
    const mockResponse = {
      success: true,
      data: { id: 'prod-1', name: 'LED Light Fitting' },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await apiClient.get<{ id: string; name: string }>('/products/prod-1');
    expect(result).toEqual({ id: 'prod-1', name: 'LED Light Fitting' });
  });

  it('3. Safely extracts errors formatted with standard @bis/shared ApiError { success: false, error: { message, code } }', async () => {
    const mockErrorResponse = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Product compliance dossier not found',
        details: { entityId: 'prod-999' },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => mockErrorResponse,
    });

    await expect(apiClient.get('/products/prod-999/documents')).rejects.toThrow(ApiClientError);

    try {
      await apiClient.get('/products/prod-999/documents');
    } catch (err) {
      const apiErr = err as ApiClientError;
      expect(apiErr).toBeInstanceOf(ApiClientError);
      expect(apiErr.message).toBe('Product compliance dossier not found');
      expect(apiErr.code).toBe('NOT_FOUND');
      expect(apiErr.statusCode).toBe(404);
      expect(apiErr.details).toEqual({ entityId: 'prod-999' });
    }
  });

  it('4. Safely extracts errors that omit .error object (e.g., { success: false, message: ... }) without reading undefined .message', async () => {
    const mockErrorResponse = {
      success: false,
      message: 'Authentication session expired. Please log in again.',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => mockErrorResponse,
    });

    try {
      await apiClient.get('/products/test-id/documents');
      expect.fail('Should have thrown an ApiClientError');
    } catch (err) {
      const apiErr = err as ApiClientError;
      expect(apiErr).toBeInstanceOf(ApiClientError);
      // Crucial: Must be the actual message, NOT "Cannot read properties of undefined (reading 'message')"
      expect(apiErr.message).toBe('Authentication session expired. Please log in again.');
      expect(apiErr.code).toBe('UNAUTHORIZED');
      expect(apiErr.statusCode).toBe(401);
    }
  });

  it('5. Safely handles HTTP 500 error responses with empty JSON or non-standard payloads', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    try {
      await apiClient.get('/products/test-id/documents');
      expect.fail('Should have thrown an ApiClientError');
    } catch (err) {
      const apiErr = err as ApiClientError;
      expect(apiErr).toBeInstanceOf(ApiClientError);
      expect(apiErr.message).toBe('Request failed with status 500');
      expect(apiErr.statusCode).toBe(500);
    }
  });

  it('6. Safely handles non-JSON HTTP errors (e.g. 502 HTML Gateway error) without throwing syntax exceptions', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('Unexpected token < in JSON at position 0');
      },
    });

    try {
      await apiClient.get('/products/test-id/documents');
      expect.fail('Should have thrown an ApiClientError');
    } catch (err) {
      const apiErr = err as ApiClientError;
      expect(apiErr).toBeInstanceOf(ApiClientError);
      expect(apiErr.message).toBe('Request failed with status 502');
      expect(apiErr.statusCode).toBe(502);
    }
  });

  it('7. documentService.getDocuments returns an empty array when backend returns { status: "success", data: [] }', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        status: 'success',
        data: [],
      }),
    });

    const docs = await documentService.getDocuments('prod-led-1');
    expect(Array.isArray(docs)).toBe(true);
    expect(docs).toHaveLength(0);
  });

  it('8. documentService.getCompleteness returns completeness object when backend returns { status: "success", data: { score: 0 } }', async () => {
    const mockCompleteness = {
      score: 0,
      status: 'MISSING_DOCUMENTS',
      totalRequired: 3,
      verifiedCount: 0,
      matchedCount: 0,
      needsReviewCount: 0,
      missingCount: 3,
      expiredCount: 0,
      missingDocumentTypes: [],
      checklistBreakdown: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        status: 'success',
        data: mockCompleteness,
      }),
    });

    const comp = await documentService.getCompleteness('prod-led-1');
    expect(comp).toBeDefined();
    expect(comp.score).toBe(0);
    expect(comp.status).toBe('MISSING_DOCUMENTS');
  });
});
