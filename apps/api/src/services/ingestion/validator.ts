import { isAllowedSourceUrl } from '../../config/sourceRegistry.js';
import { AppError } from '../../utils/AppError.js';
import { API_ERROR_CODES } from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  BIS Ingestion Layer — Validator
// ─────────────────────────────────────────────────────────────────────────────

export interface RawStandardIngestItem {
  isNumber: string;
  title: string;
  shortTitle?: string;
  scope?: string;
  status?: 'CURRENT' | 'SUPERSEDED' | 'WITHDRAWN' | 'DRAFT' | 'UNKNOWN';
  sector?: string;
  department?: string;
  language?: string;
  currentEdition?: string;
  publicationDate?: string | Date;
  withdrawalDate?: string | Date;
  sourceDocument: {
    title: string;
    url: string;
    sourceType: 'BIS_OFFICIAL' | 'GOVERNMENT_GAZETTE' | 'BIS_DOCUMENT' | 'OTHER_REFERENCE';
    authorityLevel: 'AUTHORITATIVE' | 'REFERENCE' | 'UNVERIFIED';
    documentType?: string;
    publishedAt?: string | Date;
    versionLabel?: string;
  };
  versions?: Array<{
    edition: string;
    year?: number;
    publicationDate?: string | Date;
    status?: 'CURRENT' | 'SUPERSEDED' | 'WITHDRAWN' | 'DRAFT' | 'UNKNOWN';
    documentUrl?: string;
  }>;
  amendments?: Array<{
    amendmentNumber: string;
    title?: string;
    publicationDate?: string | Date;
    effectiveDate?: string | Date;
    documentUrl?: string;
  }>;
  qcos?: Array<{
    orderNumber: string;
    name: string;
    ministry?: string;
    notificationDate?: string | Date;
    effectiveDate?: string | Date;
    status?: string;
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
    publicationDate?: string | Date;
    documentUrl?: string;
  }>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates a single standard ingestion item.
 * Ensures strictly allowable domains, mandatory fields, and proper provenance data.
 */
export function validateStandardItem(item: RawStandardIngestItem): ValidationResult {
  const errors: string[] = [];

  // Mandatory fields
  if (!item.isNumber || typeof item.isNumber !== 'string' || item.isNumber.trim().length === 0) {
    errors.push('Standard isNumber is required and must be a non-empty string.');
  }

  if (!item.title || typeof item.title !== 'string' || item.title.trim().length === 0) {
    errors.push('Standard title is required and must be a non-empty string.');
  }

  // Source Provenance Validation
  if (!item.sourceDocument) {
    errors.push('Source document provenance is mandatory for every imported record.');
  } else {
    if (!item.sourceDocument.title || item.sourceDocument.title.trim().length === 0) {
      errors.push('Source document title is required.');
    }

    if (!item.sourceDocument.url || item.sourceDocument.url.trim().length === 0) {
      errors.push('Source document URL is required.');
    } else {
      // Validate official domain allowlist
      if (!isAllowedSourceUrl(item.sourceDocument.url)) {
        errors.push(
          `Source document URL '${item.sourceDocument.url}' is not from an authorized official government domain.`
        );
      }
    }

    const validSourceTypes = ['BIS_OFFICIAL', 'GOVERNMENT_GAZETTE', 'BIS_DOCUMENT', 'OTHER_REFERENCE'];
    if (!validSourceTypes.includes(item.sourceDocument.sourceType)) {
      errors.push(`Invalid sourceType: ${item.sourceDocument.sourceType}`);
    }

    const validAuthorityLevels = ['AUTHORITATIVE', 'REFERENCE', 'UNVERIFIED'];
    if (!validAuthorityLevels.includes(item.sourceDocument.authorityLevel)) {
      errors.push(`Invalid authorityLevel: ${item.sourceDocument.authorityLevel}`);
    }
  }

  // Document URLs inside nested versions / amendments / QCOs must also respect allowlist if provided
  if (item.versions) {
    for (const v of item.versions) {
      if (v.documentUrl && !isAllowedSourceUrl(v.documentUrl)) {
        errors.push(`Standard version document URL '${v.documentUrl}' is not an authorized domain.`);
      }
    }
  }

  if (item.amendments) {
    for (const a of item.amendments) {
      if (a.documentUrl && !isAllowedSourceUrl(a.documentUrl)) {
        errors.push(`Amendment document URL '${a.documentUrl}' is not an authorized domain.`);
      }
    }
  }

  if (item.qcos) {
    for (const q of item.qcos) {
      if (!q.orderNumber || q.orderNumber.trim().length === 0) {
        errors.push('QCO orderNumber is required.');
      }
      if (q.documentUrl && !isAllowedSourceUrl(q.documentUrl)) {
        errors.push(`QCO document URL '${q.documentUrl}' is not an authorized domain.`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates external ingestion trigger input to ensure safe operation.
 */
export function validateSourceKey(sourceKey: string): void {
  if (!sourceKey || typeof sourceKey !== 'string') {
    throw new AppError('sourceKey is required.', 400, API_ERROR_CODES.BAD_REQUEST);
  }
}
