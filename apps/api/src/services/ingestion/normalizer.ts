// ─────────────────────────────────────────────────────────────────────────────
//  BIS Ingestion Layer — Normalizer
// ─────────────────────────────────────────────────────────────────────────────

export interface NormalizedStandardInput {
  isNumber: string;
  canonicalNumber: string;
  title: string;
  shortTitle?: string;
  scope?: string;
  status: 'CURRENT' | 'SUPERSEDED' | 'WITHDRAWN' | 'DRAFT' | 'UNKNOWN';
  sector?: string;
  department?: string;
  language: string;
  currentEdition?: string;
  publicationDate?: Date;
  withdrawalDate?: Date;
  versions?: Array<{
    edition: string;
    year?: number;
    publicationDate?: Date;
    status: 'CURRENT' | 'SUPERSEDED' | 'WITHDRAWN' | 'DRAFT' | 'UNKNOWN';
    documentUrl?: string;
  }>;
  amendments?: Array<{
    amendmentNumber: string;
    title?: string;
    publicationDate?: Date;
    effectiveDate?: Date;
    documentUrl?: string;
  }>;
  qcos?: Array<{
    orderNumber: string;
    name: string;
    ministry?: string;
    notificationDate?: Date;
    effectiveDate?: Date;
    status: string;
    documentUrl?: string;
    productDescription?: string;
  }>;
  schemes?: Array<{
    code: string;
    name: string;
    description?: string;
    notes?: string;
  }>;
  productManuals?: Array<{
    title: string;
    version?: string;
    publicationDate?: Date;
    documentUrl?: string;
  }>;
}

/**
 * Normalizes an IS number to a canonical key for robust deduplication & searching.
 * Preserves the original source number format separately.
 *
 * Example:
 * "IS 10322 (Part 5/Sec 1) : 2012" -> "IS 10322-5-1"
 * "IS 1293: 2019" -> "IS 1293"
 * "is  302  (part 1)" -> "IS 302-1"
 */
export function normalizeIsNumber(rawIsNumber: string): string {
  if (!rawIsNumber) return '';

  let normalized = rawIsNumber.toUpperCase().trim();

  // Replace multiple whitespace with single space
  normalized = normalized.replace(/\s+/g, ' ');

  // Remove year suffix after colon or slash if present (e.g. ": 2012", "/2019")
  normalized = normalized.replace(/:\s*\d{4}.*$/, '').trim();

  // Normalize Part & Section syntax:
  // e.g. "(PART 5/SEC 1)" or "(PART 5 / SECTION 1)" -> "-5-1"
  normalized = normalized.replace(/\(\s*PART\s*(\d+)\s*[/,]\s*SEC(?:TION)?\s*(\d+)\s*\)/i, '-$1-$2');
  normalized = normalized.replace(/\bPART\s*(\d+)\s*[/,]\s*SEC(?:TION)?\s*(\d+)\b/i, '-$1-$2');

  // e.g. "(PART 1)" or "PART 1" -> "-1"
  normalized = normalized.replace(/\(\s*PART\s*(\d+)\s*\)/i, '-$1');
  normalized = normalized.replace(/\bPART\s*(\d+)\b/i, '-$1');

  // e.g. "(SEC 1)" or "SEC 1" -> "-1"
  normalized = normalized.replace(/\(\s*SEC(?:TION)?\s*(\d+)\s*\)/i, '-$1');
  normalized = normalized.replace(/\bSEC(?:TION)?\s*(\d+)\b/i, '-$1');

  // Strip remaining unnecessary symbols and cleanup spacing
  normalized = normalized.replace(/[()[\]]/g, '').trim();
  normalized = normalized.replace(/\s*-\s*/g, '-');
  normalized = normalized.replace(/\s+/g, ' ');

  // Ensure prefix is standard "IS "
  if (!normalized.startsWith('IS')) {
    normalized = `IS ${normalized}`;
  } else if (normalized.startsWith('IS') && !normalized.startsWith('IS ') && !normalized.startsWith('IS-')) {
    normalized = normalized.replace(/^IS/, 'IS ');
  }

  return normalized.trim();
}

/**
 * Normalizes text content: trims whitespace, cleans double quotes and unusual spacing.
 */
export function normalizeText(text?: string | null): string | undefined {
  if (!text) return undefined;
  const cleaned = text.trim().replace(/\s+/g, ' ');
  return cleaned.length > 0 ? cleaned : undefined;
}
