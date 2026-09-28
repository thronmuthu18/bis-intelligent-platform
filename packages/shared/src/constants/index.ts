// ─────────────────────────────────────────────────────────────────────────────
//  Platform-wide Constants
// ─────────────────────────────────────────────────────────────────────────────

export const PLATFORM = {
  name: 'BIS Intelligent Platform',
  shortName: 'BIS-IP',
  version: '0.0.1',
  organization: 'Ministry of Consumer Affairs, Food & Public Distribution',
  department: 'Department of Consumer Affairs',
  sihProblem: 'SIH26107',
} as const;

export const API_VERSION = 'v1' as const;
export const API_PREFIX = `/api/${API_VERSION}` as const;

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100,
} as const;

export const FILE_LIMITS = {
  maxSizeBytes: 20 * 1024 * 1024, // 20 MB
  allowedMimeTypes: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/tiff',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
} as const;
