// ─────────────────────────────────────────────────────────────────────────────
//  Phase 12 — Translation Provider Factory
// ─────────────────────────────────────────────────────────────────────────────

import type { ITranslationProvider } from './translation-provider.interface.js';
import { MockTranslationProvider } from './mock-translation.provider.js';
import { OpenAITranslationProvider } from './openai-translation.provider.js';

export class TranslationProviderFactory {
  private static instance: ITranslationProvider | null = null;

  public static getProvider(): ITranslationProvider {
    if (this.instance) {
      return this.instance;
    }

    const providerType = (process.env.TRANSLATION_PROVIDER || 'mock').toLowerCase().trim();

    switch (providerType) {
      case 'openai':
        this.instance = new OpenAITranslationProvider();
        break;
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
