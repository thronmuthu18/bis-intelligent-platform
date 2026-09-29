import { apiClient } from './client';
import type {
  UserActivityFeedResponse,
  UserActivityQueryInput,
} from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Frontend Activity Service
//  Calls backend /api/v1/activity and /api/v1/products/:id/activity endpoints.
// ─────────────────────────────────────────────────────────────────────────────

export const activityService = {
  /**
   * Retrieves the global activity feed for the authenticated user.
   */
  async getUserActivity(query: UserActivityQueryInput = {}): Promise<UserActivityFeedResponse> {
    const params = new URLSearchParams();
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.category && query.category !== 'ALL') params.append('category', query.category);
    if (query.productId) params.append('productId', query.productId);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<UserActivityFeedResponse>(`/activity${queryString}`);
    return res;
  },

  /**
   * Retrieves the product-scoped activity feed.
   */
  async getProductActivity(
    productId: string,
    query: Omit<UserActivityQueryInput, 'productId'> = {}
  ): Promise<UserActivityFeedResponse> {
    const params = new URLSearchParams();
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.category && query.category !== 'ALL') params.append('category', query.category);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<UserActivityFeedResponse>(`/products/${productId}/activity${queryString}`);
    return res;
  },
};
