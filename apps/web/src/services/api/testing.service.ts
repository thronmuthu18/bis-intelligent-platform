import { apiClient } from './client.js';
import type {
  ProductTestingAnalysisResponse,
  ProductTestRequirementItem,
  LaboratoryMatchResult,
  ProductLaboratoryReviewItem,
  AnalyzeTestingInput,
  CreateProductLaboratoryReviewInput,
  LaboratoryFilterParams,
  ApiResponse,
} from '@bis/shared';

export const testingService = {
  /**
   * Run or retrieve cached testing intelligence analysis.
   */
  async analyzeTesting(
    productId: string,
    input: AnalyzeTestingInput = {}
  ): Promise<ProductTestingAnalysisResponse> {
    const res = await apiClient.post<ApiResponse<ProductTestingAnalysisResponse>>(
      `/products/${productId}/testing/analyze`,
      input
    );
    return res.data;
  },

  /**
   * Get latest completed testing analysis.
   */
  async getTestingAnalysis(productId: string): Promise<ProductTestingAnalysisResponse | null> {
    const res = await apiClient.get<ApiResponse<ProductTestingAnalysisResponse | null>>(
      `/products/${productId}/testing`
    );
    return res.data;
  },

  /**
   * Get test requirements for product with optional filters.
   */
  async getTestRequirements(
    productId: string,
    filters?: {
      standardId?: string;
      schemeId?: string;
      category?: string;
      status?: string;
    }
  ): Promise<ProductTestRequirementItem[]> {
    const params = new URLSearchParams();
    if (filters?.standardId) params.append('standardId', filters.standardId);
    if (filters?.schemeId) params.append('schemeId', filters.schemeId);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<ApiResponse<ProductTestRequirementItem[]>>(
      `/products/${productId}/testing/requirements${query}`
    );
    return res.data;
  },

  /**
   * Get candidate laboratories with capability match scoring and filters.
   */
  async getLaboratories(
    productId: string,
    filters?: LaboratoryFilterParams
  ): Promise<LaboratoryMatchResult[]> {
    const params = new URLSearchParams();
    if (filters?.state) params.append('state', filters.state);
    if (filters?.city) params.append('city', filters.city);
    if (filters?.standardId) params.append('standardId', filters.standardId);
    if (filters?.testName) params.append('testName', filters.testName);
    if (filters?.recognitionStatus) params.append('recognitionStatus', filters.recognitionStatus);
    if (filters?.accreditationStatus) params.append('accreditationStatus', filters.accreditationStatus);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<ApiResponse<LaboratoryMatchResult[]>>(
      `/products/${productId}/testing/laboratories${query}`
    );
    return res.data;
  },

  /**
   * Submit a user review/decision on a candidate laboratory.
   */
  async createLaboratoryReview(
    productId: string,
    input: CreateProductLaboratoryReviewInput
  ): Promise<ProductLaboratoryReviewItem> {
    const res = await apiClient.post<ApiResponse<ProductLaboratoryReviewItem>>(
      `/products/${productId}/testing/laboratories/reviews`,
      input
    );
    return res.data;
  },

  /**
   * Get user laboratory review history for a product.
   */
  async getLaboratoryReviews(productId: string): Promise<ProductLaboratoryReviewItem[]> {
    const res = await apiClient.get<ApiResponse<ProductLaboratoryReviewItem[]>>(
      `/products/${productId}/testing/laboratories/reviews`
    );
    return res.data;
  },
};
