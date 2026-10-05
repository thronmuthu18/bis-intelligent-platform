import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getEmbeddingProvider,
  setEmbeddingProvider,
} from '../src/services/ai/embedding/factory.js';
import { MockEmbeddingProvider } from '../src/services/ai/embedding/mock.provider.js';

describe('AI Provider Production Fail-Fast Behavior', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    setEmbeddingProvider(null);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    setEmbeddingProvider(null);
    vi.restoreAllMocks();
  });

  it('should return MockEmbeddingProvider by default when AI_PROVIDER is mock', () => {
    process.env.AI_PROVIDER = 'mock';
    delete process.env.EMBEDDING_PROVIDER;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const provider = getEmbeddingProvider();
    expect(provider).toBeInstanceOf(MockEmbeddingProvider);
    expect(provider.name).toBe('mock');
    expect(provider.dimension).toBe(1536);
  });

  it('should fail fast with explicit error when AI_PROVIDER is openai but API key is missing', () => {
    process.env.AI_PROVIDER = 'openai';
    delete process.env.OPENAI_API_KEY;
    delete process.env.AI_API_KEY;

    expect(() => getEmbeddingProvider()).toThrow('OpenAI API key is missing. Set OPENAI_API_KEY or AI_API_KEY in environment.');
  });

  it('should fail fast with explicit error when AI_PROVIDER is gemini but API key is missing', () => {
    process.env.AI_PROVIDER = 'gemini';
    delete process.env.GEMINI_API_KEY;
    delete process.env.AI_API_KEY;

    expect(() => getEmbeddingProvider()).toThrow('Gemini API key is missing. Set GEMINI_API_KEY or AI_API_KEY in environment.');
  });

  it('should initialize GeminiEmbeddingProvider when AI_PROVIDER is gemini and GEMINI_API_KEY is provided', () => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'test_gemini_key_123';
    delete process.env.AI_API_KEY;

    const provider = getEmbeddingProvider();
    expect(provider.name).toBe('gemini');
    expect(provider.dimension).toBe(768);
    expect(provider.model).toBe('text-embedding-004');
  });

  it('should initialize GeminiEmbeddingProvider when AI_PROVIDER is gemini and AI_API_KEY is provided', () => {
    process.env.AI_PROVIDER = 'gemini';
    delete process.env.GEMINI_API_KEY;
    process.env.AI_API_KEY = 'test_ai_key_unified';

    const provider = getEmbeddingProvider();
    expect(provider.name).toBe('gemini');
    expect(provider.dimension).toBe(768);
  });

  it('should accept AI_MODEL=gemini-2.5-flash and keep embedding model on text-embedding-004', () => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.AI_API_KEY = 'test_ai_key_flash';
    process.env.AI_MODEL = 'gemini-2.5-flash';

    const provider = getEmbeddingProvider();
    expect(provider.name).toBe('gemini');
    expect(provider.model).toBe('text-embedding-004');
    expect(provider.dimension).toBe(768);
  });

  it('should allow setting custom or mock embedding provider for tests', () => {
    const customMock = new MockEmbeddingProvider(768);
    setEmbeddingProvider(customMock);

    expect(getEmbeddingProvider()).toBe(customMock);
    expect(getEmbeddingProvider().dimension).toBe(768);
  });

  it('should fail fast when TRANSLATION_PROVIDER is gemini and key is missing', async () => {
    const { TranslationProviderFactory } = await import(
      '../src/services/i18n/providers/provider.factory.js'
    );
    TranslationProviderFactory.setProvider(null);
    process.env.TRANSLATION_PROVIDER = 'gemini';
    delete process.env.GEMINI_API_KEY;
    delete process.env.AI_API_KEY;

    expect(() => TranslationProviderFactory.getProvider()).toThrow(
      'Gemini API key is missing. Set GEMINI_API_KEY or AI_API_KEY in environment.'
    );
    TranslationProviderFactory.setProvider(null);
  });

  it('should initialize GeminiTranslationProvider when TRANSLATION_PROVIDER is gemini and key exists', async () => {
    const { TranslationProviderFactory } = await import(
      '../src/services/i18n/providers/provider.factory.js'
    );
    const { GeminiTranslationProvider } = await import(
      '../src/services/i18n/providers/gemini-translation.provider.js'
    );
    TranslationProviderFactory.setProvider(null);
    process.env.TRANSLATION_PROVIDER = 'gemini';
    process.env.AI_API_KEY = 'test_gemini_translation_key';

    const provider = TranslationProviderFactory.getProvider();
    expect(provider).toBeInstanceOf(GeminiTranslationProvider);
    TranslationProviderFactory.setProvider(null);
  });

  it('should reject OpenAI when TRANSLATION_PROVIDER is openai', async () => {
    const { TranslationProviderFactory } = await import(
      '../src/services/i18n/providers/provider.factory.js'
    );
    TranslationProviderFactory.setProvider(null);
    process.env.TRANSLATION_PROVIDER = 'openai';

    expect(() => TranslationProviderFactory.getProvider()).toThrow(
      'OpenAI translation provider is disabled. Google Gemini is the configured AI provider.'
    );
    TranslationProviderFactory.setProvider(null);
  });
});
