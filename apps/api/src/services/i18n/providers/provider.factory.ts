// ─────────────────────────────────────────────────────────────────────────────
//  Phase 12 — Translation Provider Factory
// ─────────────────────────────────────────────────────────────────────────────

import type { ITranslationProvider } from './translation-provider.interface.js';
import { MockTranslationProvider } from './mock-translation.provider.js';
import { GeminiTranslationProvider } from './gemini-translation.provider.js';

export class TranslationProviderFactory {
  private static instance: ITranslationProvider | null = null;

  public static getProvider(): ITranslationProvider {
    if (this.instance) {
      return this.instance;
    }

    const providerType = (
      process.env.TRANSLATION_PROVIDER ||
      (process.env.AI_PROVIDER === 'gemini' ? 'gemini' : 'mock')
    )
      .toLowerCase()
      .trim();

    switch (providerType) {
      case 'gemini':
      case 'google':
        this.instance = new GeminiTranslationProvider();
        break;
      case 'openai':
        throw new Error(
          'OpenAI translation provider is disabled. Google Gemini is the configured AI provider. Set TRANSLATION_PROVIDER=gemini.'
        );
      case 'mock':
      default:
        this.instance = new MockTranslationProvider();
        break;
    }

    return this.instance;
  }

  /**
   * For unit testing: allows overriding the singleton instance.
   */
  public static setProvider(provider: ITranslationProvider | null): void {
    this.instance = provider;
  }
}
