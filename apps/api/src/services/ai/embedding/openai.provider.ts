import { EmbeddingProvider } from './types.js';
import { AppError } from '../../../utils/AppError.js';
import { API_ERROR_CODES } from '@bis/shared';
import { logger } from '../../../config/logger.js';

// ─────────────────────────────────────────────────────────────────────────────
//  OpenAI Embedding Provider
// ─────────────────────────────────────────────────────────────────────────────

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'openai';
  readonly model: string;
  readonly dimension: number;
  readonly version = '1.0.0';
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, model = 'text-embedding-3-small', dimension = 1536, baseUrl = 'https://api.openai.com/v1') {
    if (!apiKey) {
      throw new AppError('OPENAI_API_KEY is required for OpenAIEmbeddingProvider.', 500, API_ERROR_CODES.INTERNAL_SERVER_ERROR);
    }
    this.apiKey = apiKey;
    this.model = model;
    this.dimension = dimension;
    this.baseUrl = baseUrl;
  }

  async embedText(text: string): Promise<number[]> {
    const results = await this.embedBatch([text]);
    return results[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: texts,
          dimensions: this.dimension,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        logger.error(`OpenAI Embedding API error [${response.status}]`, { error: errText });
        throw new AppError(`OpenAI Embedding API failed: ${response.statusText}`, 502, API_ERROR_CODES.INTERNAL_SERVER_ERROR);
      }

      const json: any = await response.json();
      if (!json.data || !Array.isArray(json.data)) {
        throw new AppError('Invalid response structure from OpenAI Embedding API.', 502, API_ERROR_CODES.INTERNAL_SERVER_ERROR);
      }

      // Sort by index to preserve order
      const sorted = json.data.sort((a: any, b: any) => a.index - b.index);
      return sorted.map((item: any) => item.embedding);
    } catch (err: unknown) {
      if (err instanceof AppError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('OpenAI Embedding request failed', { error: msg });
      throw new AppError(`Embedding service error: ${msg}`, 502, API_ERROR_CODES.INTERNAL_SERVER_ERROR);
    }
  }
}
