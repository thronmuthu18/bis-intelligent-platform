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
  'led light fitting': 'led luminaire luminaires lighting fixture general purpose luminaire',
  'led fitting': 'led luminaire luminaires lighting fixture',
  'light fitting': 'luminaire lighting fixture',
  'lighting fitting': 'luminaire lighting fixture',
  'lighting fixture': 'luminaire lighting fixture',
  'led luminaire': 'led luminaire lighting fixture',
  'led luminaires': 'led luminaire lighting fixture',
  'luminaire': 'luminaire lighting fixture general purpose luminaires',
  'luminaires': 'luminaires lighting fixture general purpose luminaires',
  'led lamp': 'self ballasted led lamp luminaire',
  'led bulb': 'self ballasted led lamp',
  'led light': 'led luminaire lighting fixture',
  'street light': 'street lighting luminaire',
  'flood light': 'floodlight luminaire',
  'downlight': 'recessed luminaire',
  'luminary': 'luminaire',
  'controlgear': 'electronic controlgear led modules',
  'led driver': 'electronic controlgear for led modules',
  'lamp controlgear': 'electronic controlgear for led modules',
  'plug': 'plug and socket-outlet',
  'socket': 'plug and socket-outlet',
  'power cord': 'plugs and socket-outlets cord set',
  'switch': 'switches for domestic and similar fixed installations',
  'wire': 'pvc insulated electric cable wire',
  'cable': 'electric cable pvc insulated',

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
  'tiles': 'ceramic mosaic stone tiles',
  'tile': 'ceramic mosaic stone tiles',
  'adhesive': 'adhesives for ceramic mosaic tiles',
  'adhesives': 'adhesives for ceramic mosaic tiles',
  'drinking water': 'drinking water specification',
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

const COMMON_CONVERSATIONAL_STOP_WORDS = new Set([
  'what', 'which', 'is', 'are', 'the', 'for', 'to', 'in', 'of', 'and', 'or', 'a', 'an',
  'this', 'my', 'product', 'standards', 'standard', 'apply', 'may', 'check', 'need', 'do',
  'does', 'can', 'you', 'tell', 'me', 'about', 'how', 'when', 'where', 'requirement',
  'requirements', 'compliance', 'bis', 'indian', 'please', 'explain', 'show', 'list',
  'with', 'from', 'by', 'at', 'on', 'as', 'into', 'under',
]);

export interface TokenizedQuery {
  originalQuery: string;
  cleanText: string;
  explicitIsNumber: string | null;
  primaryTokens: string[];
  expandedTokens: string[];
  allSearchTokens: string[];
}

/**
 * Tokenizes a free-form search or conversational query for standards retrieval.
 * Strips noise/stop words, identifies potential IS numbers, and adds domain synonym tokens.
 */
export function tokenizeSearchQuery(query: string): TokenizedQuery {
  const originalQuery = (query || '').trim();
  if (!originalQuery) {
    return {
      originalQuery: '',
      cleanText: '',
      explicitIsNumber: null,
      primaryTokens: [],
      expandedTokens: [],
      allSearchTokens: [],
    };
  }

  const explicitIs = extractExplicitIsNumber(originalQuery);

  // Normalize query string: replace hyphens, slashes, punctuation with spaces
  let clean = originalQuery
    .toLowerCase()
    .replace(/[-_/]/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Extract base words
  const words = clean.split(/\s+/).filter(Boolean);
  const primaryTokens = words.filter((w) => w.length >= 2 && !COMMON_CONVERSATIONAL_STOP_WORDS.has(w));

  // Collect synonym expansions
  const expandedTokenSet = new Set<string>();
  for (const [phrase, expansion] of Object.entries(SYNONYM_MAP)) {
    if (clean.includes(phrase)) {
      const expWords = expansion.toLowerCase().split(/\s+/).filter(Boolean);
      for (const ew of expWords) {
        if (ew.length >= 3 && !COMMON_CONVERSATIONAL_STOP_WORDS.has(ew)) {
          expandedTokenSet.add(ew);
        }
      }
    }
  }

  // Also check individual primary tokens for synonym expansion
  for (const token of primaryTokens) {
    if (SYNONYM_MAP[token]) {
      const expWords = SYNONYM_MAP[token].toLowerCase().split(/\s+/).filter(Boolean);
      for (const ew of expWords) {
        if (ew.length >= 3 && !COMMON_CONVERSATIONAL_STOP_WORDS.has(ew)) {
          expandedTokenSet.add(ew);
        }
      }
    }
  }

  const expandedTokens = Array.from(expandedTokenSet);
  const allSearchTokens = Array.from(new Set([...primaryTokens, ...expandedTokens]));

  return {
    originalQuery,
    cleanText: clean,
    explicitIsNumber: explicitIs,
    primaryTokens,
    expandedTokens,
    allSearchTokens,
  };
}
