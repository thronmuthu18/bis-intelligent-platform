import crypto from 'crypto';
import { EmbeddingProvider } from './types.js';

// ─────────────────────────────────────────────────────────────────────────────
//  Deterministic Mock Embedding Provider (For Tests & Offline Dev)
// ─────────────────────────────────────────────────────────────────────────────

export class MockEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'mock';
  readonly model = 'mock-text-embedding-v1';
  readonly dimension: number = 1536;
  readonly version = '1.0.0';

  constructor(dimension: number = 1536) {
    this.dimension = dimension;
  }

  async embedText(text: string): Promise<number[]> {
    return this.generateDeterministicVector(text, this.dimension);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.embedText(t)));
  }

  /**
   * Generates a deterministic unit-normalized vector from text content.
   * Words contribute to specific vector components, ensuring semantic-like overlap properties.
   */
  private generateDeterministicVector(text: string, dimension: number): number[] {
    const vector = new Array(dimension).fill(0);
    const normalized = text.toLowerCase().trim();

    if (!normalized) {
      vector[0] = 1.0;
      return vector;
    }

    // Split into tokens
    const tokens = normalized.split(/[\s,.:;()/-]+/).filter(Boolean);

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const hash = crypto.createHash('sha256').update(token).digest();

      // Project each token across multiple dimensions
      for (let j = 0; j < 16; j++) {
        const idx = (hash[j * 2] * 256 + hash[j * 2 + 1]) % dimension;
        const weight = (hash[(j + 4) % hash.length] - 128) / 128.0;
        vector[idx] += weight;
      }
    }

    // Include full text hash component
    const fullHash = crypto.createHash('sha256').update(normalized).digest();
    for (let k = 0; k < dimension; k++) {
      const byte = fullHash[k % fullHash.length];
      vector[k] += Math.sin((byte / 255.0) * Math.PI * 2) * 0.1;
    }

    // Normalize to unit length (L2 norm = 1.0)
    let sumSq = 0;
    for (let k = 0; k < dimension; k++) {
      sumSq += vector[k] * vector[k];
    }
    const magnitude = Math.sqrt(sumSq) || 1.0;

    for (let k = 0; k < dimension; k++) {
      vector[k] = parseFloat((vector[k] / magnitude).toFixed(6));
    }

    return vector;
  }
}
