// ─────────────────────────────────────────────────────────────────────────────
//  BIS Technical Division & Category Normalization Service
//  Maps arbitrary product categories to official BIS Technical Divisions (Sectors)
//  without hardcoding a single product type or fabricating standards.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Official Bureau of Indian Standards (BIS) Technical Divisions.
 * Reference: BIS Standardization Directorate Divisions.
 */
export const BIS_TECHNICAL_DIVISIONS = [
  'Electrotechnical',
  'Chemical',
  'Civil Engineering',
  'Mechanical Engineering',
  'Food and Agriculture',
  'Medical Equipment and Hospital Planning',
  'Metallurgical Engineering',
  'Electronics and Information Technology',
  'Petroleum, Coal and Related Products',
  'Production and General Engineering',
  'Textile',
  'Transport Engineering',
  'Water Resources',
  'Management and Systems',
] as const;

export type BisTechnicalDivision = (typeof BIS_TECHNICAL_DIVISIONS)[number];

interface CategoryMappingRule {
  sector: BisTechnicalDivision;
  compatibleSectors: BisTechnicalDivision[];
  keywords: string[];
  patterns: RegExp[];
}

/**
 * Reusable domain rules mapping industry and consumer product categories
 * to official BIS Technical Divisions (Sectors).
 */
const CATEGORY_RULES: CategoryMappingRule[] = [
  {
    sector: 'Electronics and Information Technology',
    compatibleSectors: ['Electronics and Information Technology', 'Electrotechnical'],
    keywords: [
      'electronics',
      'electronic',
      'it goods',
      'it equipment',
      'information technology',
      'computer',
      'laptop',
      'tablet',
      'mobile',
      'smartphone',
      'telecom',
      'server',
      'display',
      'monitor',
      'printer',
      'scanner',
      'audio',
      'video',
      'cctv',
      'camera',
    ],
    patterns: [
      /\belectronic(?:s)?\b/i,
      /\bit goods\b/i,
      /\binformation technology\b/i,
      /\bit equipment\b/i,
      /\bcomputer\b/i,
      /\bmobile phone\b/i,
      /\btelecom(?:munication)?\b/i,
      /\bconsumer electronics\b/i,
    ],
  },
  {
    sector: 'Electrotechnical',
    compatibleSectors: ['Electrotechnical', 'Electronics and Information Technology'],
    keywords: [
      'luminaires',
      'luminaire',
      'lighting',
      'light',
      'lamp',
      'led',
      'bulb',
      'electrical',
      'electric',
      'electrotechnical',
      'appliance',
      'appliances',
      'cable',
      'cables',
      'wire',
      'wires',
      'plug',
      'plugs',
      'socket',
      'sockets',
      'switch',
      'switches',
      'controlgear',
      'ballast',
      'transformer',
      'transformers',
      'battery',
      'batteries',
      'inverter',
      'ups',
      'heater',
      'geyser',
      'iron',
      'fan',
      'motor',
    ],
    patterns: [
      /\belectrical\b/i,
      /\belectric\b/i,
      /\belectrotechnical\b/i,
      /\bluminair(?:e|es)?\b/i,
      /\blighting\b/i,
      /\bled\b/i,
      /\blamp\b/i,
      /\bappliances?\b/i,
      /\bcables?\b/i,
      /\bwires?\b/i,
      /\bcontrolgear\b/i,
      /\bpower supply\b/i,
    ],
  },
  {
    sector: 'Chemical',
    compatibleSectors: ['Chemical', 'Food and Agriculture'],
    keywords: [
      'chemical',
      'chemicals',
      'paint',
      'paints',
      'coating',
      'coatings',
      'plastic',
      'plastics',
      'polymer',
      'rubber',
      'glass',
      'fertilizer',
      'fertilizers',
      'pesticide',
      'pesticides',
      'cosmetics',
      'detergent',
      'soaps',
      'water quality',
      'drinking water',
    ],
    patterns: [
      /\bchem(?:ical|icals)?\b/i,
      /\bpaint(?:s)?\b/i,
      /\bplastic(?:s)?\b/i,
      /\brubber\b/i,
      /\bwater\b/i,
    ],
  },
  {
    sector: 'Civil Engineering',
    compatibleSectors: ['Civil Engineering', 'Metallurgical Engineering'],
    keywords: [
      'civil',
      'construction',
      'building',
      'cement',
      'concrete',
      'tile',
      'tiles',
      'ceramic',
      'mosaic',
      'stone',
      'adhesive',
      'adhesives',
      'brick',
      'bricks',
      'plywood',
      'timber',
      'structural',
      'pipe',
      'pipes',
      'sanitaryware',
    ],
    patterns: [
      /\bcivil\b/i,
      /\bconstruction\b/i,
      /\bbuilding\b/i,
      /\bcement\b/i,
      /\bconcrete\b/i,
      /\btiles?\b/i,
      /\badhesives?\b/i,
    ],
  },
  {
    sector: 'Mechanical Engineering',
    compatibleSectors: ['Mechanical Engineering', 'Production and General Engineering'],
    keywords: [
      'mechanical',
      'pump',
      'pumps',
      'engine',
      'engines',
      'compressor',
      'compressors',
      'boiler',
      'boilers',
      'valve',
      'valves',
      'turbine',
      'machinery',
      'tools',
      'bearing',
      'bearings',
    ],
    patterns: [
      /\bmechanic(?:al)?\b/i,
      /\bpumps?\b/i,
      /\bengines?\b/i,
      /\bcompressors?\b/i,
      /\bvalves?\b/i,
    ],
  },
  {
    sector: 'Food and Agriculture',
    compatibleSectors: ['Food and Agriculture', 'Chemical'],
    keywords: [
      'food',
      'agriculture',
      'agricultural',
      'beverage',
      'beverages',
      'dairy',
      'milk',
      'grain',
      'grains',
      'spices',
      'tea',
      'coffee',
      'oil',
      'packaged food',
    ],
    patterns: [
      /\bfood\b/i,
      /\bagricultur(?:e|al)\b/i,
      /\bbeverage(?:s)?\b/i,
      /\bdairy\b/i,
    ],
  },
  {
    sector: 'Medical Equipment and Hospital Planning',
    compatibleSectors: ['Medical Equipment and Hospital Planning', 'Electrotechnical'],
    keywords: [
      'medical',
      'surgical',
      'hospital',
      'diagnostic',
      'healthcare',
      'implant',
      'syringe',
      'ventilator',
      'thermometer',
      'ppe',
      'mask',
    ],
    patterns: [
      /\bmedic(?:al)?\b/i,
      /\bsurgical\b/i,
      /\bhospital\b/i,
      /\bhealthcare\b/i,
    ],
  },
  {
    sector: 'Metallurgical Engineering',
    compatibleSectors: ['Metallurgical Engineering', 'Civil Engineering'],
    keywords: [
      'steel',
      'iron',
      'metal',
      'metals',
      'alloy',
      'alloys',
      'aluminium',
      'copper',
      'zinc',
      'welding',
      'rebar',
      'tmt',
    ],
    patterns: [
      /\bsteel\b/i,
      /\biron\b/i,
      /\bmetallurg(?:y|ical)\b/i,
      /\balloys?\b/i,
      /\balumini?um\b/i,
    ],
  },
  {
    sector: 'Textile',
    compatibleSectors: ['Textile'],
    keywords: ['textile', 'textiles', 'fabric', 'fabrics', 'yarn', 'yarns', 'garment', 'garments', 'cotton', 'silk', 'jute'],
    patterns: [/\btextiles?\b/i, /\bfabrics?\b/i, /\byarns?\b/i, /\bgarments?\b/i],
  },
  {
    sector: 'Transport Engineering',
    compatibleSectors: ['Transport Engineering', 'Mechanical Engineering'],
    keywords: ['transport', 'automotive', 'automobile', 'vehicle', 'vehicles', 'helmet', 'helmets', 'tyre', 'tyres', 'brake'],
    patterns: [/\bautomot(?:ive)?\b/i, /\btransport\b/i, /\bvehicles?\b/i, /\bhelmets?\b/i],
  },
];

/**
 * Maps any free-form product category or description into an official BIS Technical Division.
 * Returns null if the category does not confidently map to a specific BIS technical division.
 * Never invents non-existent sectors or false matches.
 */
export function mapCategoryToBisSector(category?: string | null): BisTechnicalDivision | null {
  if (!category || typeof category !== 'string') {
    return null;
  }

  const clean = category.trim().toLowerCase();
  if (!clean) return null;

  // 1. Direct exact match to known technical division
  for (const div of BIS_TECHNICAL_DIVISIONS) {
    if (clean === div.toLowerCase()) {
      return div;
    }
  }

  // 2. Pattern and keyword rule evaluation with scoring
  let bestSector: BisTechnicalDivision | null = null;
  let highestScore = 0;

  for (const rule of CATEGORY_RULES) {
    let score = 0;

    // Pattern matches
    for (const pattern of rule.patterns) {
      if (pattern.test(clean)) {
        score += 3;
      }
    }

    // Keyword containment
    for (const kw of rule.keywords) {
      if (clean.includes(kw)) {
        score += 1;
      }
    }

    if (score > highestScore && score >= 2) {
      highestScore = score;
      bestSector = rule.sector;
    }
  }

  return bestSector;
}

/**
 * Returns all compatible BIS Technical Divisions for a product category.
 * Used for relaxed filtering so standards in adjacent divisions (e.g. Electrotechnical and Electronics)
 * are not prematurely excluded.
 */
export function getCompatibleBisSectors(category?: string | null): BisTechnicalDivision[] {
  const primarySector = mapCategoryToBisSector(category);
  if (!primarySector) {
    return [];
  }

  const rule = CATEGORY_RULES.find((r) => r.sector === primarySector);
  return rule ? rule.compatibleSectors : [primarySector];
}
