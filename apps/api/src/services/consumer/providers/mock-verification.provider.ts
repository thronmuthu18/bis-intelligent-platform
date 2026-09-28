// ─────────────────────────────────────────────────────────────────────────────
//  MockVerificationProvider — Deterministic verification provider for tests
// ─────────────────────────────────────────────────────────────────────────────

import type {
  LicenceVerificationItem,
  HallmarkVerificationItem,
} from '@bis/shared';
import type {
  IVerificationProvider,
  VerifyLicenceParams,
  VerifyHuidParams,
} from './verification-provider.interface.js';

export class MockVerificationProvider implements IVerificationProvider {
  public readonly providerName = 'MockVerificationProvider (Test / Development)';

  private static readonly KNOWN_LICENCES: Record<string, Partial<LicenceVerificationItem>> = {
    'CM/L-1234567': {
      licenceNumber: 'CM/L-1234567',
      manufacturer: 'Havells India Limited',
      productName: 'Self-Ballasted LED Lamps for General Lighting',
      productCategory: 'Electronics & IT Goods',
      standardNumber: 'IS 16102 (Part 1)',
      standardTitle: 'Self-Ballasted LED Lamps for General Lighting Services - Part 1: Safety Requirements',
      status: 'VERIFIED',
      statusDetails: 'Licence is operative and active in BIS Central Registry.',
      validityStart: '2024-04-01T00:00:00.000Z',
      validityEnd: '2027-03-31T23:59:59.000Z',
      factoryAddress: 'Plot No. 1, Sector 10, IIE SIDCUL, Haridwar, Uttarakhand - 249403',
      brandName: 'HAVELLS',
      source: 'BIS Manakonline Product Certification Portal (Mock Source)',
      sourceUrl: 'https://www.manakonline.in/MANAK/certLicenceSearch',
      sourceAuthority: 'Bureau of Indian Standards (BIS)',
      evidence: {
        scheme: 'Scheme-I (ISI Mark)',
        operativeBranchOffice: 'Dehradun Branch Office (DDBO)',
        scopeCovered: 'Up to and including 50W LED Lamps',
      },
    },
    'CM/L-8765432': {
      licenceNumber: 'CM/L-8765432',
      manufacturer: 'Syska LED Lights Private Limited',
      productName: 'Fixed General Purpose LED Luminaires',
      productCategory: 'Electrical Appliances',
      standardNumber: 'IS 10322 (Part 5/Sec 1)',
      standardTitle: 'Luminaires - Particular Requirements - Section 1: Fixed General Purpose Luminaires',
      status: 'VERIFIED',
      statusDetails: 'Licence active under Scheme-I.',
      validityStart: '2023-01-01T00:00:00.000Z',
      validityEnd: '2026-12-31T23:59:59.000Z',
      factoryAddress: 'Industrial Area Phase 2, Pune, Maharashtra - 411028',
      brandName: 'SYSKA',
      source: 'BIS Manakonline Product Certification Portal (Mock Source)',
      sourceUrl: 'https://www.manakonline.in/MANAK/certLicenceSearch',
      sourceAuthority: 'Bureau of Indian Standards (BIS)',
      evidence: {
        scheme: 'Scheme-I (ISI Mark)',
        operativeBranchOffice: 'Pune Branch Office',
      },
    },
    'CRS-9876543': {
      licenceNumber: 'CRS-9876543',
      manufacturer: 'Alpha Electronics Tech Ltd',
      productName: 'Power Adaptors for IT Equipment',
      productCategory: 'Electronics and Information Technology Goods',
      standardNumber: 'IS 13252 (Part 1)',
      standardTitle: 'Information Technology Equipment - Safety - General Requirements',
      status: 'VERIFIED',
      statusDetails: 'Registration active under Compulsory Registration Scheme (CRS).',
      validityStart: '2023-06-01T00:00:00.000Z',
      validityEnd: '2025-05-31T23:59:59.000Z',
      factoryAddress: 'Tech Park Zone A, Bengaluru, Karnataka - 560100',
      brandName: 'ALPHA',
      source: 'BIS e-BIS CRS Portal (Mock Source)',
      sourceUrl: 'https://www.crsbis.in/BIS/app-crs.do',
      sourceAuthority: 'Bureau of Indian Standards (BIS)',
      evidence: {
        scheme: 'Scheme-II (CRS Registration)',
      },
    },
    'CM/L-REVIEW123': {
      licenceNumber: 'CM/L-REVIEW123',
      manufacturer: 'Beta Manufacturing Ltd',
      productName: 'Polyethylene Pipes',
      productCategory: 'Civil & Piping',
      standardNumber: 'IS 4984',
      status: 'NEEDS_REVIEW',
      statusDetails: 'Licence renewal application under process or conditional verification required.',
      source: 'BIS Public Register (Mock Source)',
      sourceUrl: 'https://www.manakonline.in/MANAK/certLicenceSearch',
      sourceAuthority: 'Bureau of Indian Standards (BIS)',
      evidence: {
        note: 'Renewal submitted; branch office inspection report pending.',
      },
    },
  };

  private static readonly KNOWN_HUIDS: Record<string, Partial<HallmarkVerificationItem>> = {
    'AZ1234': {
      huid: 'AZ1234',
      verificationStatus: 'VERIFIED',
      articleType: 'Gold Ring',
      purityPpm: 916,
      purityKarat: '22K (916)',
      hallmarkingCentreName: 'Apex Assaying & Hallmarking Centre',
      hallmarkingCentreCode: 'AHC-DL-001',
      hallmarkingDate: '2025-08-15T11:30:00.000Z',
      jewellerName: 'Tanishq Jewellers Ltd',
      jewellerRegistrationNumber: 'JW-DL-9821',
      sourceUrl: 'https://www.manakonline.in/MANAK/hallmarkingSearch',
      sourceAuthority: 'Bureau of Indian Standards (BIS)',
      evidence: {
        standardNumber: 'IS 1417:2016',
        standardTitle: 'Gold and Gold Alloys, Jewellery/Artefacts - Fineness and Marking',
        assayingMethod: 'Fire Assay (Cupellation) as per IS 1418',
        purityVerifiedPpm: 916.4,
      },
    },
    'HUID-925-ABCD': {
      huid: 'HUID-925-ABCD',
      verificationStatus: 'VERIFIED',
      articleType: 'Gold Bangle Set',
      purityPpm: 916,
      purityKarat: '22K (916)',
      hallmarkingCentreName: 'National Gold Assaying Centre',
      hallmarkingCentreCode: 'AHC-MH-012',
      hallmarkingDate: '2025-05-10T09:15:00.000Z',
      jewellerName: 'Kalyan Jewellers India Limited',
      jewellerRegistrationNumber: 'JW-MH-4402',
      sourceUrl: 'https://www.manakonline.in/MANAK/hallmarkingSearch',
      sourceAuthority: 'Bureau of Indian Standards (BIS)',
      evidence: {
        standardNumber: 'IS 1417:2016',
        assayingMethod: 'Fire Assay',
        purityVerifiedPpm: 917.2,
      },
    },
    'SILV88': {
      huid: 'SILV88',
      verificationStatus: 'VERIFIED',
      articleType: 'Silver Utensil Article',
      purityPpm: 925,
      purityKarat: 'Silver (925)',
      hallmarkingCentreName: 'Southern Hallmarking Lab',
      hallmarkingCentreCode: 'AHC-TN-005',
      hallmarkingDate: '2025-02-20T14:00:00.000Z',
      jewellerName: 'GRT Jewellers Pvt Ltd',
      jewellerRegistrationNumber: 'JW-TN-1120',
      sourceUrl: 'https://www.manakonline.in/MANAK/hallmarkingSearch',
      sourceAuthority: 'Bureau of Indian Standards (BIS)',
      evidence: {
        standardNumber: 'IS 2112:2014',
        standardTitle: 'Silver and Silver Alloys, Jewellery/Artefacts - Fineness and Marking',
        purityVerifiedPpm: 926.0,
      },
    },
    'HUID-REVIEW': {
      huid: 'HUID-REVIEW',
      verificationStatus: 'NEEDS_REVIEW',
      articleType: 'Gold Chain',
      hallmarkingCentreName: 'Central Assaying Centre',
      sourceUrl: 'https://www.manakonline.in/MANAK/hallmarkingSearch',
      sourceAuthority: 'Bureau of Indian Standards (BIS)',
      evidence: {
        note: 'Record exists in centre log but jeweller registration confirmation is pending verification.',
      },
    },
  };

  public async verifyLicence(params: VerifyLicenceParams): Promise<LicenceVerificationItem> {
    const cleanNum = params.licenceNumber.trim().toUpperCase();

    if (cleanNum === 'CM/L-UNAVAILABLE' || cleanNum === 'UNAVAILABLE') {
      return {
        licenceNumber: params.licenceNumber,
        status: 'SOURCE_UNAVAILABLE',
        statusDetails: 'The authoritative verification source is temporarily unreachable.',
        source: 'BIS Central Registry Gateway',
        sourceAuthority: 'Bureau of Indian Standards (BIS)',
        retrievedAt: new Date().toISOString(),
        disclaimer:
          'Verification could not be completed from the currently connected authoritative source. Please check the official BIS portal.',
      };
    }

    const match = MockVerificationProvider.KNOWN_LICENCES[cleanNum];
    if (match) {
      return {
        licenceNumber: match.licenceNumber || params.licenceNumber,
        manufacturer: match.manufacturer,
        productName: match.productName || params.productName,
        productCategory: match.productCategory,
        standardNumber: match.standardNumber || params.standardNumber,
        standardTitle: match.standardTitle,
        status: match.status || 'VERIFIED',
        statusDetails: match.statusDetails,
        validityStart: match.validityStart,
        validityEnd: match.validityEnd,
        factoryAddress: match.factoryAddress,
        brandName: match.brandName,
        source: match.source || 'BIS Manakonline Product Certification Portal',
        sourceUrl: match.sourceUrl || 'https://www.manakonline.in',
        sourceAuthority: match.sourceAuthority || 'Bureau of Indian Standards (BIS)',
        retrievedAt: new Date().toISOString(),
        evidence: match.evidence,
        disclaimer:
          'This decision-support information is retrieved from authoritative records available to this platform. It does not replace official BIS certificates or statutory verification notices.',
      };
    }

    // Default Not Found
    return {
      licenceNumber: params.licenceNumber,
      status: 'NOT_FOUND',
      statusDetails:
        'No matching record was found in the authoritative register for the provided licence number.',
      source: 'BIS Central Public Register',
      sourceUrl: 'https://www.manakonline.in/MANAK/certLicenceSearch',
      sourceAuthority: 'Bureau of Indian Standards (BIS)',
      retrievedAt: new Date().toISOString(),
      disclaimer:
        'A "NOT FOUND" result indicates that no record currently matches this identifier in the connected repository. It does not constitute a legal declaration of invalidity.',
    };
  }

  public async verifyHuid(params: VerifyHuidParams): Promise<HallmarkVerificationItem> {
    const cleanHuid = params.huid.trim().toUpperCase();

    if (cleanHuid === 'HUID-UNAVAIL' || cleanHuid === 'UNAV00') {
      return {
        huid: params.huid,
        verificationStatus: 'SOURCE_UNAVAILABLE',
        sourceAuthority: 'Bureau of Indian Standards (BIS)',
        retrievedAt: new Date().toISOString(),
        disclaimer:
          'Verification could not be completed from the currently connected authoritative source. Please verify via the official BIS CARE App or manakonline.in.',
      };
    }

    const match = MockVerificationProvider.KNOWN_HUIDS[cleanHuid];
    if (match) {
      return {
        huid: match.huid || params.huid,
        enteredDetails: {
          articleType: params.articleType,
          purityKarat: params.purityKarat,
          jewellerName: params.jewellerName,
        },
        verificationStatus: match.verificationStatus || 'VERIFIED',
        articleType: match.articleType || params.articleType,
        purityPpm: match.purityPpm,
        purityKarat: match.purityKarat || params.purityKarat,
        hallmarkingCentreName: match.hallmarkingCentreName,
        hallmarkingCentreCode: match.hallmarkingCentreCode,
        hallmarkingDate: match.hallmarkingDate,
        jewellerName: match.jewellerName || params.jewellerName,
        jewellerRegistrationNumber: match.jewellerRegistrationNumber,
        sourceUrl: match.sourceUrl || 'https://www.manakonline.in/MANAK/hallmarkingSearch',
        sourceAuthority: match.sourceAuthority || 'Bureau of Indian Standards (BIS)',
        retrievedAt: new Date().toISOString(),
        evidence: match.evidence,
        disclaimer:
          'Verification result is based on the authoritative source record available to this platform at the time of retrieval. It does not constitute an in-person physical authentication.',
      };
    }

    // Default Not Found
    return {
      huid: params.huid,
      enteredDetails: {
        articleType: params.articleType,
        purityKarat: params.purityKarat,
        jewellerName: params.jewellerName,
      },
      verificationStatus: 'NOT_FOUND',
      sourceUrl: 'https://www.manakonline.in/MANAK/hallmarkingSearch',
      sourceAuthority: 'Bureau of Indian Standards (BIS)',
      retrievedAt: new Date().toISOString(),
      disclaimer:
        'No authoritative record was found for this HUID in the connected knowledge repository. This does not definitively conclude that the jewellery item is unauthentic; please verify via the official BIS CARE mobile application.',
    };
  }
}
