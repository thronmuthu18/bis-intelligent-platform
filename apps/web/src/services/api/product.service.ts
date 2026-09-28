import { apiClient } from './client';
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductStats,
} from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Frontend Product Service
//  Calls backend /api/v1/products endpoints via centralized apiClient.
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductListResponse {
  products: Product[];
}

export interface ProductSingleResponse {
  product: Product;
  message?: string;
}

export interface ProductStatsResponse {
  stats: ProductStats;
}

export const productService = {
  /**
   * Retrieves all products owned by the authenticated user.
   */
  async getProducts(includeArchived = false): Promise<Product[]> {
    const query = includeArchived ? '?includeArchived=true' : '';
    const res = await apiClient.get<ProductListResponse>(`/products${query}`);
    return res.products;
  },

  /**
   * Retrieves a single product by ID.
   */
  async getProduct(productId: string): Promise<Product> {
    const res = await apiClient.get<ProductSingleResponse>(`/products/${productId}`);
    return res.product;
  },

  /**
   * Creates a new product for the authenticated user.
   */
  async createProduct(input: CreateProductInput): Promise<Product> {
    const res = await apiClient.post<ProductSingleResponse>('/products', input);
    return res.product;
  },

  /**
   * Updates an existing product owned by the user.
   */
  async updateProduct(productId: string, input: UpdateProductInput): Promise<Product> {
    const res = await apiClient.patch<ProductSingleResponse>(`/products/${productId}`, input);
    return res.product;
  },

  /**
   * Archives a product owned by the user.
   */
  async archiveProduct(productId: string): Promise<Product> {
    const res = await apiClient.delete<ProductSingleResponse>(`/products/${productId}`);
    return res.product;
  },

  /**
   * Retrieves product metrics for the dashboard.
   */
  async getProductStats(): Promise<ProductStats> {
    const res = await apiClient.get<ProductStatsResponse>('/products/stats');
    return res.stats;
  },
};
