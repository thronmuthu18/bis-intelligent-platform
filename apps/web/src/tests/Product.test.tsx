import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProductsPage } from '@/pages/ProductsPage';
import { CreateProductPage } from '@/pages/CreateProductPage';
import { ProductOverviewPage } from '@/pages/product/ProductOverviewPage';
import { ProductLayout } from '@/layouts/ProductLayout';
import { productService } from '@/services/api/product.service';
import type { Product } from '@bis/shared';

// Mock productService
vi.mock('@/services/api/product.service', () => ({
  productService: {
    getProducts: vi.fn(),
    getProduct: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    archiveProduct: vi.fn(),
    getProductStats: vi.fn(),
  },
}));

// Mock useToast
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

const mockProduct: Product = {
  id: 'prod-uuid-1234',
  userId: 'user-uuid-1111',
  name: 'Industrial Water Pump Model X',
  category: 'Industrial Equipment',
  description: 'High efficiency centrifugal pump for industrial water distribution.',
  manufacturerType: 'Domestic Manufacturer',
  intendedUse: 'Municipal water distribution',
  targetMarket: 'India',
  countryOfManufacture: 'India',
  status: 'DRAFT',
  isActive: true,
  createdAt: '2026-09-24T10:00:00.000Z',
  updatedAt: '2026-09-24T10:00:00.000Z',
};

describe('Phase 3 — Frontend Product Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ProductsPage empty state when user has no products', async () => {
    vi.mocked(productService.getProducts).mockResolvedValueOnce([]);

    render(
      <MemoryRouter initialEntries={['/products']}>
        <ProductsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('No products yet')).toBeDefined();
    expect(screen.getByText(/Create your first product to begin your guided compliance journey/i)).toBeDefined();
    expect(screen.getAllByRole('button', { name: /Add Product/i }).length).toBeGreaterThan(0);
  });

  it('renders ProductsPage with real products when available', async () => {
    vi.mocked(productService.getProducts).mockResolvedValueOnce([mockProduct]);

    render(
      <MemoryRouter initialEntries={['/products']}>
        <ProductsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Industrial Water Pump Model X')).toBeDefined();
    expect(screen.getAllByText('Industrial Equipment').length).toBeGreaterThan(0);
    expect(screen.getByText('Draft')).toBeDefined();
    expect(screen.getByRole('button', { name: /Open Workspace/i })).toBeDefined();
  });

  it('renders CreateProductPage and validates required fields', async () => {
    render(
      <MemoryRouter initialEntries={['/products/new']}>
        <CreateProductPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Create a Product')).toBeDefined();
    expect(screen.getByLabelText(/Product Name \*/i)).toBeDefined();
    expect(screen.getByLabelText(/Product Category \*/i)).toBeDefined();

    const submitBtn = screen.getByRole('button', { name: /Create & Open Workspace/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Product name is required/i)).toBeDefined();
  });

  it('submits CreateProductPage form with valid inputs and calls API', async () => {
    vi.mocked(productService.createProduct).mockResolvedValueOnce(mockProduct);

    render(
      <MemoryRouter initialEntries={['/products/new']}>
        <CreateProductPage />
      </MemoryRouter>,
    );

    const nameInput = screen.getByLabelText(/Product Name \*/i);
    const categorySelect = screen.getByLabelText(/Product Category \*/i);

    fireEvent.change(nameInput, { target: { value: 'Industrial Water Pump Model X' } });
    fireEvent.change(categorySelect, { target: { value: 'Industrial Machinery & Equipment' } });

    const submitBtn = screen.getByRole('button', { name: /Create & Open Workspace/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(productService.createProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Industrial Water Pump Model X',
          category: 'Industrial Machinery & Equipment',
        }),
      );
    });
  });

  it('renders ProductOverviewPage inside ProductLayout with specifications', async () => {
    vi.mocked(productService.getProduct).mockResolvedValue(mockProduct);

    render(
      <MemoryRouter initialEntries={['/products/prod-uuid-1234']}>
        <Routes>
          <Route path="/products/:productId" element={<ProductLayout />}>
            <Route index element={<ProductOverviewPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Domestic Manufacturer')).toBeDefined();
    expect(screen.getByText('High efficiency centrifugal pump for industrial water distribution.')).toBeDefined();
    expect(screen.getByRole('button', { name: /Edit Product/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Archive Product/i })).toBeDefined();
  });
});
