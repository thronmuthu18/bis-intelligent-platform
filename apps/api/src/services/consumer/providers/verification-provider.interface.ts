// ─────────────────────────────────────────────────────────────────────────────
//  IVerificationProvider — Abstraction for BIS Licence & HUID verification
// ─────────────────────────────────────────────────────────────────────────────

import type {
  LicenceVerificationItem,
  HallmarkVerificationItem,
} from '@bis/shared';

export interface VerifyLicenceParams {
  licenceNumber: string;
  manufacturer?: string;
  productName?: string;
  standardNumber?: string;
}

export interface VerifyHuidParams {
  huid: string;
  articleType?: string;
  purityKarat?: string;
  jewellerName?: string;
}

export interface IVerificationProvider {
  readonly providerName: string;

  /**
   * Verify a BIS Licence (CM/L or CRS number).
   */
  verifyLicence(params: VerifyLicenceParams): Promise<LicenceVerificationItem>;

  /**
   * Verify a Hallmarking Unique Identification (HUID) 6-digit code.
   */
  verifyHuid(params: VerifyHuidParams): Promise<HallmarkVerificationItem>;
}
