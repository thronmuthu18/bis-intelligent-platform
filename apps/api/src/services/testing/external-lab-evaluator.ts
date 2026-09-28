import type { ProductExternalLabRequirementItem } from '@bis/shared';

/**
 * Evaluates whether external laboratory testing is required for the certification scheme and standard.
 */
export function evaluateExternalLabRequirements(
  standard: any,
  scheme: any = null,
  _productManual: any = null
): ProductExternalLabRequirementItem[] {
  const schemeCode = scheme?.code || '';
  const standardNumber = standard.isNumber || standard.title || '';
  const results: ProductExternalLabRequirementItem[] = [];

  if (schemeCode.includes('SCHEME_II') || schemeCode.includes('CRS')) {
    // Scheme-II Compulsory Registration Scheme (CRS)
    results.push({
      id: `ext-lab-${standard.id}-1`,
      analysisId: '',
      schemeId: scheme ? scheme.id : null,
      schemeCode: 'SCHEME_II_CRS',
      requirementType: 'EXTERNAL_LAB_REQUIRED',
      reason:
        'Compulsory Registration Scheme (CRS) mandates that product samples must be tested at a BIS-recognized laboratory in India before submitting the registration application on the CRS portal.',
      sampleSize: '2 to 3 randomly selected finished production units (with power supply/accessories)',
      testingDuration: '15 to 25 working days (subject to laboratory testing queue and test protocol)',
      source: 'MeitY / BIS CRS Operating Guidelines & Conformity Assessment Regulations 2018',
      notes:
        'Test reports issued by BIS-recognized labs are valid for 90 days for initial application submission.',
      rank: 1,
      createdAt: new Date().toISOString(),
    });
  } else if (schemeCode.includes('SCHEME_I') || schemeCode.includes('ISI')) {
    // Scheme-I ISI Mark Certification
    results.push({
      id: `ext-lab-${standard.id}-1`,
      analysisId: scheme ? scheme.id : null,
      schemeId: scheme ? scheme.id : null,
      schemeCode: 'SCHEME_I_ISI',
      requirementType: 'EXTERNAL_LAB_REQUIRED',
      reason:
        'Scheme-I (ISI Mark) requires independent laboratory testing for initial Grant of Licence (GoL) sample draw conducted during the BIS preliminary factory audit, as well as periodic market surveillance samples.',
      sampleSize: 'Sample size determined by BIS Scheme of Inspection and Testing (STI) sampling schedule',
      testingDuration: '20 to 35 working days depending on complete type test parameters',
      source: 'BIS (Conformity Assessment) Regulations 2018, Scheme-I Guidelines',
      notes:
        'Samples sealed by BIS inspecting officers are forwarded directly to BIS Central/Branch labs or BIS-recognized third-party labs.',
      rank: 1,
      createdAt: new Date().toISOString(),
    });

    results.push({
      id: `ext-lab-${standard.id}-2`,
      analysisId: '',
      schemeId: scheme ? scheme.id : null,
      schemeCode: 'SCHEME_I_ISI',
      requirementType: 'FACTORY_TESTING',
      reason:
        'Manufacturer must maintain an in-house testing laboratory equipped with all test equipment specified in the Product Manual / STI for routine batch inspection before applying the ISI Standard Mark.',
      sampleSize: '100% routine testing / control unit batch sampling as per STI Table 1',
      testingDuration: 'Continuous during manufacturing operations',
      source: 'BIS Product Manual & Scheme of Testing and Inspection (STI)',
      notes:
        'Records of in-house testing and calibration must be maintained and produced during BIS audit visits.',
      rank: 2,
      createdAt: new Date().toISOString(),
    });
  } else {
    // General or Scheme-IV
    results.push({
      id: `ext-lab-${standard.id}-1`,
      analysisId: '',
      schemeId: scheme ? scheme.id : null,
      schemeCode: schemeCode || null,
      requirementType: 'EXTERNAL_LAB_CONDITIONALLY_REQUIRED',
      reason: `Independent laboratory testing is required to substantiate conformity with ${standardNumber} when official technical verification is mandated by regulatory bodies.`,
      sampleSize: 'Representative batch sample units as defined by governing test standard',
      testingDuration: 'Standard laboratory turnaround (approx. 14–30 days)',
      source: 'BIS Standards Specification & Conformity Guidelines',
      notes: 'Testing facility should possess verified NABL accreditation or BIS recognition.',
      rank: 1,
      createdAt: new Date().toISOString(),
    });
  }

  return results;
}
