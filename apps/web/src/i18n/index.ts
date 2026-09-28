// ─────────────────────────────────────────────────────────────────────────────
//  Phase 12 — Frontend i18n Engine & Terminology Helpers
// ─────────────────────────────────────────────────────────────────────────────

import { en, type TranslationKey } from './locales/en';
import { ta } from './locales/ta';
import { hi } from './locales/hi';
import type { SupportedLanguage } from '@bis/shared';
import { BIS_TERMINOLOGY_DICTIONARY } from '@bis/shared';

export const LOCALES: Record<SupportedLanguage, TranslationKey> = {
  en,
  ta,
  hi,
};

/**
 * Get nested translation string from a locale object using dot notation (e.g. 'common.save', 'consumer.hubTitle').
 */
function getNestedValue(obj: any, path: string): string | undefined {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }
  return typeof current === 'string' ? current : undefined;
}

/**
 * Translates a key for a given language, falling back to English and then to the raw key.
 */
export function translateKey(
  key: string,
  lang: SupportedLanguage = 'en',
  params?: Record<string, string | number>
): string {
  const targetBundle = LOCALES[lang] || LOCALES.en;
  let text = getNestedValue(targetBundle, key);

  // Fallback to English
  if (!text && lang !== 'en') {
    text = getNestedValue(LOCALES.en, key);
  }

  // Fallback to raw key
  if (!text) {
    text = key;
  }

  // Replace {paramName} placeholders
  if (params) {
    for (const [pKey, pValue] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pValue));
    }
  }

  return text;
}

/**
 * Get localized terminology term from canonical BIS terminology dictionary.
 */
export function getLocalizedTerm(key: string, lang: SupportedLanguage = 'en'): string {
  const term = BIS_TERMINOLOGY_DICTIONARY[key.toUpperCase()];
  if (!term) return key;

  switch (lang) {
    case 'ta':
      return term.ta;
    case 'hi':
      return term.hi;
    case 'en':
    default:
      return term.en;
  }
}
