import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// ── Layouts ───────────────────────────────────────────────────────────────────
import { RootLayout } from '@/layouts/RootLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { ProductLayout } from '@/layouts/ProductLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';

// ── Pages ─────────────────────────────────────────────────────────────────────
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { CreateProductPage } from '@/pages/CreateProductPage';
import { ProductOverviewPage } from '@/pages/product/ProductOverviewPage';
import { ProductAssistantPage } from '@/pages/product/ProductAssistantPage';
import { ProductDocumentsPage } from '@/pages/product/ProductDocumentsPage';
import { ProductStandardsPage } from '@/pages/product/ProductStandardsPage';
import { ProductCertificationPage } from '@/pages/product/ProductCertificationPage';
import { ProductTestingPage } from '@/pages/product/ProductTestingPage';
import { ProductLaboratoriesPage } from '@/pages/product/ProductLaboratoriesPage';
import { ProductCompliancePage } from '@/pages/product/ProductCompliancePage';
import { ConsumerDashboardPage } from '@/pages/consumer/ConsumerDashboardPage';
import { LicenceVerificationPage } from '@/pages/consumer/LicenceVerificationPage';
import { HuidVerificationPage } from '@/pages/consumer/HuidVerificationPage';
import { HallmarkingEducationPage } from '@/pages/consumer/HallmarkingEducationPage';
import { HallmarkingCentresPage } from '@/pages/consumer/HallmarkingCentresPage';
import { ConsumerStandardsPage } from '@/pages/consumer/ConsumerStandardsPage';
import { ConsumerServicesPage } from '@/pages/consumer/ConsumerServicesPage';
import { ConsumerVerificationsPage } from '@/pages/consumer/ConsumerVerificationsPage';
import { ActivityPage } from '@/pages/ActivityPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

// ── Admin Pages ────────────────────────────────────────────────────────────────
import {
  AdminDashboardPage,
  AdminSourcesPage,
  AdminStandardsPage,
  AdminQcosPage,
  AdminSchemesPage,
  AdminKnowledgePage,
  AdminEmbeddingsPage,
  AdminIngestionPage,
  AdminLaboratoriesPage,
  AdminHallmarkingPage,
  AdminConsumerServicesPage,
  AdminRegulatoryPage,
  AdminDataQualityPage,
  AdminAuditPage,
  AdminTranslationsPage,
} from '@/pages/admin';
import { Navigate } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────────────────────
//  Application Router — Phase 2 Guarded Routes
// ─────────────────────────────────────────────────────────────────────────────

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // ── Public routes ──
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },

      // ── Protected application routes ──
      {
        element: (
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        ),
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/products', element: <ProductsPage /> },
          { path: '/products/new', element: <CreateProductPage /> },
          { path: '/consumer', element: <ConsumerDashboardPage /> },
          { path: '/consumer/licence', element: <LicenceVerificationPage /> },
          { path: '/consumer/huid', element: <HuidVerificationPage /> },
          { path: '/consumer/hallmarking', element: <HallmarkingEducationPage /> },
          { path: '/consumer/hallmarking-centres', element: <HallmarkingCentresPage /> },
          { path: '/consumer/standards', element: <ConsumerStandardsPage /> },
          { path: '/consumer/services', element: <ConsumerServicesPage /> },
          { path: '/consumer/verifications', element: <ConsumerVerificationsPage /> },
          { path: '/hallmarking', element: <HallmarkingEducationPage /> },
          { path: '/activity', element: <ActivityPage /> },
          { path: '/settings', element: <SettingsPage /> },

          // Product workspace — nested routes
          {
            path: '/products/:productId',
            element: <ProductLayout />,
            children: [
              { index: true, element: <ProductOverviewPage /> },
              { path: 'assistant', element: <ProductAssistantPage /> },
              { path: 'documents', element: <ProductDocumentsPage /> },
              { path: 'standards', element: <ProductStandardsPage /> },
              { path: 'certification', element: <ProductCertificationPage /> },
              { path: 'testing', element: <ProductTestingPage /> },
              { path: 'laboratories', element: <ProductLaboratoriesPage /> },
              { path: 'compliance', element: <ProductCompliancePage /> },
            ],
          },
        ],
      },

      // ── Admin Workspace — Phase 13 Guarded Routes ──
      {
        path: '/admin',
        element: (
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        ),
        children: [
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          { path: 'dashboard', element: <AdminDashboardPage /> },
          { path: 'sources', element: <AdminSourcesPage /> },
          { path: 'standards', element: <AdminStandardsPage /> },
          { path: 'standards/:id', element: <AdminStandardsPage /> },
          { path: 'qcos', element: <AdminQcosPage /> },
          { path: 'schemes', element: <AdminSchemesPage /> },
          { path: 'product-manuals', element: <AdminSchemesPage /> },
          { path: 'knowledge', element: <AdminKnowledgePage /> },
          { path: 'embeddings', element: <AdminEmbeddingsPage /> },
          { path: 'ingestion', element: <AdminIngestionPage /> },
          { path: 'laboratories', element: <AdminLaboratoriesPage /> },
          { path: 'hallmarking-centres', element: <AdminHallmarkingPage /> },
          { path: 'consumer-services', element: <AdminConsumerServicesPage /> },
          { path: 'regulatory-changes', element: <AdminRegulatoryPage /> },
          { path: 'translations', element: <AdminTranslationsPage /> },
          { path: 'data-quality', element: <AdminDataQualityPage /> },
          { path: 'audit', element: <AdminAuditPage /> },
          { path: 'settings', element: <AdminTranslationsPage /> },
        ],
      },

      // ── 404 Catch-All ──
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function AppRouter(): React.ReactElement {
  return <RouterProvider router={router} />;
}
