import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductCompliancePage } from '@/pages/product/ProductCompliancePage';
import { complianceService } from '@/services/api/compliance.service';
import type {
  ComplianceJourneyOverviewResponse,
  ApplicationDossierResponse,
  ValidateDossierResponse,
} from '@bis/shared';

// Mock Services
vi.mock('@/services/api/compliance.service', () => ({
  complianceService: {
    initializeJourney: vi.fn(),
    getJourneyOverview: vi.fn(),
    recalculateJourney: vi.fn(),
    getTasks: vi.fn(),
    completeTask: vi.fn(),
    reopenTask: vi.fn(),
    getReadiness: vi.fn(),
    getTimeline: vi.fn(),
    getDossier: vi.fn(),
    compileDossier: vi.fn(),
    validateDossier: vi.fn(),
    getAlerts: vi.fn(),
    markAlertRead: vi.fn(),
    getRegulatoryImpact: vi.fn(),
  },
}));

// Mock useProduct
vi.mock('@/contexts/ProductContext', () => ({
  useProduct: () => ({
    product: {
      id: 'prod-led-1',
      name: 'Industrial LED Luminaire 150W',
      category: 'Lighting & Electronics',
      status: 'IN_PROGRESS',
    },
    isLoading: false,
    error: null,
    refreshProduct: vi.fn(),
  }),
}));

const mockOverview: ComplianceJourneyOverviewResponse = {
  journey: {
    id: 'journey-1',
    productId: 'prod-led-1',
    productName: 'Industrial LED Luminaire 150W',
    status: 'STANDARD_IDENTIFICATION',
    journeyVersion: '1',
    inputHash: 'hash123',
    readinessScore: 78,
    readinessStatus: 'MODERATE_READINESS',
    currentStage: 'STANDARD_IDENTIFICATION',
    startedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    requirementsCount: 8,
    completedRequirementsCount: 6,
    tasksCount: 4,
    completedTasksCount: 1,
    blockedTasksCount: 1,
  },
  readiness: {
    overallScore: 78,
    readinessStatus: 'MODERATE_READINESS',
    domainScores: [
      {
        domain: 'STANDARDS',
        score: 100,
        status: 'COMPLETE',
        totalRequirements: 2,
        completedRequirements: 2,
        pendingRequirements: 0,
        details: '2 of 2 standards satisfied (100%).',
      },
      {
        domain: 'CERTIFICATION',
        score: 100,
        status: 'COMPLETE',
        totalRequirements: 1,
        completedRequirements: 1,
        pendingRequirements: 0,
        details: 'Scheme-I pathway verified.',
      },
      {
        domain: 'TESTING',
        score: 60,
        status: 'IN_PROGRESS',
        totalRequirements: 2,
        completedRequirements: 1,
        pendingRequirements: 1,
        details: '1 of 2 STI tests verified.',
      },
      {
        domain: 'LABORATORY',
        score: 100,
        status: 'COMPLETE',
        totalRequirements: 1,
        completedRequirements: 1,
        pendingRequirements: 0,
        details: 'NTH Laboratory selected.',
      },
      {
        domain: 'DOCUMENTS',
        score: 75,
        status: 'NEEDS_REVIEW',
        totalRequirements: 2,
        completedRequirements: 1,
        pendingRequirements: 1,
        details: '1 document awaiting verification.',
      },
    ],
    completedRequirements: 6,
    incompleteRequirements: 2,
    blockedRequirements: 1,
    documentsNeedingReview: 1,
    missingTests: 1,
    missingLaboratoryActions: 0,
    missingCertificationActions: 0,
    qcoBlockers: 0,
    criticalNextActions: ['Upload in-house SIT quality control manual', 'Execute mandatory thermal test'],
    explanation: 'Platform Compliance Readiness is 78%. Completed: 6/8 requirements.',
    calculatedAt: '2026-01-01T00:00:00.000Z',
  },
  confirmedStandards: [
    {
      id: 'std-1',
      isNumber: 'IS 10322 (Part 5/Sec 1)',
      title: 'Luminaires - Particular Requirements',
      status: 'CURRENT',
      schemeTitle: 'Scheme-I (ISI Mark)',
    },
  ],
  tasks: [
    {
      id: 'task-1',
      journeyId: 'journey-1',
      title: 'Review Standard IS 10322',
      description: 'Confirm scope and applicability',
      taskType: 'REVIEW_STANDARD',
      status: 'COMPLETED',
      priority: 'CRITICAL',
      taskOrder: 1,
      isBlocked: false,
      blockingReasons: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'task-2',
      journeyId: 'journey-1',
      title: 'Upload Quality Control Manual & SIT',
      description: 'Provide certified in-house SIT manual',
      taskType: 'UPLOAD_DOCUMENT',
      status: 'TODO',
      priority: 'HIGH',
      taskOrder: 2,
      isBlocked: false,
      blockingReasons: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'task-3',
      journeyId: 'journey-1',
      title: 'Compile Preparation Dossier',
      description: 'Compile and validate all evidence before official action',
      taskType: 'COMPLETE_APPLICATION',
      status: 'TODO',
      priority: 'CRITICAL',
      taskOrder: 3,
      isBlocked: true,
      blockingReasons: ['Prerequisite not satisfied: Quality Control Manual & SIT (IN_PROGRESS)'],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  alerts: [
    {
      id: 'alert-1',
      productId: 'prod-led-1',
      alertType: 'DOCUMENT_EXPIRING',
      priority: 'HIGH',
      title: 'Calibration Expiry: Master Gauge',
      reason: 'Calibration certificate due for review on 2026-10-15.',
      source: 'Document ID: doc-1',
      recommendedAction: 'Engage NABL accredited calibration facility.',
      isRead: false,
      isResolved: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  regulatoryImpacts: [
    {
      id: 'imp-1',
      changeEventId: 'evt-1',
      productId: 'prod-led-1',
      impactLevel: 'HIGH',
      affectedRequirements: ['IS 10322'],
      requiredActions: ['Review updated gazette safety clauses.'],
      status: 'ACTIVE',
      changeEvent: {
        id: 'evt-1',
        changeType: 'QCO_UPDATED',
        title: 'Luminaires QCO Amendment 2026',
        summary: 'Mandatory enforcement for LED Luminaires',
        detectedAt: '2026-01-01T00:00:00.000Z',
        authorityLevel: 'AUTHORITATIVE',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  dossierSummary: {
    id: 'dossier-1',
    status: 'INCOMPLETE',
    completenessScore: 75,
    missingCount: 1,
    verifiedCount: 3,
  },
  timeline: [
    {
      id: 't-1',
      stage: 'PRODUCT_IDENTIFIED',
      title: 'Product Profile Created',
      description: 'Registered Industrial LED Luminaire 150W',
      status: 'COMPLETED',
      timestamp: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 't-2',
      stage: 'STANDARD_IDENTIFICATION',
      title: 'Applicable Standards Confirmed',
      description: 'Confirmed IS 10322 (Part 5/Sec 1)',
      status: 'COMPLETED',
      timestamp: '2026-01-02T00:00:00.000Z',
    },
  ],
};

const mockDossier: ApplicationDossierResponse = {
  id: 'dossier-1',
  journeyId: 'journey-1',
  productId: 'prod-led-1',
  version: 1,
  status: 'INCOMPLETE',
  title: 'Preparation Dossier for Industrial LED Luminaire 150W',
  summary: 'Preparation package with 4 items',
  completenessScore: 75,
  missingCount: 1,
  unverifiedCount: 1,
  verifiedCount: 2,
  items: [
    {
      id: 'item-1',
      dossierId: 'dossier-1',
      itemType: 'PRODUCT_SPECIFICATION',
      title: 'Technical Specifications',
      sourceType: 'PRODUCT',
      verificationStatus: 'VERIFIED',
      required: true,
      status: 'VERIFIED',
      itemOrder: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'item-2',
      dossierId: 'dossier-1',
      itemType: 'FACTORY_LAYOUT',
      title: 'Factory Layout Plan',
      sourceType: 'DOCUMENT',
      documentFileName: 'factory_layout.pdf',
      verificationStatus: 'VERIFIED',
      required: true,
      status: 'VERIFIED',
      itemOrder: 2,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockValidation: ValidateDossierResponse = {
  isValid: false,
  status: 'INCOMPLETE',
  completenessScore: 75,
  missingItems: [],
  unverifiedItems: [],
  warnings: ['Item requires human verification: Quality Control Manual'],
  blockers: ['Missing mandatory dossier item: Quality Control Manual & SIT'],
  validatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ProductCompliancePage Frontend Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (complianceService.getJourneyOverview as any).mockResolvedValue(mockOverview);
    (complianceService.getDossier as any).mockResolvedValue(mockDossier);
    (complianceService.completeTask as any).mockResolvedValue({ id: 'task-2', status: 'COMPLETED' });
    (complianceService.validateDossier as any).mockResolvedValue(mockValidation);
    (complianceService.recalculateJourney as any).mockResolvedValue(mockOverview);
    (complianceService.markAlertRead as any).mockResolvedValue(undefined);
  });

  it('1. Renders compliance journey dashboard with readiness score and domain cards', async () => {
    render(
      <MemoryRouter>
        <ProductCompliancePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(complianceService.getJourneyOverview).toHaveBeenCalled();
    });

    expect(screen.getByText('78%')).toBeInTheDocument();
    expect(screen.getByText(/Platform Compliance Readiness/i)).toBeInTheDocument();
    expect(screen.getByText('STANDARDS')).toBeInTheDocument();
    expect(screen.getByText('CERTIFICATION')).toBeInTheDocument();
    expect(screen.getByText('TESTING')).toBeInTheDocument();
    expect(screen.getByText('LABORATORY')).toBeInTheDocument();
    expect(screen.getByText('DOCUMENTS')).toBeInTheDocument();
  });

  it('2. Renders actionable compliance task list with blocker badges', async () => {
    render(
      <MemoryRouter>
        <ProductCompliancePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(complianceService.getJourneyOverview).toHaveBeenCalled();
    });

    expect(screen.getByText('Review Standard IS 10322')).toBeInTheDocument();
    expect(screen.getByText('Upload Quality Control Manual & SIT')).toBeInTheDocument();
    expect(screen.getByText('Compile Preparation Dossier')).toBeInTheDocument();
    expect(screen.getAllByText('BLOCKED').length).toBeGreaterThanOrEqual(1);
  });

  it('3. Completes an unblocked task when complete button is clicked', async () => {
    render(
      <MemoryRouter>
        <ProductCompliancePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(complianceService.getJourneyOverview).toHaveBeenCalled();
    });

    const completeBtn = screen.getByRole('button', { name: 'Complete Task: Upload Quality Control Manual & SIT' });
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(complianceService.completeTask).toHaveBeenCalledWith('prod-led-1', 'task-2');
    });
  });

  it('4. Renders Preparation Dossier tab with items and allows validation', async () => {
    render(
      <MemoryRouter>
        <ProductCompliancePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(complianceService.getJourneyOverview).toHaveBeenCalled();
    });

    // Switch to Dossier Tab
    const dossierTabBtn = screen.getByRole('button', { name: /^Preparation Dossier \(/i });
    fireEvent.click(dossierTabBtn);

    await waitFor(() => {
      expect(screen.getByText('Technical Specifications')).toBeInTheDocument();
    });

    // Click Validate Dossier
    const validateBtn = screen.getByRole('button', { name: /Validate Dossier/i });
    fireEvent.click(validateBtn);

    await waitFor(() => {
      expect(complianceService.validateDossier).toHaveBeenCalledWith('prod-led-1');
      expect(screen.getByText(/Dossier Incomplete — Mandatory Evidence Missing/i)).toBeInTheDocument();
    });
  });

  it('5. Renders Regulatory Alerts tab and marks alert as read', async () => {
    render(
      <MemoryRouter>
        <ProductCompliancePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(complianceService.getJourneyOverview).toHaveBeenCalled();
    });

    // Switch to Alerts Tab
    const alertsTabBtn = screen.getByRole('button', { name: /Regulatory Updates/i });
    fireEvent.click(alertsTabBtn);

    await waitFor(() => {
      expect(screen.getByText('Calibration Expiry: Master Gauge')).toBeInTheDocument();
    });

    const markReadBtn = screen.getByRole('button', { name: /Mark as Read/i });
    fireEvent.click(markReadBtn);

    await waitFor(() => {
      expect(complianceService.markAlertRead).toHaveBeenCalledWith('prod-led-1', 'alert-1');
    });
  });

  it('6. Renders chronological timeline tab', async () => {
    render(
      <MemoryRouter>
        <ProductCompliancePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(complianceService.getJourneyOverview).toHaveBeenCalled();
    });

    // Switch to Timeline Tab
    const timelineTabBtn = screen.getByRole('button', { name: /Journey Timeline/i });
    fireEvent.click(timelineTabBtn);

    await waitFor(() => {
      expect(screen.getByText('Product Profile Created')).toBeInTheDocument();
      expect(screen.getByText('Applicable Standards Confirmed')).toBeInTheDocument();
    });
  });
});
