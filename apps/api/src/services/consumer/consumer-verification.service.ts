// ─────────────────────────────────────────────────────────────────────────────
//  ConsumerVerificationService — Verification workflows & saved history
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '../../db/client.js';
import { AppError } from '../../utils/AppError.js';
import {
  API_ERROR_CODES,
  type VerifyLicenceRequest,
  type VerifyLicenceResponse,
  type VerifyHuidRequest,
  type VerifyHuidResponse,
  type ConsumerVerificationHistoryItem,
  type ConsumerVerificationsResponse,
} from '@bis/shared';
import { VerificationProviderFactory } from './providers/provider.factory.js';

export class ConsumerVerificationService {
  /**
   * Verify a BIS CM/L or CRS licence number.
   */
  public static async verifyLicence(
    req: VerifyLicenceRequest,
    userId?: string
  ): Promise<VerifyLicenceResponse> {
    if (!req.licenceNumber || req.licenceNumber.trim() === '') {
      throw new AppError('Licence number is required', 400, API_ERROR_CODES.BAD_REQUEST);
    }

    const provider = VerificationProviderFactory.getProvider();
    const verification = await provider.verifyLicence({
      licenceNumber: req.licenceNumber.trim(),
      manufacturer: req.manufacturer?.trim(),
      productName: req.productName?.trim(),
      standardNumber: req.standardNumber?.trim(),
    });

    let savedVerificationId: string | undefined;

    // If user is authenticated and saveHistory is requested (or default true when logged in)
    if (userId && req.saveHistory !== false) {
      const saved = await prisma.consumerVerification.create({
        data: {
          userId,
          verificationType: 'LICENCE',
          query: {
            licenceNumber: req.licenceNumber.trim(),
            manufacturer: req.manufacturer,
            productName: req.productName,
            standardNumber: req.standardNumber,
          },
          resultStatus: verification.status,
          source: verification.source,
          evidence: verification.evidence || {},
        },
      });
      savedVerificationId = saved.id;
    }

    return {
      verification,
      savedVerificationId,
    };
  }

  /**
   * Verify a Hallmark Unique Identification (HUID) code.
   */
  public static async verifyHuid(
    req: VerifyHuidRequest,
    userId?: string
  ): Promise<VerifyHuidResponse> {
    if (!req.huid || req.huid.trim() === '') {
      throw new AppError('HUID is required', 400, API_ERROR_CODES.BAD_REQUEST);
    }

    const cleanHuid = req.huid.trim().toUpperCase();
    const provider = VerificationProviderFactory.getProvider();
    const verification = await provider.verifyHuid({
      huid: cleanHuid,
      articleType: req.articleType?.trim(),
      purityKarat: req.purityKarat?.trim(),
      jewellerName: req.jewellerName?.trim(),
    });

    let savedVerificationId: string | undefined;

    if (userId && req.saveHistory !== false) {
      const saved = await prisma.consumerVerification.create({
        data: {
          userId,
          verificationType: 'HUID',
          query: {
            huid: cleanHuid,
            articleType: req.articleType,
            purityKarat: req.purityKarat,
            jewellerName: req.jewellerName,
          },
          resultStatus: verification.verificationStatus,
          source: verification.sourceAuthority || 'Bureau of Indian Standards',
          evidence: verification.evidence || {},
        },
      });
      savedVerificationId = saved.id;
    }

    return {
      verification,
      savedVerificationId,
    };
  }

  /**
   * Get saved verification history for an authenticated user.
   */
  public static async getUserVerifications(userId: string): Promise<ConsumerVerificationsResponse> {
    const records = await prisma.consumerVerification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const verifications: ConsumerVerificationHistoryItem[] = records.map((r) => ({
      id: r.id,
      userId: r.userId,
      verificationType: r.verificationType as any,
      query: r.query,
      resultStatus: r.resultStatus as any,
      summary:
        r.verificationType === 'LICENCE'
          ? `Licence: ${(r.query as any)?.licenceNumber || 'Unknown'}`
          : `HUID: ${(r.query as any)?.huid || 'Unknown'}`,
      source: r.source,
      evidence: r.evidence,
      createdAt: r.createdAt.toISOString(),
    }));

    return {
      verifications,
      total: verifications.length,
    };
  }

  /**
   * Delete a saved verification record with IDOR protection.
   */
  public static async deleteUserVerification(id: string, userId: string): Promise<{ success: boolean }> {
    const record = await prisma.consumerVerification.findUnique({
      where: { id },
    });

    if (!record) {
      throw new AppError('Verification record not found', 404, API_ERROR_CODES.NOT_FOUND);
    }

    if (record.userId !== userId) {
      throw new AppError('Unauthorized access to verification record', 403, API_ERROR_CODES.FORBIDDEN);
    }

    await prisma.consumerVerification.delete({
      where: { id },
    });

    return { success: true };
  }
}
