import { EmbeddingProvider } from './types.js';
import { MockEmbeddingProvider } from './mock.provider.js';
import { OpenAIEmbeddingProvider } from './openai.provider.js';
import { GeminiEmbeddingProvider } from './gemini.provider.js';
import { logger } from '../../../config/logger.js';

// ─────────────────────────────────────────────────────────────────────────────
//  Embedding Provider Factory
// ─────────────────────────────────────────────────────────────────────────────

let cachedProvider: EmbeddingProvider | null = null;

export function getEmbeddingProvider(): EmbeddingProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  const providerType = (process.env.EMBEDDING_PROVIDER || process.env.AI_PROVIDER || 'mock').toLowerCase();
  const openaiApiKey = process.env.OPENAI_API_KEY || (providerType === 'openai' ? process.env.AI_API_KEY : undefined);
  const geminiApiKey = process.env.GEMINI_API_KEY || (providerType === 'gemini' || providerType === 'google' ? process.env.AI_API_KEY : undefined);

  if (providerType === 'openai') {
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is missing. Set OPENAI_API_KEY or AI_API_KEY in environment.');
    }
    const model = process.env.EMBEDDING_MODEL || process.env.AI_MODEL || 'text-embedding-3-small';
    const dim = model.includes('large') ? 3072 : 1536;
    logger.info(`Initialized OpenAIEmbeddingProvider with model '${model}' (dim: ${dim})`);
    cachedProvider = new OpenAIEmbeddingProvider(openaiApiKey, model, dim);
    return cachedProvider;
  }

  if (providerType === 'gemini' || providerType === 'google') {
    if (!geminiApiKey) {
      throw new Error('Gemini API key is missing. Set GEMINI_API_KEY or AI_API_KEY in environment.');
    }
    const model =
      process.env.EMBEDDING_MODEL ||
      (process.env.AI_MODEL && process.env.AI_MODEL.includes('embedding')
        ? process.env.AI_MODEL
        : 'text-embedding-004');
    logger.info(`Initialized GeminiEmbeddingProvider with model '${model}' (dim: 768)`);
    cachedProvider = new GeminiEmbeddingProvider(geminiApiKey, model, 768);
    return cachedProvider;
  }

  // Default deterministic mock provider for testing and offline local development
  logger.info('Using MockEmbeddingProvider for deterministic offline retrieval (dim: 1536)');
  cachedProvider = new MockEmbeddingProvider(1536);
  return cachedProvider;
}

/**
 * Allows setting or resetting the provider (useful for unit tests).
 */
export function setEmbeddingProvider(provider: EmbeddingProvider | null): void {
  cachedProvider = provider;
}
