// ─────────────────────────────────────────────────────────────────────────────
//  Product Attribute Normalization Service (Phase 6)
// ─────────────────────────────────────────────────────────────────────────────

export interface NormalizedAttributeResult {
  originalValue: string;
  normalizedValue: string;
  tokens: string[];
}

/**
 * Domain-specific synonym dictionary for BIS product categories & electrical/mechanical terms.
 */
const SYNONYM_MAP: Record<string, string> = {
  // Lighting & Electrical
  'led lamp': 'led luminaire',
  'led bulb': 'self ballasted led lamp',
  'led light': 'led luminaire lighting fixture',
  'street light': 'street lighting luminaire',
  'flood light': 'floodlight luminaire',
  'downlight': 'recessed luminaire',
  'luminary': 'luminaire',
  'light fixture': 'luminaire lighting fixture',
  'lighting fitting': 'luminaire lighting fixture',
  'plug': 'plug and socket-outlet',
  'socket': 'plug and socket-outlet',
  'power cord': 'plugs and socket-outlets cord set',
  'switch': 'switches for domestic and similar fixed installations',
  'wire': 'pvc insulated electric cable wire',
  'cable': 'electric cable',

  // Electronics & Appliances
  'geyser': 'stationary storage water heater',
  'water heater': 'electric water heater',
  'iron': 'electric iron',
  'fan': 'electric ceiling fan',
  'air conditioner': 'room air conditioner',
  'ac': 'room air conditioner',
  'refrigerator': 'frost free direct cool refrigerator',

  // Materials & Construction
  'cement': 'portland cement',
  'opc': 'ordinary portland cement',
  'ppc': 'portland pozzolana cement',
  'steel': 'structural steel bar rod',
  'tmt': 'high strength deformed steel bars',
  'pvc pipe': 'unplasticized pvc pipe',
};

/**
 * Normalizes technical units into standard notation (e.g. 230v -> 230 V, 16a -> 16 A).
 */
export function normalizeTechnicalUnits(text: string): string {
  return text
    .replace(/\b(\d+(?:\.\d+)?)\s*v(?:olts?)?\b/gi, '$1 V')
    .replace(/\b(\d+(?:\.\d+)?)\s*w(?:atts?)?\b/gi, '$1 W')
    .replace(/\b(\d+(?:\.\d+)?)\s*a(?:mps?|mperes?)?\b/gi, '$1 A')
    .replace(/\b(\d+(?:\.\d+)?)\s*hz\b/gi, '$1 Hz')
    .replace(/\b(\d+(?:\.\d+)?)\s*k(?:g|ilos?)\b/gi, '$1 kg')
    .replace(/\b(\d+(?:\.\d+)?)\s*mm\b/gi, '$1 mm')
    .replace(/\b(\d+(?:\.\d+)?)\s*cm\b/gi, '$1 cm')
    .replace(/\b(\d+(?:\.\d+)?)\s*m(?:eters?)?\b/gi, '$1 m');
}

/**
 * Deterministically normalizes a raw attribute string for matching and retrieval.
 */
export function normalizeAttribute(rawValue: string): NormalizedAttributeResult {
  const originalValue = (rawValue || '').trim();
  if (!originalValue) {
    return {
      originalValue: '',
      normalizedValue: '',
      tokens: [],
    };
  }

  // 1. Lowercase and normalize whitespace
  let clean = originalValue
    .toLowerCase()
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[^\w\s.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 2. Unit normalization
  clean = normalizeTechnicalUnits(clean);

  // 3. Synonym expansion & canonical replacement
  for (const [synonym, replacement] of Object.entries(SYNONYM_MAP)) {
    const regex = new RegExp(`\\b${synonym}\\b`, 'gi');
    if (regex.test(clean)) {
      clean = clean.replace(regex, replacement);
    }
  }

  // 4. Tokenization (alphanumeric terms >= 2 chars)
  const tokens = Array.from(
    new Set(
      clean
        .toLowerCase()
        .split(/[\s,.:;/()-]+/)
        .filter((t) => t.length >= 2 && !['and', 'for', 'the', 'with', 'part', 'type'].includes(t))
    )
  );

  return {
    originalValue,
    normalizedValue: clean,
    tokens,
  };
}

/**
 * Extracts and normalizes any explicit Indian Standard identifier (e.g., "IS 10322", "IS:10322", "10322").
 */
export function extractExplicitIsNumber(text: string): string | null {
  if (!text) return null;
  const match = text.match(/\b(?:IS\s*[:.-]?\s*)?(\d{3,6}(?:\s*\([^)]+\))?(?:\s*:\s*\d{4})?)\b/i);
  if (match) {
    const rawNumber = match[1].replace(/\s+/g, ' ').trim();
    if (rawNumber.startsWith('IS ')) return rawNumber.toUpperCase();
    return `IS ${rawNumber}`.toUpperCase();
  }
  return null;
}
