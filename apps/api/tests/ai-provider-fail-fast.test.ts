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

  it('should allow setting custom or mock embedding provider for tests', () => {
    const customMock = new MockEmbeddingProvider(768);
    setEmbeddingProvider(customMock);

    expect(getEmbeddingProvider()).toBe(customMock);
    expect(getEmbeddingProvider().dimension).toBe(768);
  });
});
