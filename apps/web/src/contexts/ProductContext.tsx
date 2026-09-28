import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '@/services/api';
import type { Product, UpdateProductInput } from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Product Workspace Context
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductContextValue {
  product: Product | null;
  isLoading: boolean;
  error: string | null;
  refreshProduct: () => Promise<void>;
  updateProduct: (input: UpdateProductInput) => Promise<Product>;
  archiveProduct: () => Promise<void>;
}

const ProductContext = createContext<ProductContextValue | undefined>(undefined);

export function ProductProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async (): Promise<void> => {
    if (!productId) {
      setError('Product identifier is missing.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await productService.getProduct(productId);
      setProduct(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Product not found or you do not have permission to access it.');
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const update = async (input: UpdateProductInput): Promise<Product> => {
    if (!productId) throw new Error('No product ID');
    const updated = await productService.updateProduct(productId, input);
    setProduct(updated);
    return updated;
  };

  const archive = async (): Promise<void> => {
    if (!productId) throw new Error('No product ID');
    await productService.archiveProduct(productId);
    navigate('/products', { replace: true });
  };

  const value: ProductContextValue = {
    product,
    isLoading,
    error,
    refreshProduct: fetchProduct,
    updateProduct: update,
    archiveProduct: archive,
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export function useProduct(): ProductContextValue {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
}
