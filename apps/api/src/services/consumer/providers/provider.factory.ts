// ─────────────────────────────────────────────────────────────────────────────
//  VerificationProviderFactory — Resolves active provider based on environment
// ─────────────────────────────────────────────────────────────────────────────

import type { IVerificationProvider } from './verification-provider.interface.js';
import { MockVerificationProvider } from './mock-verification.provider.js';
import { OfficialSourceProvider } from './official-source.provider.js';

export class VerificationProviderFactory {
  private static instance: IVerificationProvider | null = null;

  public static getProvider(): IVerificationProvider {
    if (this.instance) {
      return this.instance;
    }

    const providerType = (process.env.VERIFICATION_PROVIDER || process.env.BIS_VERIFICATION_PROVIDER || 'mock').toLowerCase().trim();

    if (providerType === 'official') {
      this.instance = new OfficialSourceProvider();
    } else {
      this.instance = new MockVerificationProvider();
    }

    return this.instance;
  }

  /**
   * Override provider for testing purposes.
   */
  public static setProvider(provider: IVerificationProvider | null): void {
    this.instance = provider;
  }
}
