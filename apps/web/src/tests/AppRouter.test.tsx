import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { ProductLayout } from '@/layouts/ProductLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { CreateProductPage } from '@/pages/CreateProductPage';
import { ConsumerServicesPage } from '@/pages/ConsumerServicesPage';
import { HallmarkingPage } from '@/pages/HallmarkingPage';
import { ActivityPage } from '@/pages/ActivityPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProductOverviewPage } from '@/pages/product/ProductOverviewPage';
import { ProductAssistantPage } from '@/pages/product/ProductAssistantPage';
import { ProductDocumentsPage } from '@/pages/product/ProductDocumentsPage';
import { ProductStandardsPage } from '@/pages/product/ProductStandardsPage';
import { ProductCertificationPage } from '@/pages/product/ProductCertificationPage';
import { ProductTestingPage } from '@/pages/product/ProductTestingPage';
import { ProductLaboratoriesPage } from '@/pages/product/ProductLaboratoriesPage';
import { ProductCompliancePage } from '@/pages/product/ProductCompliancePage';

const { hoistedProduct } = vi.hoisted(() => ({
  hoistedProduct: {
    id: 'demo-prod-1',
    userId: 'user-1',
    name: 'Smart Energy Meter',
    category: 'Electronics & IT Goods',
    description: 'Single-phase smart meter',
    manufacturerType: 'Domestic Manufacturer',
    status: 'ACTIVE' as const,
    createdAt: '2026-09-24T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z',
  },
}));

// Mock the API services
vi.mock('@/services/api', () => ({
  checkApiHealth: vi.fn().mockRejectedValue(new Error('Not connected in tests')),
  productService: {
    getProducts: vi.fn().mockResolvedValue([]),
    getProduct: vi.fn().mockResolvedValue(hoistedProduct),
    getProductStats: vi.fn().mockResolvedValue({
      total: 0,
      active: 0,
      draft: 0,
      informationCollection: 0,
      readyForAnalysis: 0,
      archived: 0,
    }),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    archiveProduct: vi.fn(),
  },
  authService: {
    getMe: vi.fn().mockRejectedValue(new Error('Unauthenticated')),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

describe('Phase 3 Routes and Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Dashboard page', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText('Compliance Dashboard')).toBeDefined();
    expect(screen.getByText('Total Products')).toBeDefined();
  });

  it('renders Products page', async () => {
    render(
      <MemoryRouter initialEntries={['/products']}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route element={<AppLayout />}>
              <Route path="/products" element={<ProductsPage />} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    const elements = await screen.findAllByText('My Products');
    expect(elements.length).toBeGreaterThan(0);
    expect(screen.getAllByText('Add Product').length).toBeGreaterThan(0);
  });

  it('renders Create Product page', () => {
    render(
      <MemoryRouter initialEntries={['/products/new']}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route element={<AppLayout />}>
              <Route path="/products/new" element={<CreateProductPage />} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Create a Product')).toBeDefined();
    expect(screen.getByText('Product Info')).toBeDefined();
  });

  it('renders Product Workspace tabs', async () => {
    render(
      <MemoryRouter initialEntries={['/products/demo-prod-1']}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route element={<AppLayout />}>
              <Route path="/products/:productId" element={<ProductLayout />}>
                <Route index element={<ProductOverviewPage />} />
                <Route path="assistant" element={<ProductAssistantPage />} />
                <Route path="documents" element={<ProductDocumentsPage />} />
                <Route path="standards" element={<ProductStandardsPage />} />
                <Route path="certification" element={<ProductCertificationPage />} />
                <Route path="testing" element={<ProductTestingPage />} />
                <Route path="laboratories" element={<ProductLaboratoriesPage />} />
                <Route path="compliance" element={<ProductCompliancePage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    const elements = await screen.findAllByText('Smart Energy Meter');
    expect(elements.length).toBeGreaterThan(0);
    expect(screen.getAllByText('Domestic Manufacturer').length).toBeGreaterThan(0);
  });

  it('renders Consumer Services page', () => {
    render(
      <MemoryRouter initialEntries={['/consumer']}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route element={<AppLayout />}>
              <Route path="/consumer" element={<ConsumerServicesPage />} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Consumer Services & BIS Verification')).toBeDefined();
  });

  it('renders Hallmarking page', () => {
    render(
      <MemoryRouter initialEntries={['/hallmarking']}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route element={<AppLayout />}>
              <Route path="/hallmarking" element={<HallmarkingPage />} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Gold & Silver Hallmarking (HUID) Services')).toBeDefined();
  });

  it('renders Activity page', () => {
    render(
      <MemoryRouter initialEntries={['/activity']}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route element={<AppLayout />}>
              <Route path="/activity" element={<ActivityPage />} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Activity & Audit Log')).toBeDefined();
  });

  it('renders Settings page', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route element={<AppLayout />}>
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Settings & Preferences')).toBeDefined();
  });

  it('renders 404 page for unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/some-unknown-route']}>
        <Routes>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Page Not Found')).toBeDefined();
  });
});
