// ─────────────────────────────────────────────────────────────────────────────
//  Phase 12 — Translation Provider Interface
// ─────────────────────────────────────────────────────────────────────────────

import type { SupportedLanguage } from '@bis/shared';

export interface ProviderTranslateParams {
  text: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  preservedTerms: string[];
}

export interface ProviderTranslateResult {
  translatedText: string;
  preservedTermsFound: string[];
}

export interface ITranslationProvider {
  translate(params: ProviderTranslateParams): Promise<ProviderTranslateResult>;
}
