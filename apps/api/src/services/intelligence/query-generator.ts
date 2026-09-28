// ─────────────────────────────────────────────────────────────────────────────
//  Product Intelligence Query Generator (Phase 6)
// ─────────────────────────────────────────────────────────────────────────────

import { normalizeAttribute, extractExplicitIsNumber } from './normalizer.js';

export interface ProductSearchProfile {
  productId: string;
  name: string;
  category: string;
  description?: string;
  intendedUse?: string;
  sector?: string;
  material?: string;
  application?: string;
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

  // 1. Check for explicit IS numbers in name, description, intendedUse, and attributes
  const fullTextScan = [
    profile.name,
    profile.category,
    profile.description || '',
    profile.intendedUse || '',
    ...Object.values(profile.attributes || {}),
  ].join(' ');

  const explicitMatch = extractExplicitIsNumber(fullTextScan);
  if (explicitMatch) {
    explicitIsNumbers.add(explicitMatch);
    querySet.add(explicitMatch);
  }

  // 2. Primary Product Name Query
  const normName = normalizeAttribute(profile.name);
  if (normName.normalizedValue) {
    querySet.add(normName.normalizedValue);
  }

  // 3. Category + Application Query
  const normCategory = normalizeAttribute(profile.category);
  if (normCategory.normalizedValue) {
    querySet.add(normCategory.normalizedValue);
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

  // 5. Material / Component Queries
  if (profile.material) {
    const normMat = normalizeAttribute(profile.material);
    if (normMat.normalizedValue) {
      querySet.add(`${profile.name} ${normMat.normalizedValue}`);
    }
  }

  // 6. Structured Attributes (e.g. voltage, power, application)
  const attrEntries = Object.entries(profile.attributes || {});
  for (const [key, val] of attrEntries) {
    const kNorm = key.toLowerCase();
    if (['application', 'producttype', 'standard', 'specifications', 'use'].includes(kNorm)) {
      const normVal = normalizeAttribute(val);
      if (normVal.normalizedValue) {
        querySet.add(normVal.normalizedValue);
      }
    }
  }

  // 7. Significant domain tokens for high lexical recall
  normName.tokens.forEach((t) => {
    if (t.length >= 4) querySet.add(t);
  });
  normCategory.tokens.forEach((t) => {
    if (t.length >= 4) querySet.add(t);
  });

  // Collect all unique tokens across fields
  const allTokens = new Set<string>([
    ...normName.tokens,
    ...normCategory.tokens,
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
