// ─────────────────────────────────────────────────────────────────────────────
//  Phase 12 — Multilingual & Accessibility Intelligence Shared Types
// ─────────────────────────────────────────────────────────────────────────────

export type SupportedLanguage = 'en' | 'ta' | 'hi';

export type LanguageCode = SupportedLanguage | 'te' | 'ml' | 'kn' | 'mr' | 'bn' | 'gu' | 'pa' | 'od';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  isDefault?: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    isDefault: true,
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    direction: 'ltr',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    direction: 'ltr',
  },
];

export interface TerminologyEntry {
  key: string;
  en: string;
  ta: string;
  hi: string;
  description: string;
  preserveCanonicalTerm: boolean; // e.g. true for "IS 10322", "HUID", "CM/L", "CRS", "QCO", "BIS"
  category: 'REGULATORY' | 'CERTIFICATION' | 'HALLMARKING' | 'TESTING' | 'ORGANIZATION';
}

export interface TranslateRequest {
  text: string;
  sourceLanguage?: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  sourceReference?: string;
  preserveTerms?: string[];
}

export interface TranslateResponse {
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  sourceTextHash: string;
  translatedText: string;
  preservedTerms: string[];
  sourceReference?: string;
  cached: boolean;
  generatedAt: string;
  disclaimer: string;
}

export interface UserPreferenceItem {
  id: string;
  userId: string;
  language: SupportedLanguage;
  theme?: string;
  reducedMotion?: boolean;
  highContrast?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserPreferenceRequest {
  language?: SupportedLanguage;
  theme?: string;
  reducedMotion?: boolean;
  highContrast?: boolean;
}

export interface UserPreferenceResponse {
  preference: UserPreferenceItem;
}

export interface LanguagesListResponse {
  languages: LanguageInfo[];
  defaultLanguage: SupportedLanguage;
}

export interface TerminologyResponse {
  term: TerminologyEntry;
}

export interface TerminologyListResponse {
  terms: TerminologyEntry[];
  total: number;
}
