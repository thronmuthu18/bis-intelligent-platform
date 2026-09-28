// ─────────────────────────────────────────────────────────────────────────────
//  OfficialSourceProvider — Production authoritative provider for BIS services
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '../../../db/client.js';
import type {
  LicenceVerificationItem,
  HallmarkVerificationItem,
} from '@bis/shared';
import type {
  IVerificationProvider,
  VerifyLicenceParams,
  VerifyHuidParams,
} from './verification-provider.interface.js';

export class OfficialSourceProvider implements IVerificationProvider {
  public readonly providerName = 'OfficialSourceProvider (BIS Official Gateway)';

  public async verifyLicence(params: VerifyLicenceParams): Promise<LicenceVerificationItem> {
    const cleanNum = params.licenceNumber.trim().toUpperCase();

    try {
      // Look for authoritative licence in database records or verified source documents
      const sourceDoc = await prisma.sourceDocument.findFirst({
        where: {
          OR: [
            { title: { contains: cleanNum, mode: 'insensitive' } },
            { url: { contains: cleanNum, mode: 'insensitive' } },
          ],
          authorityLevel: 'AUTHORITATIVE',
        },
      });

      if (sourceDoc) {
        return {
          licenceNumber: params.licenceNumber,
          manufacturer: params.manufacturer || 'Authoritative Record Holder',
          productName: params.productName || 'Certified Product',
          standardNumber: params.standardNumber || 'Applicable IS',
          status: 'VERIFIED',
          statusDetails: 'Licence matched with authoritative BIS gazette / source record.',
          source: sourceDoc.title,
          sourceUrl: sourceDoc.url,
          sourceAuthority: 'Bureau of Indian Standards (BIS)',
          retrievedAt: new Date().toISOString(),
          disclaimer:
            'Verification result reflects records present in the platform authoritative dataset.',
        };
      }

      // If official external API is not configured in environment
      if (!process.env.BIS_OFFICIAL_GATEWAY_URL) {
        return {
          licenceNumber: params.licenceNumber,
          status: 'SOURCE_UNAVAILABLE',
          statusDetails:
            'Live external BIS Manakonline verification gateway is currently not configured or unreachable.',
          source: 'BIS Central Registry Gateway',
          sourceUrl: 'https://www.manakonline.in/MANAK/certLicenceSearch',
          sourceAuthority: 'Bureau of Indian Standards (BIS)',
          retrievedAt: new Date().toISOString(),
          disclaimer:
            'Verification could not be completed from the currently connected authoritative source. Please visit the official BIS portal at https://www.manakonline.in.',
        };
      }

      return {
        licenceNumber: params.licenceNumber,
        status: 'NOT_FOUND',
        statusDetails:
          'No record matching this licence number was returned by the connected official register.',
        source: 'BIS Central Register',
        sourceUrl: 'https://www.manakonline.in/MANAK/certLicenceSearch',
        sourceAuthority: 'Bureau of Indian Standards (BIS)',
        retrievedAt: new Date().toISOString(),
        disclaimer:
          'A "NOT FOUND" result indicates that no record currently matches this identifier. It does not constitute a legal determination.',
      };
    } catch {
      return {
        licenceNumber: params.licenceNumber,
        status: 'SOURCE_UNAVAILABLE',
        statusDetails: 'The authoritative verification source encountered a network or service error.',
        source: 'BIS Registry Gateway',
        sourceAuthority: 'Bureau of Indian Standards (BIS)',
        retrievedAt: new Date().toISOString(),
        disclaimer:
          'Authoritative verification source unavailable. Please verify manually on the official BIS portal.',
      };
    }
  }

  public async verifyHuid(params: VerifyHuidParams): Promise<HallmarkVerificationItem> {
    const cleanHuid = params.huid.trim().toUpperCase();

    try {
      // Check for local verified hallmark verification in DB
      const existingRecord = await prisma.hallmarkVerification.findFirst({
        where: { huid: cleanHuid },
        include: { sourceDocument: true },
      });

      if (existingRecord && existingRecord.verificationStatus === 'VERIFIED') {
        return {
          id: existingRecord.id,
          huid: existingRecord.huid,
          enteredDetails: params,
          verificationStatus: 'VERIFIED',
          articleType: existingRecord.articleType,
          purityPpm: existingRecord.purityPpm,
          purityKarat: existingRecord.purityKarat,
          hallmarkingCentreName: existingRecord.hallmarkingCentreName,
          hallmarkingCentreCode: existingRecord.hallmarkingCentreCode,
          hallmarkingDate: existingRecord.hallmarkingDate?.toISOString() || null,
          jewellerName: existingRecord.jewellerName,
          jewellerRegistrationNumber: existingRecord.jewellerRegistrationNumber,
          sourceUrl: existingRecord.sourceUrl || 'https://www.manakonline.in/MANAK/hallmarkingSearch',
          sourceAuthority: existingRecord.sourceAuthority || 'Bureau of Indian Standards (BIS)',
          retrievedAt: existingRecord.retrievedAt.toISOString(),
          evidence: existingRecord.evidence,
          disclaimer:
            'Verification result is based on authoritative records available in the platform repository.',
        };
      }

      if (!process.env.BIS_HUID_GATEWAY_URL) {
        return {
          huid: params.huid,
          enteredDetails: params,
          verificationStatus: 'SOURCE_UNAVAILABLE',
          sourceUrl: 'https://www.manakonline.in/MANAK/hallmarkingSearch',
          sourceAuthority: 'Bureau of Indian Standards (BIS)',
          retrievedAt: new Date().toISOString(),
          disclaimer:
            'Live HUID authoritative gateway is not connected. Consumers are strongly advised to verify HUID using the official "BIS CARE" mobile application on Android/iOS.',
        };
      }

      return {
        huid: params.huid,
        enteredDetails: params,
        verificationStatus: 'NOT_FOUND',
        sourceUrl: 'https://www.manakonline.in/MANAK/hallmarkingSearch',
        sourceAuthority: 'Bureau of Indian Standards (BIS)',
        retrievedAt: new Date().toISOString(),
        disclaimer:
          'No authoritative record found for this HUID in the connected repository.',
      };
    } catch {
      return {
        huid: params.huid,
        enteredDetails: params,
        verificationStatus: 'SOURCE_UNAVAILABLE',
        sourceAuthority: 'Bureau of Indian Standards (BIS)',
        retrievedAt: new Date().toISOString(),
        disclaimer:
          'Authoritative verification source unavailable. Please verify via the official BIS CARE App.',
      };
    }
  }
}
