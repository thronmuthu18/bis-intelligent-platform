import { EmbeddingProvider } from './types.js';
import { AppError } from '../../../utils/AppError.js';
import { API_ERROR_CODES } from '@bis/shared';
import { logger } from '../../../config/logger.js';

// ─────────────────────────────────────────────────────────────────────────────
//  Google Gemini Embedding Provider
// ─────────────────────────────────────────────────────────────────────────────

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'gemini';
  readonly model: string;
  readonly dimension: number;
  readonly version = '1.0.0';
  private apiKey: string;

  constructor(apiKey: string, model = 'text-embedding-004', dimension = 768) {
    if (!apiKey) {
      throw new AppError('GEMINI_API_KEY is required for GeminiEmbeddingProvider.', 500, API_ERROR_CODES.INTERNAL_SERVER_ERROR);
    }
    this.apiKey = apiKey;
    this.model = model;
    this.dimension = dimension;
  }

  async embedText(text: string): Promise<number[]> {
    const results = await this.embedBatch([text]);
    return results[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:batchEmbedContents?key=${this.apiKey}`;
      const requests = texts.map((text) => ({
        model: `models/${this.model}`,
        content: {
          parts: [{ text }],
        },
      }));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      });

      if (!response.ok) {
        const errText = await response.text();
        logger.error(`Gemini Embedding API error [${response.status}]`, { error: errText });
        throw new AppError(`Gemini Embedding API failed: ${response.statusText}`, 502, API_ERROR_CODES.INTERNAL_SERVER_ERROR);
      }

      const json: any = await response.json();
      if (!json.embeddings || !Array.isArray(json.embeddings)) {
        throw new AppError('Invalid response structure from Gemini Embedding API.', 502, API_ERROR_CODES.INTERNAL_SERVER_ERROR);
      }

      return json.embeddings.map((item: any) => item.values);
    } catch (err: unknown) {
      if (err instanceof AppError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('Gemini Embedding request failed', { error: msg });
      throw new AppError(`Embedding service error: ${msg}`, 502, API_ERROR_CODES.INTERNAL_SERVER_ERROR);
    }
  }
}
