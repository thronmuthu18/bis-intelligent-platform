// ─────────────────────────────────────────────────────────────────────────────
//  Embedding Provider Interface & Types (Phase 5)
// ─────────────────────────────────────────────────────────────────────────────

export interface EmbeddingProvider {
  /** Provider identifier (e.g. 'openai', 'gemini', 'mock') */
  readonly name: string;

  /** Embedding model name (e.g. 'text-embedding-3-small', 'text-embedding-004') */
  readonly model: string;

  /** Output vector dimension (e.g. 1536, 768) */
  readonly dimension: number;

  /** Embedding version tag for cache invalidation */
  readonly version: string;

  /**
   * Generates embedding vector for a single text string.
   */
  embedText(text: string): Promise<number[]>;

  /**
   * Generates embedding vectors for a batch of text strings.
   */
  embedBatch(texts: string[]): Promise<number[][]>;
}
