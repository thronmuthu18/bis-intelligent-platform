import { SourceType, AuthorityLevel, SourceRegistryItem } from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Official BIS & Government Source Registry
// ─────────────────────────────────────────────────────────────────────────────

export const ALLOWED_SOURCE_DOMAINS = [
  'bis.gov.in',
  'services.bis.gov.in',
  'standardsbis.in',
  'www.standardsbis.in',
  'egazette.gov.in',
  'www.egazette.gov.in',
  'manakonline.in',
  'www.manakonline.in',
  'crsbis.in',
  'www.crsbis.in',
  'lims.bis.gov.in',
  'consumeraffairs.nic.in',
] as const;

export const OFFICIAL_SOURCE_REGISTRY: Record<string, SourceRegistryItem> = {
  'bis-know-your-standard': {
    id: 'bis-know-your-standard',
    name: 'BIS Know Your Standard Portal',
    description:
      'Official Bureau of Indian Standards directory for Indian Standards, amendments, Gazette notifications, and laboratory linkages.',
    url: 'https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails',
    sourceType: 'BIS_OFFICIAL' as SourceType,
    authorityLevel: 'AUTHORITATIVE' as AuthorityLevel,
    allowedDomains: ['services.bis.gov.in', 'bis.gov.in'],
    isActive: true,
  },
  'bis-standards-portal': {
    id: 'bis-standards-portal',
    name: 'BIS Standards National Portal',
    description:
      'Official repository of published Indian Standards, standardization manuals, and technical committees.',
    url: 'https://standardsbis.in',
    sourceType: 'BIS_OFFICIAL' as SourceType,
    authorityLevel: 'AUTHORITATIVE' as AuthorityLevel,
    allowedDomains: ['standardsbis.in', 'www.standardsbis.in'],
    isActive: true,
  },
  'egazette-qco': {
    id: 'egazette-qco',
    name: 'The Gazette of India (eGazette) - Quality Control Orders',
    description:
      'Official Ministry notifications and Quality Control Orders making specific Indian Standards mandatory.',
    url: 'https://egazette.gov.in',
    sourceType: 'GOVERNMENT_GAZETTE' as SourceType,
    authorityLevel: 'AUTHORITATIVE' as AuthorityLevel,
    allowedDomains: ['egazette.gov.in', 'www.egazette.gov.in'],
    isActive: true,
  },
  'bis-crs-portal': {
    id: 'bis-crs-portal',
    name: 'BIS Compulsory Registration Scheme (CRS) Portal',
    description:
      'Official BIS portal for electronics, IT goods, and solar products under mandatory CRS certification.',
    url: 'https://www.crsbis.in',
    sourceType: 'BIS_OFFICIAL' as SourceType,
    authorityLevel: 'AUTHORITATIVE' as AuthorityLevel,
    allowedDomains: ['crsbis.in', 'www.crsbis.in'],
    isActive: true,
  },
  'bis-manakonline': {
    id: 'bis-manakonline',
    name: 'BIS Manakonline Portal - Product Certification & STI',
    description:
      'Official BIS enterprise portal for Schemes of Testing and Inspection (STI), Product Manuals, and Guidelines.',
    url: 'https://www.manakonline.in',
    sourceType: 'BIS_OFFICIAL' as SourceType,
    authorityLevel: 'AUTHORITATIVE' as AuthorityLevel,
    allowedDomains: ['manakonline.in', 'www.manakonline.in'],
    isActive: true,
  },
};

/**
 * Validates if a target URL belongs to an allowlisted official government domain.
 * Prevents SSRF attacks and arbitrary ingestion.
 */
export function isAllowedSourceUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_SOURCE_DOMAINS.some(
      (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
    );
  } catch {
    return false;
  }
}
