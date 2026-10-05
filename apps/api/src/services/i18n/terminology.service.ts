// ─────────────────────────────────────────────────────────────────────────────
//  Phase 12 — Terminology Service
// ─────────────────────────────────────────────────────────────────────────────

import {
  BIS_TERMINOLOGY_DICTIONARY,
  type TerminologyListResponse,
  type TerminologyResponse,
} from '@bis/shared';

export class TerminologyService {
  /**
   * Get all registered BIS terminology entries.
   */
  public static getAllTerms(): TerminologyListResponse {
    const terms = Object.values(BIS_TERMINOLOGY_DICTIONARY);
    return {
      terms,
      total: terms.length,
    };
  }

  /**
   * Get specific term entry by key.
   */
  public static getTerm(key: string): TerminologyResponse | null {
    const normalizedKey = key.trim().toUpperCase().replace(/[\s\-/]+/g, '_');
    const term = BIS_TERMINOLOGY_DICTIONARY[normalizedKey] || BIS_TERMINOLOGY_DICTIONARY[key];
    if (!term) return null;
    return { term };
  }

  /**
   * Automatically detect and extract technical terms from text that must be preserved
   * during translation (e.g. standard numbers like "IS 10322", "CM/L-1234567", "HUID", "QCO", "CRS").
   */
  public static extractPreservedTerms(text: string, customTerms: string[] = []): string[] {
    const preserved = new Set<string>(customTerms);

    // Regex for Indian Standard numbers: IS 10322, IS 10322 (Part 5/Sec 1) : 2012, IS 1417, IS/ISO 9001, IS 302-1, etc.
    const isMatches = text.match(/\bIS(?:\/[A-Z]+)?\s+\d+(?:[\s\-/]Part\s+\d+(?:\/Sec\s+\d+)?)?(?:\s*\([^)]+\))?(?:\s*:\s*\d{4})?(?!\w)/g);
    if (isMatches) {
      isMatches.forEach((m) => preserved.add(m.trim()));
    }

    // Regex for Certification Schemes: Scheme I, Scheme II, Scheme IV, Scheme X, etc.
    const schemeMatches = text.match(/\bScheme\s+[IVX\d]+(?:\s*\([^)]+\))?/gi);
    if (schemeMatches) {
      schemeMatches.forEach((m) => preserved.add(m.trim()));
    }

    // Regex for CM/L numbers: CM/L-1234567 or CM/L 1234567
    const cmlMatches = text.match(/\bCM\/L[- ]?\d{7,8}\b/gi);
    if (cmlMatches) {
      cmlMatches.forEach((m) => preserved.add(m.trim()));
    }

    // Regex for 6-character HUID: e.g. AZ1234, HUID-925-ABCD
    const huidMatches = text.match(/\b[A-Z0-9]{6}\b/g);
    if (huidMatches) {
      huidMatches.forEach((m) => preserved.add(m.trim()));
    }

    // Known canonical acronyms from dictionary marked as preserveCanonicalTerm
    for (const entry of Object.values(BIS_TERMINOLOGY_DICTIONARY)) {
      if (entry.preserveCanonicalTerm) {
        if (new RegExp(`\\b${entry.key}\\b`, 'i').test(text)) {
          preserved.add(entry.key);
        }
      }
    }

    return Array.from(preserved);
  }
}
