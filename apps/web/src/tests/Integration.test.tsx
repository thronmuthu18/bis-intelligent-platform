import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductOverviewPage } from '@/pages/product/ProductOverviewPage';
import { ProductAssistantPage } from '@/pages/product/ProductAssistantPage';
import { ProductCompliancePage } from '@/pages/product/ProductCompliancePage';
import { assistantService } from '@/services/api/assistant.service';
import { complianceService } from '@/services/api/compliance.service';
import type {
  AssistantConversation,
  ComplianceJourneyOverviewResponse,
} from '@bis/shared';

// Mock assistantService & complianceService modules
vi.mock('@/services/api/assistant.service', () => ({
  assistantService: {
    getConversations: vi.fn(),
    createConversation: vi.fn(),
    getConversation: vi.fn(),
    sendMessage: vi.fn(),
  },
}));

vi.mock('@/services/api/compliance.service', () => ({
  complianceService: {
    getJourneyOverview: vi.fn(),
    getDossier: vi.fn(),
    completeTask: vi.fn(),
    validateDossier: vi.fn(),
    recalculateJourney: vi.fn(),
    markAlertRead: vi.fn(),
  },
}));

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

// Mock useProduct context hook directly
vi.mock('@/contexts/ProductContext', () => ({
  useProduct: () => ({
    product: {
      id: 'prod-integrated-1',
      userId: 'user-auth-123',
      name: 'Solar Inverter 5kW Grid-Tie',
      category: 'Solar Photovoltaics & Inverters',
      description: 'Pure sine wave 5kW grid-connected solar inverter system with MPPT.',
      manufacturerType: 'Domestic Manufacturer',
      status: 'ACTIVE',
      isActive: true,
      createdAt: '2026-09-28T00:00:00.000Z',
      updatedAt: '2026-09-28T00:00:00.000Z',
    },
    isLoading: false,
    error: null,
    refreshProduct: vi.fn(),
    updateProduct: vi.fn(),
    archiveProduct: vi.fn(),
  }),
}));

const mockConversation: AssistantConversation = {
  id: 'conv-integ-1',
  productId: 'prod-integrated-1',
  userId: 'user-auth-123',
  title: 'Inverter Grid Synchronization Standards',
  createdAt: '2026-09-28T10:00:00.000Z',
  updatedAt: '2026-09-28T10:00:00.000Z',
  messages: [
    {
      id: 'msg-101',
      conversationId: 'conv-integ-1',
      role: 'USER',
      content: 'What testing is required for solar inverters under CRS Scheme II?',
      grounded: true,
      createdAt: '2026-09-28T10:00:00.000Z',
    },
    {
      id: 'msg-102',
      conversationId: 'conv-integ-1',
      role: 'ASSISTANT',
      content: 'Under CRS Scheme II, grid-tied solar inverters must comply with IS 16221 (Part 2) for electrical safety and IS 16169 for islanding prevention.',
      grounded: true,
      citations: [
        {
          citationIndex: 1,
          standardId: 'std-16221',
          isNumber: 'IS 16221-2',
          sourceTitle: 'Safety of Power Converters for Use in Photovoltaic Power Systems',
          authorityLevel: 'AUTHORITATIVE',
          clauseOrSection: 'Section 4: Protection Against Electric Shock',
          sourceUrl: 'https://standardsbis.bsbedge.com/BIS_SearchStandard.aspx',
        },
      ],
      createdAt: '2026-09-28T10:00:05.000Z',
    },
  ],
};

const mockJourneyOverview: ComplianceJourneyOverviewResponse = {
  journey: {
    id: 'jou-1',
    productId: 'prod-integrated-1',
    productName: 'Solar Inverter 5kW Grid-Tie',
    status: 'STANDARD_IDENTIFICATION',
    journeyVersion: '1',
    inputHash: 'hash-abc',
    readinessScore: 82,
    readinessStatus: 'HIGH_READINESS',
    currentStage: 'STANDARD_IDENTIFICATION',
    startedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    requirementsCount: 6,
    completedRequirementsCount: 5,
    tasksCount: 3,
    completedTasksCount: 2,
    blockedTasksCount: 0,
  },
  readiness: {
    overallScore: 82,
    readinessStatus: 'HIGH_READINESS',
    domainScores: [
      {
        domain: 'STANDARDS',
        score: 100,
        status: 'COMPLETE',
        totalRequirements: 2,
        completedRequirements: 2,
        pendingRequirements: 0,
        details: 'All standards identified',
      },
    ],
    completedRequirements: 5,
    incompleteRequirements: 1,
    blockedRequirements: 0,
    documentsNeedingReview: 0,
    missingTests: 0,
    missingLaboratoryActions: 0,
    missingCertificationActions: 0,
    qcoBlockers: 0,
    criticalNextActions: ['Complete final documentation dossier'],
    explanation: 'Platform Compliance Readiness is 82%.',
    calculatedAt: '2026-01-01T00:00:00.000Z',
  },
  confirmedStandards: [],
  tasks: [],
  alerts: [],
  regulatoryImpacts: [],
  dossierSummary: {
    id: 'dos-1',
    status: 'INCOMPLETE',
    completenessScore: 80,
    missingCount: 0,
    verifiedCount: 4,
  },
  timeline: [],
};

describe('Phase 16.5 — Cross-Module End-to-End Integration Hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assistantService.getConversations).mockResolvedValue([mockConversation]);
    vi.mocked(assistantService.getConversation).mockResolvedValue(mockConversation);
    vi.mocked(complianceService.getJourneyOverview).mockResolvedValue(mockJourneyOverview);
    vi.mocked(complianceService.getDossier).mockResolvedValue({
      id: 'dos-1',
      productId: 'prod-integrated-1',
      status: 'IN_PROGRESS',
      items: [],
      completenessScore: 80,
    } as any);
  });

  it('1. Product Workspace Overview -> displays product context', async () => {
    render(
      <MemoryRouter>
        <ProductOverviewPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Solar Inverter 5kW Grid-Tie')).toBeDefined();
    expect(screen.getByText('Domestic Manufacturer')).toBeDefined();
    expect(screen.getByText('Pure sine wave 5kW grid-connected solar inverter system with MPPT.')).toBeDefined();
    expect(screen.getByRole('button', { name: /Edit Product/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Archive Product/i })).toBeDefined();
  });

  it('2. Product Workspace -> Assistant with citations & evidence drawer', async () => {
    render(
      <MemoryRouter>
        <ProductAssistantPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Inverter Grid Synchronization Standards')).toBeDefined();
    expect(
      await screen.findByText(/Under CRS Scheme II, grid-tied solar inverters must comply with IS 16221/i)
    ).toBeDefined();

    const citationBadge = await screen.findByText(/\[1\] IS 16221-2/i);
    expect(citationBadge).toBeDefined();

    fireEvent.click(citationBadge);

    expect(await screen.findByText('Authoritative Source Evidence')).toBeDefined();
    expect(screen.getByText(/Safety of Power Converters for Use in Photovoltaic Power Systems/i)).toBeDefined();
    expect(screen.getByText(/Section 4: Protection Against Electric Shock/i)).toBeDefined();
  });

  it('3. Product Compliance Journey -> loads readiness score and overview components', async () => {
    render(
      <MemoryRouter>
        <ProductCompliancePage />
      </MemoryRouter>
    );

    expect(await screen.findByText('82%')).toBeDefined();
    expect(await screen.findByText(/Platform Compliance Readiness/i)).toBeDefined();
    expect(screen.getByText('STANDARDS')).toBeDefined();
  });
});
