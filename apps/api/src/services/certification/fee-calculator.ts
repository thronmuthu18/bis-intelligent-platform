import type {
  CertificationFeeEstimateItem,
  ProductCertificationReadiness,
} from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Phase 7 — Fee Calculator & Certification Readiness Evaluator
// ─────────────────────────────────────────────────────────────────────────────

export function buildFeeEstimates(
  resolvedSchemes: any[]
): CertificationFeeEstimateItem[] {
  const fees: CertificationFeeEstimateItem[] = [];

  if (resolvedSchemes.length === 0) {
    fees.push({
      id: `fee-1`,
      schemeId: null,
      feeType: 'OTHER',
      amount: null,
      currency: 'INR',
      status: 'NOT_AVAILABLE',
      source: 'BIS Knowledge Repository',
      effectiveDate: null,
      notes: 'Fee information is unavailable until candidate standard and conformity assessment scheme are established.',
    });
    return fees;
  }

  const hasSchemeI = resolvedSchemes.some((s) => s.schemeCode === 'SCHEME_I_ISI');
  const hasSchemeII = resolvedSchemes.some((s) => s.schemeCode === 'SCHEME_II_CRS');

  if (hasSchemeI) {
    const schemeI = resolvedSchemes.find((s) => s.schemeCode === 'SCHEME_I_ISI');
    const schemeId = schemeI?.schemeId || null;

    fees.push({
      id: `fee-${fees.length + 1}`,
      schemeId,
      feeType: 'APPLICATION_FEE',
      amount: 1000,
      currency: 'INR',
      status: 'OFFICIAL_FEE',
      source: 'BIS (Conformity Assessment) Regulations, 2018 - Schedule III',
      effectiveDate: '2018-06-01',
      notes: 'Non-refundable statutory application fee payable at time of Form-I submission on Manakonline.',
    });

    fees.push({
      id: `fee-${fees.length + 1}`,
      schemeId,
      feeType: 'PROCESSING_FEE',
      amount: 7000,
      currency: 'INR',
      status: 'OFFICIAL_FEE',
      source: 'BIS Fee Schedule for Domestic Manufacturers',
      effectiveDate: '2020-01-01',
      notes: 'Preliminary inspection and application processing fee for domestic manufacturing facilities.',
    });

    fees.push({
      id: `fee-${fees.length + 1}`,
      schemeId,
      feeType: 'INSPECTION_FEE',
      amount: 7000,
      currency: 'INR',
      status: 'ESTIMATED_FEE',
      source: 'BIS Factory Audit Norms',
      effectiveDate: '2020-01-01',
      notes: 'Estimated ₹7,000 per man-day of factory inspection plus applicable auditor TA/DA travel expenses.',
    });

    fees.push({
      id: `fee-${fees.length + 1}`,
      schemeId,
      feeType: 'TESTING_FEE',
      amount: null,
      currency: 'INR',
      status: 'VARIABLE',
      source: 'Designated BIS / NABL Testing Laboratory',
      effectiveDate: null,
      notes: 'Testing charges vary depending on product testing parameters prescribed by the Indian Standard.',
    });

    fees.push({
      id: `fee-${fees.length + 1}`,
      schemeId,
      feeType: 'ANNUAL_FEE',
      amount: null,
      currency: 'INR',
      status: 'VARIABLE',
      source: 'Product Manual / Minimum Marking Fee Schedule',
      effectiveDate: null,
      notes: 'Annual marking fee based on actual unit production volume or the minimum marking fee specified in the product manual.',
    });
  }

  if (hasSchemeII) {
    const schemeII = resolvedSchemes.find((s) => s.schemeCode === 'SCHEME_II_CRS');
    const schemeId = schemeII?.schemeId || null;

    fees.push({
      id: `fee-${fees.length + 1}`,
      schemeId,
      feeType: 'APPLICATION_FEE',
      amount: 1000,
      currency: 'INR',
      status: 'OFFICIAL_FEE',
      source: 'MeitY / BIS Compulsory Registration Schedule',
      effectiveDate: '2021-04-01',
      notes: 'Application submission fee per registration batch.',
    });

    fees.push({
      id: `fee-${fees.length + 1}`,
      schemeId,
      feeType: 'PROCESSING_FEE',
      amount: 50000,
      currency: 'INR',
      status: 'OFFICIAL_FEE',
      source: 'MeitY / BIS CRS Fee Schedule',
      effectiveDate: '2021-04-01',
      notes: 'Government processing fee covering up to 10 series models for a 2-year validity period.',
    });

    fees.push({
      id: `fee-${fees.length + 1}`,
      schemeId,
      feeType: 'TESTING_FEE',
      amount: null,
      currency: 'INR',
      status: 'VARIABLE',
      source: 'BIS-Recognized Laboratory',
      effectiveDate: null,
      notes: 'Paid directly to the BIS-recognized laboratory for safety and EMC testing.',
    });
  }

  return fees;
}

/**
 * Evaluates certification workflow readiness.
 */
export function evaluateCertificationReadiness(
  product: any,
  matchedStandards: any[],
  resolvedSchemes: any[],
  documentation: any[]
): ProductCertificationReadiness {
  const blockers: string[] = [];
  const recommendations: string[] = [];

  // Check matched standards
  if (!matchedStandards || matchedStandards.length === 0) {
    blockers.push('No candidate Indian Standard identified for this product.');
    recommendations.push('Run Product Intelligence analysis in the Standards workspace.');
    return {
      status: 'INSUFFICIENT_BIS_EVIDENCE',
      score: 20,
      summary: 'Insufficient BIS evidence available to determine conformity scheme.',
      blockers,
      recommendations,
    };
  }

  // Check resolved schemes
  if (!resolvedSchemes || resolvedSchemes.length === 0) {
    blockers.push('No conformity assessment scheme mapping found in the knowledge repository for matched standard.');
    recommendations.push('Verify standard details or consult official BIS Manakonline portal for latest notifications.');
    return {
      status: 'INSUFFICIENT_BIS_EVIDENCE',
      score: 35,
      summary: 'Standards identified, but no official scheme mapping is established in the local repository.',
      blockers,
      recommendations,
    };
  }

  // Check product profile completeness
  let missingInfo = false;
  if (!product.manufacturerName || !product.manufacturerAddress) {
    missingInfo = true;
    blockers.push('Manufacturing premise address is not fully recorded in product profile.');
    recommendations.push('Update product details with full factory manufacturing address.');
  }

  if (!product.intendedUse && !product.description) {
    missingInfo = true;
    blockers.push('Technical description and intended use are incomplete.');
    recommendations.push('Provide complete technical specifications and target market details.');
  }

  if (missingInfo) {
    return {
      status: 'MISSING_PRODUCT_INFORMATION',
      score: 55,
      summary: 'Candidate scheme identified, but product profile information is incomplete for statutory filing.',
      blockers,
      recommendations,
    };
  }

  // Check documentation requirements
  const requiredDocs = documentation.filter((d) => d.requiredStatus === 'REQUIRED');
  recommendations.push(`Prepare ${requiredDocs.length} required statutory documents according to the checklist.`);
  recommendations.push('Review candidate scheme recommendations and confirm applicability.');
  recommendations.push('Prepare designated in-house testing equipment list with calibration records.');

  return {
    status: 'READY_FOR_DOCUMENT_REVIEW',
    score: 85,
    summary: 'Candidate certification scheme and statutory checklist established. Ready for document dossier compilation.',
    blockers: [],
    recommendations,
  };
}
