import { apiClient } from './client';
import type {
  ProductCertificationAnalysisResponse,
  SchemeDetailResponse,
  CreateProductSchemeReviewInput,
  ProductSchemeReviewItem,
} from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Phase 7 — Frontend Certification Intelligence Service
// ─────────────────────────────────────────────────────────────────────────────

export const certificationService = {
  /**
   * Triggers or retrieves cached certification intelligence analysis for a product.
   */
  async analyzeProduct(
    productId: string,
    forceRefresh: boolean = false
  ): Promise<ProductCertificationAnalysisResponse> {
    return apiClient.post<ProductCertificationAnalysisResponse>(
      `/products/${productId}/certification/analyze`,
      { forceRefresh }
    );
  },

  /**
   * Retrieves latest completed certification intelligence analysis for a product.
   */
  async getLatestAnalysis(
    productId: string
  ): Promise<ProductCertificationAnalysisResponse | null> {
    return apiClient.get<ProductCertificationAnalysisResponse | null>(
      `/products/${productId}/certification`
    );
  },

  /**
   * Retrieves detailed breakdown of a specific scheme.
   */
  async getSchemeDetail(
    productId: string,
    schemeId: string
  ): Promise<SchemeDetailResponse> {
    return apiClient.get<SchemeDetailResponse>(
      `/products/${productId}/certification/schemes/${schemeId}`
    );
  },

  /**
   * Saves or updates a user scheme review decision (CONFIRMED, REJECTED, NEEDS_REVIEW).
   */
  async saveSchemeReview(
    productId: string,
    input: CreateProductSchemeReviewInput
  ): Promise<ProductSchemeReviewItem> {
    return apiClient.post<ProductSchemeReviewItem>(
      `/products/${productId}/certification/reviews`,
      input
    );
  },

  /**
   * Retrieves all scheme review decisions for a product.
   */
  async getSchemeReviews(
    productId: string
  ): Promise<ProductSchemeReviewItem[]> {
    return apiClient.get<ProductSchemeReviewItem[]>(
      `/products/${productId}/certification/reviews`
    );
  },
};
