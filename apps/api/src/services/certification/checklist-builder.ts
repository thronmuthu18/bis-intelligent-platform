import type {
  ProductDocumentationChecklistItem,
  ProductApplicationRequirementItem,
} from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Phase 7 — Documentation Checklist & Application Requirements Builder
// ─────────────────────────────────────────────────────────────────────────────

export function buildDocumentationChecklist(
  _product: any,
  matchedStandards: any[],
  resolvedSchemes: any[]
): ProductDocumentationChecklistItem[] {
  const checklist: ProductDocumentationChecklistItem[] = [];
  let rank = 1;

  if (resolvedSchemes.length === 0) {
    // If no schemes resolved
    checklist.push({
      id: `doc-${rank}`,
      schemeId: null,
      category: 'General Verification',
      documentName: 'Product Technical Data Sheet & Specification',
      requiredStatus: 'REQUIRED',
      reason: 'Essential technical description required to identify applicable Indian Standard and certification route',
      source: 'BIS Standard Operating Procedure',
      notes: 'Provide product name, intended use, rated electrical/mechanical parameters',
      rank: rank++,
    });
    return checklist;
  }

  const hasSchemeI = resolvedSchemes.some((s) => s.schemeCode === 'SCHEME_I_ISI');
  const hasSchemeII = resolvedSchemes.some((s) => s.schemeCode === 'SCHEME_II_CRS');
  const hasSchemeIV = resolvedSchemes.some((s) => s.schemeCode === 'SCHEME_IV');

  // Find primary product manual if present
  let pmTitle: string | null = null;
  for (const std of matchedStandards) {
    const s = std.standard || std;
    if (s.productManuals && s.productManuals.length > 0) {
      pmTitle = s.productManuals[0].title;
      break;
    }
  }

  // 1. Legal & Organizational Documents
  checklist.push({
    id: `doc-${rank}`,
    schemeId: resolvedSchemes[0]?.schemeId || null,
    category: 'Legal & Organization',
    documentName: 'Proof of Manufacturing Premises & Factory Registration',
    requiredStatus: 'REQUIRED',
    reason: 'Statutory proof of manufacturing premise (Factory License, GST Registration, or DIC/MSME Certificate) required for BIS application verification',
    source: 'BIS (Conformity Assessment) Regulations, 2018',
    notes: 'Must clearly show full factory address matching the application profile',
    rank: rank++,
  });

  checklist.push({
    id: `doc-${rank}`,
    schemeId: resolvedSchemes[0]?.schemeId || null,
    category: 'Legal & Organization',
    documentName: 'Authorized Signatory Authorization Letter / Power of Attorney',
    requiredStatus: 'REQUIRED',
    reason: 'Official company authorization delegating signing power to the compliance representative',
    source: 'BIS Guidelines for Application Submission',
    notes: 'Signed by Director / Partner / Proprietor with company seal',
    rank: rank++,
  });

  // 2. Technical Specifications
  checklist.push({
    id: `doc-${rank}`,
    schemeId: resolvedSchemes[0]?.schemeId || null,
    category: 'Technical Specifications',
    documentName: 'Complete Bill of Materials (BOM) & Component Specifications',
    requiredStatus: 'REQUIRED',
    reason: 'Itemized list of critical components, safety-critical parts, and their individual standard approvals',
    source: pmTitle ? `Product Manual: ${pmTitle}` : 'BIS Product Manual / STI Guidelines',
    notes: 'Must include part numbers, ratings, insulation classes, and component certifications',
    rank: rank++,
  });

  checklist.push({
    id: `doc-${rank}`,
    schemeId: resolvedSchemes[0]?.schemeId || null,
    category: 'Technical Specifications',
    documentName: 'Product Drawing, Circuit Schematic, and Marking Plate Artwork',
    requiredStatus: 'REQUIRED',
    reason: 'Detailed technical drawings and draft marking plate showing ISI / Standard Mark placement and model nomenclature',
    source: 'BIS Standard Marking & Labelling Guidelines',
    notes: 'Draft label must indicate standard number, brand, model, electrical ratings, and country of origin',
    rank: rank++,
  });

  // 3. Quality Control & Manufacturing Process (Scheme-I Specific)
  if (hasSchemeI) {
    const schemeI = resolvedSchemes.find((s) => s.schemeCode === 'SCHEME_I_ISI');
    checklist.push({
      id: `doc-${rank}`,
      schemeId: schemeI?.schemeId || null,
      category: 'Quality Control & Process',
      documentName: 'Manufacturing Process Flow Chart & Quality Assurance Plan',
      requiredStatus: 'REQUIRED',
      reason: 'Scheme of Testing and Inspection (STI) compliance requires documented in-process quality control checkpoints from raw material to dispatch',
      source: pmTitle ? `Product Manual: ${pmTitle}` : 'Scheme-I STI Framework',
      notes: 'Required for factory audit verification by BIS inspecting officers',
      rank: rank++,
    });

    checklist.push({
      id: `doc-${rank}`,
      schemeId: schemeI?.schemeId || null,
      category: 'Quality Control & Process',
      documentName: 'List of In-House Test Equipment & Valid Calibration Certificates',
      requiredStatus: 'REQUIRED',
      reason: 'Manufacturers under Scheme-I must maintain designated in-house testing equipment with NABL-traceable calibration',
      source: 'BIS (Conformity Assessment) Regulations, 2018 - Clause 4',
      notes: 'Calibration certificates must be within valid calibration cycle from accredited calibration laboratory',
      rank: rank++,
    });
  }

  // 4. Testing & Laboratory Reports
  if (hasSchemeII) {
    const schemeII = resolvedSchemes.find((s) => s.schemeCode === 'SCHEME_II_CRS');
    checklist.push({
      id: `doc-${rank}`,
      schemeId: schemeII?.schemeId || null,
      category: 'Testing & Laboratory',
      documentName: 'Test Report from BIS-Recognized Laboratory (within 90 days validity)',
      requiredStatus: 'REQUIRED',
      reason: 'Under Scheme-II (CRS), registration is granted based on self-declaration backed by valid test report from a BIS-approved laboratory',
      source: 'MeitY / BIS Compulsory Registration Scheme Guidelines',
      notes: 'Test report must cover all declared models / series and not exceed 90 days from report issuance to submission',
      rank: rank++,
    });

    checklist.push({
      id: `doc-${rank}`,
      schemeId: schemeII?.schemeId || null,
      category: 'Legal & Organization',
      documentName: 'Authorized Indian Representative (AIR) Agreement (Foreign Manufacturers)',
      requiredStatus: 'CONDITIONALLY_REQUIRED',
      reason: 'Foreign manufacturers without an office in India must appoint an Authorized Indian Representative',
      source: 'CRS Guidelines for Overseas Manufacturers',
      notes: 'Required only if manufacturing facility is located outside India',
      rank: rank++,
    });
  } else if (hasSchemeI) {
    const schemeI = resolvedSchemes.find((s) => s.schemeCode === 'SCHEME_I_ISI');
    checklist.push({
      id: `doc-${rank}`,
      schemeId: schemeI?.schemeId || null,
      category: 'Testing & Laboratory',
      documentName: 'Independent Laboratory Test Report (Simplified Procedure Option)',
      requiredStatus: 'CONDITIONALLY_REQUIRED',
      reason: 'Under the Simplified Procedure, submitting pre-tested independent laboratory reports accelerates grant of licence',
      source: 'BIS Simplified Procedure Guidelines (Manakonline)',
      notes: 'Mandatory under Option 1 (Simplified Scheme); optional under Option 2 (Normal Scheme)',
      rank: rank++,
    });
  }

  // 5. Scheme-IV
  if (hasSchemeIV) {
    const schemeIV = resolvedSchemes.find((s) => s.schemeCode === 'SCHEME_IV');
    checklist.push({
      id: `doc-${rank}`,
      schemeId: schemeIV?.schemeId || null,
      category: 'Testing & Laboratory',
      documentName: 'Batch Conformity Test Report & Type Test Certificate',
      requiredStatus: 'REQUIRED',
      reason: 'Scheme-IV Certificate of Conformity requires verified lot / batch conformity verification',
      source: 'BIS Scheme-IV Regulations',
      notes: 'Specific to designated manufacturing lots or export consignments',
      rank: rank++,
    });
  }

  return checklist;
}

/**
 * Builds application requirements and form numbers based on resolved schemes.
 */
export function buildApplicationRequirements(
  resolvedSchemes: any[]
): ProductApplicationRequirementItem[] {
  const items: ProductApplicationRequirementItem[] = [];
  let rank = 1;

  for (const schemeItem of resolvedSchemes) {
    if (schemeItem.schemeCode === 'SCHEME_I_ISI') {
      items.push({
        id: `app-req-${rank}`,
        schemeId: schemeItem.schemeId,
        formName: 'Form-I (Application for Grant of Licence to use the Standard Mark)',
        formPurpose: 'Official statutory application for grant of ISI Mark license for domestic and foreign manufacturers under Scheme-I',
        applicableScheme: 'Scheme-I (ISI Mark Certification)',
        source: 'BIS (Conformity Assessment) Regulations, 2018 - Schedule II',
        officialUrl: 'https://www.manakonline.in',
        rank: rank++,
      });
    } else if (schemeItem.schemeCode === 'SCHEME_II_CRS') {
      items.push({
        id: `app-req-${rank}`,
        schemeId: schemeItem.schemeId,
        formName: 'Form-VI (Application for Grant of Registration)',
        formPurpose: 'Application for self-declaration registration under the Compulsory Registration Scheme (CRS) for electronics and IT equipment',
        applicableScheme: 'Scheme-II (Compulsory Registration Scheme - CRS)',
        source: 'MeitY / BIS Compulsory Registration Portal',
        officialUrl: 'https://www.crsbis.in',
        rank: rank++,
      });
    } else if (schemeItem.schemeCode === 'SCHEME_IV') {
      items.push({
        id: `app-req-${rank}`,
        schemeId: schemeItem.schemeId,
        formName: 'Form-VIII (Application for Certificate of Conformity)',
        formPurpose: 'Statutory application for Certificate of Conformity under Scheme-IV',
        applicableScheme: 'Scheme-IV (Certificate of Conformity)',
        source: 'BIS (Conformity Assessment) Regulations, 2018',
        officialUrl: 'https://www.services.bis.gov.in',
        rank: rank++,
      });
    }
  }

  if (items.length === 0) {
    items.push({
      id: `app-req-${rank}`,
      schemeId: null,
      formName: 'Official Form Information Pending Standard Determination',
      formPurpose: 'Official statutory form will be determined based on candidate standard and scheme mapping',
      applicableScheme: 'Unassigned',
      source: 'BIS Knowledge Repository',
      officialUrl: 'https://www.services.bis.gov.in',
      rank: rank++,
    });
  }

  return items;
}
