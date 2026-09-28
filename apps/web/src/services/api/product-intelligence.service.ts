import { apiClient } from './client';
import type {
  ProductStandardAnalysisResponse,
  CreateProductReviewInput,
  ProductStandardReviewItem,
  ProductAttribute,
  UpsertProductAttributeInput,
} from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Frontend Product Intelligence & Standard Matching Service (Phase 6)
// ─────────────────────────────────────────────────────────────────────────────

export const productIntelligenceService = {
  /**
   * Triggers candidate standard analysis for a product.
   */
  async analyzeProduct(
    productId: string,
    forceRefresh = false
  ): Promise<ProductStandardAnalysisResponse> {
    return apiClient.post<ProductStandardAnalysisResponse>(
      `/products/${productId}/intelligence/analyze`,
      { forceRefresh }
    );
  },

  /**
   * Retrieves the latest candidate standard analysis for a product.
   */
  async getLatestAnalysis(
    productId: string
  ): Promise<ProductStandardAnalysisResponse> {
    return apiClient.get<ProductStandardAnalysisResponse>(
      `/products/${productId}/intelligence/analysis`
    );
  },

  /**
   * Submits a user confirmation review decision for a standard.
   */
  async saveProductReview(
    productId: string,
    input: CreateProductReviewInput
  ): Promise<ProductStandardReviewItem> {
    return apiClient.post<ProductStandardReviewItem>(
      `/products/${productId}/intelligence/reviews`,
      input
    );
  },

  /**
   * Retrieves user reviews for a product.
   */
  async getProductReviews(
    productId: string
  ): Promise<ProductStandardReviewItem[]> {
    return apiClient.get<ProductStandardReviewItem[]>(
      `/products/${productId}/intelligence/reviews`
    );
  },

  /**
   * Retrieves structured attributes for a product.
   */
  async getProductAttributes(
    productId: string
  ): Promise<ProductAttribute[]> {
    return apiClient.get<ProductAttribute[]>(
      `/products/${productId}/attributes`
    );
  },

  /**
   * Upserts structured attributes for a product.
   */
  async upsertProductAttributes(
    productId: string,
    attributes: UpsertProductAttributeInput[]
  ): Promise<ProductAttribute[]> {
    return apiClient.post<ProductAttribute[]>(
      `/products/${productId}/attributes`,
      attributes
    );
  },
};
