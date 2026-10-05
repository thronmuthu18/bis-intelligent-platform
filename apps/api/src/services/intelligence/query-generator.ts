// ─────────────────────────────────────────────────────────────────────────────
//  Product Intelligence Query Generator (Phase 6)
// ─────────────────────────────────────────────────────────────────────────────

import { normalizeAttribute, extractExplicitIsNumber, tokenizeSearchQuery } from './normalizer.js';
import { mapCategoryToBisSector } from './category-sector-mapper.js';

export interface ProductSearchProfile {
  productId: string;
  name: string;
  category: string;
  description?: string;
  intendedUse?: string;
  sector?: string;
  material?: string;
  application?: string;
  targetMarket?: string;
  manufacturerType?: string;
  technicalSpecifications?: Record<string, any> | string;
  attributes: Record<string, string>;
  normalizedTokens: string[];
  explicitIsNumber?: string | null;
}

export interface GeneratedQueriesResult {
  profile: ProductSearchProfile;
  queries: string[];
  explicitIsNumbers: string[];
}

/**
 * Generates deterministic retrieval queries from a product profile and its structured attributes.
 */
export function generateCandidateQueries(profile: ProductSearchProfile): GeneratedQueriesResult {
  const querySet = new Set<string>();
  const explicitIsNumbers = new Set<string>();

  // Parse technical specifications if string
  let techSpecsObj: Record<string, any> = {};
  if (profile.technicalSpecifications) {
    if (typeof profile.technicalSpecifications === 'string') {
      try {
        techSpecsObj = JSON.parse(profile.technicalSpecifications);
      } catch {
        techSpecsObj = { raw: profile.technicalSpecifications };
      }
    } else if (typeof profile.technicalSpecifications === 'object') {
      techSpecsObj = profile.technicalSpecifications;
    }
  }

  // 1. Check for explicit IS numbers in name, description, intendedUse, attributes, and tech specs
  const fullTextScan = [
    profile.name,
    profile.category,
    profile.description || '',
    profile.intendedUse || '',
    ...Object.values(profile.attributes || {}),
    ...Object.values(techSpecsObj).map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))),
  ].join(' ');

  const explicitMatch = extractExplicitIsNumber(fullTextScan);
  if (explicitMatch) {
    explicitIsNumbers.add(explicitMatch);
    querySet.add(explicitMatch);
  }

  // 2. Primary Product Name Query & Expanded Synonyms
  const tokenizedName = tokenizeSearchQuery(profile.name);
  if (tokenizedName.cleanText) {
    querySet.add(tokenizedName.cleanText);
  }
  for (const expToken of tokenizedName.expandedTokens) {
    querySet.add(expToken);
  }

  const normName = normalizeAttribute(profile.name);
  if (normName.normalizedValue && normName.normalizedValue !== tokenizedName.cleanText) {
    querySet.add(normName.normalizedValue);
  }

  // 3. Category & Mapped Technical Sector
  const normCategory = normalizeAttribute(profile.category);
  if (normCategory.normalizedValue) {
    querySet.add(normCategory.normalizedValue);
  }
  const mappedSector = mapCategoryToBisSector(profile.category);
  if (mappedSector) {
    querySet.add(mappedSector);
    // Combine primary noun with mapped sector (e.g., "luminaire Electrotechnical")
    for (const token of tokenizedName.allSearchTokens) {
      if (token.length >= 4) {
        querySet.add(`${token} ${mappedSector}`);
      }
    }
  }

  if (profile.name && profile.category && profile.name.toLowerCase() !== profile.category.toLowerCase()) {
    querySet.add(`${profile.name} ${profile.category}`);
  }

  // 4. Intended Use Query
  if (profile.intendedUse) {
    const normUse = normalizeAttribute(profile.intendedUse);
    if (normUse.normalizedValue) {
      querySet.add(normUse.normalizedValue);
    }
  }

  // 5. Description Signals
  if (profile.description) {
    const tokenizedDesc = tokenizeSearchQuery(profile.description);
    for (const exp of tokenizedDesc.expandedTokens) {
      querySet.add(exp);
    }
    // High-significance description terms
    const descTokens = tokenizedDesc.primaryTokens.filter((t) => t.length >= 4);
    if (descTokens.length > 0) {
      querySet.add(descTokens.slice(0, 4).join(' '));
    }
  }

  // 6. Material / Component Queries
  if (profile.material) {
    const normMat = normalizeAttribute(profile.material);
    if (normMat.normalizedValue) {
      querySet.add(`${profile.name} ${normMat.normalizedValue}`);
    }
  }

  // 7. Structured Attributes & Tech Specs (e.g. voltage, power, application, rating)
  const combinedAttrs = { ...profile.attributes, ...techSpecsObj };
  for (const [key, val] of Object.entries(combinedAttrs)) {
    const kNorm = key.toLowerCase();
    const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
    if (['application', 'producttype', 'standard', 'specifications', 'use', 'voltage', 'power', 'supply'].includes(kNorm)) {
      const normVal = normalizeAttribute(strVal);
      if (normVal.normalizedValue) {
        querySet.add(normVal.normalizedValue);
      }
    }
  }

  // 8. Significant domain tokens for high recall
  tokenizedName.allSearchTokens.forEach((t) => {
    if (t.length >= 3) querySet.add(t);
  });
  normCategory.tokens.forEach((t) => {
    if (t.length >= 4) querySet.add(t);
  });

  // Collect all unique tokens across fields for matching & scoring
  const allTokens = new Set<string>([
    ...tokenizedName.allSearchTokens,
    ...normCategory.tokens,
    ...(profile.description ? tokenizeSearchQuery(profile.description).allSearchTokens : []),
    ...(profile.intendedUse ? normalizeAttribute(profile.intendedUse).tokens : []),
    ...(profile.material ? normalizeAttribute(profile.material).tokens : []),
  ]);

  return {
    profile: {
      ...profile,
      normalizedTokens: Array.from(allTokens),
      explicitIsNumber: explicitMatch || null,
    },
    queries: Array.from(querySet).filter(Boolean),
    explicitIsNumbers: Array.from(explicitIsNumbers),
  };
}
