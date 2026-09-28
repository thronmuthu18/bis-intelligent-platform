// ─────────────────────────────────────────────────────────────────────────────
//  Consumer API Service — Phase 11 Client
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from './client';
import type {
  ConsumerServicesResponse,
  ConsumerServiceItem,
  ConsumerStandardsQuery,
  ConsumerStandardsResponse,
  VerifyLicenceRequest,
  VerifyLicenceResponse,
  VerifyHuidRequest,
  VerifyHuidResponse,
  HallmarkingCentresQuery,
  HallmarkingCentresResponse,
  HallmarkingCentreItem,
  ConsumerVerificationsResponse,
  ConsumerGuidanceResponse,
  ConsumerServiceType,
} from '@bis/shared';

export interface HallmarkingEducationResponse {
  concepts: Array<{
    id: string;
    topic: string;
    title: string;
    summary: string;
    details: string[];
    applicableStandard?: string;
    officialSource: string;
    sourceUrl: string;
    authority: string;
    isVerified: boolean;
  }>;
  mandatorySigns: Array<{
    signNumber: number;
    name: string;
    description: string;
    visualGuidance: string;
    officialReference: string;
  }>;
}

export const consumerService = {
  /**
   * Get catalog of official citizen services.
   */
  async getServices(): Promise<ConsumerServicesResponse> {
    return apiClient.get<ConsumerServicesResponse>('/consumer/services');
  },

  /**
   * Get specific citizen service by ID.
   */
  async getServiceById(serviceId: string): Promise<{ service: ConsumerServiceItem }> {
    return apiClient.get<{ service: ConsumerServiceItem }>(`/consumer/services/${serviceId}`);
  },

  /**
   * Plain-language Indian Standards search.
   */
  async searchStandards(query: ConsumerStandardsQuery): Promise<ConsumerStandardsResponse> {
    const params = new URLSearchParams();
    if (query.q) params.set('q', query.q);
    if (query.limit) params.set('limit', String(query.limit));

    const qs = params.toString();
    return apiClient.get<ConsumerStandardsResponse>(`/consumer/standards/search${qs ? `?${qs}` : ''}`);
  },

  /**
   * Verify BIS CM/L or CRS licence number.
   */
  async verifyLicence(data: VerifyLicenceRequest): Promise<VerifyLicenceResponse> {
    return apiClient.post<VerifyLicenceResponse>('/consumer/licence/verify', data);
  },

  /**
   * Discover and search Assaying & Hallmarking Centres (AHC).
   */
  async getHallmarkingCentres(query: HallmarkingCentresQuery = {}): Promise<HallmarkingCentresResponse> {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.state && query.state !== 'ALL') params.set('state', query.state);
    if (query.city) params.set('city', query.city);
    if (query.pincode) params.set('pincode', query.pincode);
    if (query.status) params.set('status', query.status);
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));

    const qs = params.toString();
    return apiClient.get<HallmarkingCentresResponse>(`/consumer/hallmarking-centres${qs ? `?${qs}` : ''}`);
  },

  /**
   * Get single Assaying & Hallmarking Centre details.
   */
  async getHallmarkingCentreById(id: string): Promise<{ centre: HallmarkingCentreItem }> {
    return apiClient.get<{ centre: HallmarkingCentreItem }>(`/consumer/hallmarking-centres/${id}`);
  },

  /**
   * Get Hallmarking Educational concepts and 3 mandatory hallmark signs.
   */
  async getHallmarkingEducation(): Promise<HallmarkingEducationResponse> {
    return apiClient.get<HallmarkingEducationResponse>('/consumer/hallmarking/education');
  },

  /**
   * Verify 6-digit Hallmark Unique Identification (HUID) code.
   */
  async verifyHuid(data: VerifyHuidRequest): Promise<VerifyHuidResponse> {
    return apiClient.post<VerifyHuidResponse>('/consumer/huid/verify', data);
  },

  /**
   * Get authenticated user's saved verification history.
   */
  async getVerifications(): Promise<ConsumerVerificationsResponse> {
    return apiClient.get<ConsumerVerificationsResponse>('/consumer/verifications');
  },

  /**
   * Delete a saved verification history item.
   */
  async deleteVerification(id: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/consumer/verifications/${id}`);
  },

  /**
   * Get official step-by-step guidance for citizen services/complaints.
   */
  async getGuidance(serviceType: ConsumerServiceType | string): Promise<ConsumerGuidanceResponse> {
    return apiClient.get<ConsumerGuidanceResponse>(`/consumer/guidance/${serviceType}`);
  },
};
