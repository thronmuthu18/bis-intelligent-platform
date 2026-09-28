// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Workspace & Knowledge Governance Tests
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminRoute } from '@/components/auth/AdminRoute';
import {
  AdminDashboardPage,
  AdminSourcesPage,
  AdminStandardsPage,
  AdminQcosPage,
  AdminEmbeddingsPage,
  AdminDataQualityPage,
  AdminAuditPage,
  AdminTranslationsPage,
} from '@/pages/admin';
import { AuthContext } from '@/contexts/AuthContext';
import { adminService } from '@/services/api';
import type { UserPublicProfile } from '@bis/shared';

// Mock adminService
vi.mock('@/services/api', () => ({
  adminService: {
    getDashboardMetrics: vi.fn(),
    getSources: vi.fn(),
    createSource: vi.fn(),
    verifySource: vi.fn(),
    getStandards: vi.fn(),
    createStandard: vi.fn(),
    publishStandard: vi.fn(),
    archiveStandard: vi.fn(),
    getQcos: vi.fn(),
    createQco: vi.fn(),
    getSchemes: vi.fn(),
    createScheme: vi.fn(),
    getKnowledgeChunks: vi.fn(),
    reindexKnowledgeChunk: vi.fn(),
    getEmbeddingStatus: vi.fn(),
    triggerReindex: vi.fn(),
    getIngestionRuns: vi.fn(),
    triggerIngestionRun: vi.fn(),
    getLaboratories: vi.fn(),
    createLaboratory: vi.fn(),
    getHallmarkingCentres: vi.fn(),
    createHallmarkingCentre: vi.fn(),
    getConsumerServices: vi.fn(),
    createConsumerService: vi.fn(),
    getRegulatoryChanges: vi.fn(),
    createRegulatoryChange: vi.fn(),
    getDataQualityReport: vi.fn(),
    getAuditLogs: vi.fn(),
  },
}));

const mockAdminUser: UserPublicProfile = {
  id: 'admin-1',
  email: 'admin@bis.gov.in',
  name: 'BIS Lead Administrator',
  role: 'ADMIN',
  organizationName: 'Bureau of Indian Standards',
};

const mockNormalUser: UserPublicProfile = {
  id: 'user-1',
  email: 'manufacturer@example.com',
  name: 'Industry Manufacturer',
  role: 'USER',
  organizationName: 'Solar Tech Corp',
};

function renderWithAuth(
  ui: React.ReactElement,
  { user = mockAdminUser, isAuthenticated = true, isLoading = false, initialEntries = ['/admin/dashboard'] } = {}
) {
  const authValue: any = {
    user,
    isAuthenticated,
    isLoading,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('Phase 13 — Admin Workspace & RBAC Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminService.getSources).mockResolvedValue({ sources: [], total: 0, page: 1, limit: 20 });
    vi.mocked(adminService.getStandards).mockResolvedValue({ standards: [], total: 0, page: 1, limit: 20 });
    vi.mocked(adminService.getQcos).mockResolvedValue({ qcos: [], total: 0, page: 1, limit: 20 });
    vi.mocked(adminService.getSchemes).mockResolvedValue({ schemes: [], total: 0, page: 1, limit: 20 });
    vi.mocked(adminService.getKnowledgeChunks).mockResolvedValue({ chunks: [], total: 0, page: 1, limit: 20 });
    vi.mocked(adminService.getEmbeddingStatus).mockResolvedValue({
      totalChunks: 0,
      embeddedChunks: 0,
      pendingChunks: 0,
      failedChunks: 0,
      provider: 'OPENAI_PGVECTOR',
      model: 'text-embedding-3-small',
      dimension: 1536,
      lastIndexRun: null,
    });
    vi.mocked(adminService.getIngestionRuns).mockResolvedValue({ runs: [], total: 0, page: 1, limit: 20 });
    vi.mocked(adminService.getLaboratories).mockResolvedValue({ laboratories: [], total: 0, page: 1, limit: 20 });
    vi.mocked(adminService.getHallmarkingCentres).mockResolvedValue({ centres: [], total: 0, page: 1, limit: 20 });
    vi.mocked(adminService.getConsumerServices).mockResolvedValue({ services: [], total: 0, page: 1, limit: 20 });
    vi.mocked(adminService.getRegulatoryChanges).mockResolvedValue({ changes: [], total: 0, page: 1, limit: 20 });
    vi.mocked(adminService.getDataQualityReport).mockResolvedValue({
      scannedAt: '2026-09-25T00:00:00.000Z',
      totalIssues: 0,
      criticalCount: 0,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      issues: [],
    });
    vi.mocked(adminService.getAuditLogs).mockResolvedValue({ logs: [], total: 0, page: 1, limit: 20 });
  });

  it('blocks normal USER from accessing admin routes with 403 Forbidden', () => {
    renderWithAuth(
      <Routes>
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <div>Secret Admin Content</div>
            </AdminRoute>
          }
        />
      </Routes>,
      { user: mockNormalUser, initialEntries: ['/admin/dashboard'] }
    );

    expect(screen.getByText(/403 — Forbidden/i)).toBeInTheDocument();
    expect(screen.getByText(/restricted to authorized Bureau of Indian Standards personnel/i)).toBeInTheDocument();
    expect(screen.queryByText('Secret Admin Content')).not.toBeInTheDocument();
  });

  it('allows authorized ADMIN user into the admin workspace', () => {
    renderWithAuth(
      <Routes>
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <div>Secret Admin Content</div>
            </AdminRoute>
          }
        />
      </Routes>,
      { user: mockAdminUser, initialEntries: ['/admin/dashboard'] }
    );

    expect(screen.getByText('Secret Admin Content')).toBeInTheDocument();
    expect(screen.queryByText(/403 — Forbidden/i)).not.toBeInTheDocument();
  });
});

describe('Phase 13 — Admin Dashboard Page', () => {
  it('renders operational knowledge and search metrics accurately', async () => {
    vi.mocked(adminService.getDashboardMetrics).mockResolvedValueOnce({
      knowledge: {
        totalStandards: 45,
        activeStandards: 42,
        standardVersions: 50,
        amendments: 18,
        qcos: 12,
        schemes: 5,
        productManuals: 20,
        knowledgeChunks: 850,
      },
      search: {
        totalIndexedChunks: 850,
        embeddedChunks: 840,
        pendingEmbeddings: 10,
        failedEmbeddings: 0,
        lexicalOnlyRecords: 0,
      },
      sources: {
        totalSources: 30,
        verifiedSources: 28,
        staleSources: 2,
        failedIngestion: 0,
        pendingVerification: 2,
      },
      consumer: {
        consumerServices: 8,
        hallmarkingCentres: 120,
        laboratories: 65,
      },
      dataQuality: {
        totalIssues: 12,
        criticalIssues: 0,
        missingSourceCount: 0,
        staleRecordCount: 2,
        duplicateRecordCount: 0,
        orphanChunkCount: 0,
        missingEmbeddingCount: 10,
      },
      compliance: {
        regulatoryChangeEvents: 6,
        unresolvedImpacts: 1,
        activeAlerts: 3,
      },
    });

    renderWithAuth(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Authoritative Knowledge Ecosystem/i)).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('850')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
    });
  });
});

describe('Phase 13 — Admin Sources Page', () => {
  it('renders source documents list and verification badges', async () => {
    vi.mocked(adminService.getSources).mockResolvedValueOnce({
      sources: [
        {
          id: 'src-1',
          title: 'BIS Gazette Notification S.O. 1234(E)',
          url: 'https://www.egazette.gov.in/1234',
          authorityLevel: 'AUTHORITATIVE',
          sourceType: 'GAZETTE' as any,
          status: 'ACTIVE',
          isFresh: true,
          retrievedAt: '2026-09-01T00:00:00.000Z',
          standardsCount: 5,
          chunksCount: 12,
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2026-09-01T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });

    renderWithAuth(<AdminSourcesPage />);

    await waitFor(() => {
      expect(screen.getByText('BIS Gazette Notification S.O. 1234(E)')).toBeInTheDocument();
      expect(screen.getByText('GAZETTE')).toBeInTheDocument();
    });
  });
});

describe('Phase 13 — Admin Standards Page', () => {
  it('renders Indian Standards list with publish and lifecycle actions', async () => {
    vi.mocked(adminService.getStandards).mockResolvedValueOnce({
      standards: [
        {
          id: 'std-1',
          isNumber: 'IS 1293:2019',
          canonicalNumber: 'IS 1293:2019',
          title: 'Plugs and Socket-Outlets of Rated Voltage up to and Including 250 Volts',
          status: 'CURRENT' as const,
          lifecycleStatus: 'PUBLISHED' as const,
          language: 'en',
          isActive: true,
          sourceDocumentId: 'src-1',
          sourceDocument: {
            id: 'src-1',
            title: 'BIS Standard Catalogue IS 1293',
            url: 'https://www.standardsbis.bsbedge.com',
            authorityLevel: 'AUTHORITATIVE' as const,
          },
          versionsCount: 2,
          amendmentsCount: 1,
          chunksCount: 24,
          schemesCount: 1,
          qcosCount: 1,
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2026-09-01T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });

    renderWithAuth(<AdminStandardsPage />);

    await waitFor(() => {
      expect(screen.getByText('IS 1293:2019')).toBeInTheDocument();
      expect(screen.getByText(/Plugs and Socket-Outlets/i)).toBeInTheDocument();
      expect(screen.getAllByText('PUBLISHED')[0]).toBeInTheDocument();
    });
  });
});

describe('Phase 13 — Admin QCOs Page', () => {
  it('renders QCO orders and mandatory standard mappings', async () => {
    vi.mocked(adminService.getQcos).mockResolvedValueOnce({
      qcos: [
        {
          id: 'qco-1',
          name: 'Electrical Accessories (Quality Control) Order, 2020',
          orderNumber: 'S.O. 4567(E)',
          ministry: 'Ministry of Heavy Industries',
          notificationDate: '2020-11-18',
          effectiveDate: '2021-05-18',
          status: 'ACTIVE',
          sourceDocumentId: 'src-1',
          standardsCount: 2,
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2026-09-01T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });

    renderWithAuth(<AdminQcosPage />);

    await waitFor(() => {
      expect(screen.getByText('S.O. 4567(E)')).toBeInTheDocument();
      expect(screen.getByText(/Electrical Accessories/i)).toBeInTheDocument();
    });
  });
});

describe('Phase 13 — Admin Search & Embeddings Page', () => {
  it('renders pgvector embedding status and dimensions', async () => {
    vi.mocked(adminService.getEmbeddingStatus).mockResolvedValueOnce({
      totalChunks: 1200,
      embeddedChunks: 1195,
      pendingChunks: 5,
      failedChunks: 0,
      provider: 'OPENAI_PGVECTOR',
      model: 'text-embedding-3-small',
      dimension: 1536,
      lastIndexRun: '2026-09-25T12:00:00.000Z',
    });

    renderWithAuth(<AdminEmbeddingsPage />);

    await waitFor(() => {
      expect(screen.getByText('1200')).toBeInTheDocument();
      expect(screen.getByText('1195')).toBeInTheDocument();
      expect(screen.getByText('text-embedding-3-small')).toBeInTheDocument();
    });
  });
});

describe('Phase 13 — Admin Data Quality Center', () => {
  it('renders repository diagnostics scan and severity categories', async () => {
    vi.mocked(adminService.getDataQualityReport).mockResolvedValueOnce({
      scannedAt: '2026-09-25T14:00:00.000Z',
      totalIssues: 2,
      criticalCount: 1,
      errorCount: 0,
      warningCount: 1,
      infoCount: 0,
      issues: [
        {
          id: 'dq-1',
          category: 'MISSING_SOURCE',
          severity: 'CRITICAL',
          title: 'Standard IS 9999 lacks authoritative source reference',
          description: 'Standard has no linked SourceDocument.',
          entityType: 'Standard',
          entityId: 'std-99',
          remediation: 'Link this standard to a verified Gazette.',
          detectedAt: '2026-09-25T14:00:00.000Z',
        },
        {
          id: 'dq-2',
          category: 'STALE_RECORD',
          severity: 'WARNING',
          title: 'Source "BIS Gazette 2024" is stale',
          description: 'Exceeded 90 day verification threshold.',
          entityType: 'SourceDocument',
          entityId: 'src-2',
          remediation: 'Re-verify source document.',
          detectedAt: '2026-09-25T14:00:00.000Z',
        },
      ],
    });

    renderWithAuth(<AdminDataQualityPage />);

    await waitFor(() => {
      expect(screen.getByText(/Knowledge Governance & Data Quality Center/i)).toBeInTheDocument();
      expect(screen.getByText('Standard IS 9999 lacks authoritative source reference')).toBeInTheDocument();
      expect(screen.getByText('Source "BIS Gazette 2024" is stale')).toBeInTheDocument();
    });
  });
});

describe('Phase 13 — Admin Audit Trail Viewer', () => {
  it('renders immutable audit events with actor and metadata', async () => {
    vi.mocked(adminService.getAuditLogs).mockResolvedValueOnce({
      logs: [
        {
          id: 'log-1',
          userId: 'admin-1',
          userName: 'BIS Lead Administrator',
          userRole: 'ADMIN',
          action: 'STANDARD_PUBLISHED',
          entityType: 'Standard',
          entityId: 'std-1',
          metadata: { isNumber: 'IS 1293:2019', version: '2019' },
          ipAddress: '127.0.0.1',
          createdAt: '2026-09-25T14:30:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });

    renderWithAuth(<AdminAuditPage />);

    await waitFor(() => {
      expect(screen.getByText(/Append-Only Audit Trail/i)).toBeInTheDocument();
      expect(screen.getAllByText('STANDARD_PUBLISHED')[0]).toBeInTheDocument();
      expect(screen.getByText('BIS Lead Administrator')).toBeInTheDocument();
    });
  });
});

describe('Phase 13 — Admin Multilingual Translations Page', () => {
  it('renders authoritative terminology entries and protected identifiers notice', () => {
    renderWithAuth(<AdminTranslationsPage />);

    expect(screen.getByText(/Multilingual Translation & Terminology Governance/i)).toBeInTheDocument();
    expect(screen.getByText(/Canonical Technical Identifiers are Strictly Preserved/i)).toBeInTheDocument();
    expect(screen.getAllByText('Bureau of Indian Standards')[0]).toBeInTheDocument();
  });
});
