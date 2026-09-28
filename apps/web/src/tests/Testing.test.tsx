import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductTestingPage } from '../pages/product/ProductTestingPage';
import { ProductLaboratoriesPage } from '../pages/product/ProductLaboratoriesPage';
import { testingService } from '../services/api';
import type { ProductTestingAnalysisResponse } from '@bis/shared';

// Mock Services
vi.mock('@/services/api/testing.service', () => ({
  testingService: {
    analyzeTesting: vi.fn(),
    getTestingAnalysis: vi.fn(),
    getTestRequirements: vi.fn(),
    getLaboratories: vi.fn(),
    createLaboratoryReview: vi.fn(),
    getLaboratoryReviews: vi.fn(),
  },
}));

// Mock useProduct
vi.mock('@/contexts/ProductContext', () => ({
  useProduct: () => ({
    product: {
      id: 'prod-led-1',
      name: 'Industrial LED Luminaire 120W',
      category: 'LED Lighting',
      intendedUse: 'Outdoor street and municipal lighting fixture',
      manufacturerName: 'Bharat Luminaires Ltd',
    },
    loading: false,
    error: null,
    refreshProduct: vi.fn(),
    updateProductState: vi.fn(),
  }),
}));

const mockTestingAnalysis: ProductTestingAnalysisResponse = {
  id: 'test-analysis-1',
  productId: 'prod-led-1',
  status: 'COMPLETED',
  analysisVersion: '1.0.0',
  inputHash: 'test-hash-12345',
  readiness: {
    status: 'TESTING_READY',
    score: 90,
    summary: 'Testing parameters, equipment checklist, and laboratory pathways are fully established.',
    blockers: [],
    nextSteps: ['Dispatch sample units for laboratory testing'],
    factoryTestingReady: true,
    externalLabRequired: true,
    labShortlisted: true,
    labSelected: true,
  },
  requirements: [
    {
      id: 'req-1',
      analysisId: 'test-analysis-1',
      standardId: 'std-1',
      standardNumber: 'IS 10322 (Part 5/Sec 1) : 2012',
      standardTitle: 'Luminaires Specification',
      testName: 'Insulation Resistance & Electric Strength',
      testCategory: 'ELECTRICAL',
      testMethod: 'IS 10322 (Part 5/Sec 1) Clause 10.2',
      clause: 'Clause 10.2',
      parameter: 'Insulation Resistance',
      requirementValue: '≥ 2.0 MΩ at 500 V DC',
      unit: 'MΩ',
      applicability: 'BOTH',
      status: 'REQUIRED',
      rank: 1,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'req-2',
      analysisId: 'test-analysis-1',
      standardId: 'std-1',
      standardNumber: 'IS 10322 (Part 5/Sec 1) : 2012',
      testName: 'Thermal Endurance Test',
      testCategory: 'THERMAL',
      testMethod: 'IS 10322 (Part 5/Sec 1) Clause 12',
      clause: 'Clause 12.4',
      parameter: 'Temperature Rise',
      requirementValue: 'Max temp rise ≤ 75°C',
      unit: '°C',
      applicability: 'BOTH',
      status: 'REQUIRED',
      rank: 2,
      createdAt: new Date().toISOString(),
    },
  ],
  equipment: [
    {
      id: 'equip-1',
      analysisId: 'test-analysis-1',
      equipmentName: 'High Voltage Breakdown Dielectric Tester',
      purpose: 'Routine dielectric withstand testing in in-house factory lab.',
      requiredStatus: 'REQUIRED',
      calibrationRequired: true,
      calibrationInterval: '12 Months',
      source: 'Product Manual STI Section 3.1',
      notes: null,
      rank: 1,
      createdAt: new Date().toISOString(),
    },
  ],
  calibration: [
    {
      id: 'cal-1',
      analysisId: 'test-analysis-1',
      equipmentName: 'High Voltage Breakdown Dielectric Tester',
      parameterMeasured: 'AC Test Voltage (kV)',
      traceabilityStandard: 'NABL Accredited Calibration Laboratory / NPL Traceable',
      calibrationInterval: '12 Months',
      calibrationAgencyType: 'NABL_ACCREDITED_CAL_LAB',
      source: 'STI Section 3.1',
      notes: null,
      rank: 1,
      createdAt: new Date().toISOString(),
    },
  ],
  laboratoryRequirements: [
    {
      id: 'labreq-1',
      analysisId: 'test-analysis-1',
      schemeCode: 'SCHEME_I_ISI',
      requirementType: 'EXTERNAL_LAB_REQUIRED',
      reason: 'Scheme-I (ISI Mark) requires independent laboratory testing for initial Grant of Licence sample draw.',
      sampleSize: '2 finished production units',
      testingDuration: '20 to 30 days',
      source: 'BIS Conformity Assessment Regulations 2018',
      rank: 1,
      createdAt: new Date().toISOString(),
    },
  ],
  laboratories: [
    {
      laboratory: {
        id: 'lab-1',
        name: 'BIS Central Laboratory',
        code: 'BIS-CL-01',
        organizationType: 'BIS_AND_NABL',
        city: 'Ghaziabad',
        state: 'Uttar Pradesh',
        country: 'India',
        isNabl: true,
        isBisLab: true,
        status: 'ACTIVE',
        authorityLevel: 'AUTHORITATIVE',
        isVerified: true,
        userReview: {
          id: 'rev-1',
          productId: 'prod-led-1',
          laboratoryId: 'lab-1',
          decision: 'SELECTED',
          note: 'Primary testing facility selected',
          userId: 'user-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      capabilityMatch: 'HIGH',
      matchScore: 0.95,
      matchedTests: ['Insulation Resistance & Electric Strength', 'Thermal Endurance Test'],
      matchedStandards: ['IS 10322 (Part 5/Sec 1) : 2012'],
      recognitionStatus: 'BIS_RECOGNIZED',
      accreditationStatus: 'ACCREDITED',
      source: {
        title: 'BIS LIMS Laboratory Directory',
        url: 'https://www.lims.bis.gov.in/cl',
        authorityLevel: 'AUTHORITATIVE',
      },
    },
  ],
  userSelectedLaboratory: {
    laboratory: {
      id: 'lab-1',
      name: 'BIS Central Laboratory',
      code: 'BIS-CL-01',
      organizationType: 'BIS_AND_NABL',
      city: 'Ghaziabad',
      state: 'Uttar Pradesh',
      country: 'India',
      isNabl: true,
      isBisLab: true,
      status: 'ACTIVE',
      authorityLevel: 'AUTHORITATIVE',
      isVerified: true,
      userReview: {
        id: 'rev-1',
        productId: 'prod-led-1',
        laboratoryId: 'lab-1',
        decision: 'SELECTED',
        userId: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
    capabilityMatch: 'HIGH',
    matchScore: 0.95,
    matchedTests: ['Insulation Resistance & Electric Strength'],
    matchedStandards: ['IS 10322 (Part 5/Sec 1) : 2012'],
    recognitionStatus: 'BIS_RECOGNIZED',
    accreditationStatus: 'ACCREDITED',
  },
  sources: [
    {
      title: 'BIS Know Your Standard — IS 10322',
      url: 'https://www.services.bis.gov.in/is10322',
      authorityLevel: 'AUTHORITATIVE',
      sourceType: 'BIS_OFFICIAL',
    },
  ],
  completedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('Phase 8 — Frontend Testing & Laboratory Intelligence Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders ProductTestingPage header, readiness score banner, and automatically loads testing analysis', async () => {
    vi.spyOn(testingService, 'analyzeTesting').mockResolvedValue(mockTestingAnalysis);

    render(
      <MemoryRouter>
        <ProductTestingPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Testing & Laboratory Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Phase 8')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('90')).toBeInTheDocument();
      expect(screen.getByText('Testing Pathway Ready')).toBeInTheDocument();
    });
  });

  it('renders required test parameters with acceptance limits and test methods', async () => {
    vi.spyOn(testingService, 'analyzeTesting').mockResolvedValue(mockTestingAnalysis);

    render(
      <MemoryRouter>
        <ProductTestingPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Insulation Resistance & Electric Strength')).toBeInTheDocument();
      expect(screen.getByText('≥ 2.0 MΩ at 500 V DC')).toBeInTheDocument();
      expect(screen.getByText('Thermal Endurance Test')).toBeInTheDocument();
    });
  });

  it('renders factory test equipment checklist with calibration interval and traceability', async () => {
    vi.spyOn(testingService, 'analyzeTesting').mockResolvedValue(mockTestingAnalysis);

    render(
      <MemoryRouter>
        <ProductTestingPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('High Voltage Breakdown Dielectric Tester')).toBeInTheDocument();
      expect(screen.getByText('Cal Interval: 12 Months')).toBeInTheDocument();
    });
  });

  it('renders potential laboratory match cards and user selected laboratory highlight', async () => {
    vi.spyOn(testingService, 'analyzeTesting').mockResolvedValue(mockTestingAnalysis);

    render(
      <MemoryRouter>
        <ProductTestingPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('User Selected Testing Laboratory')).toBeInTheDocument();
      expect(screen.getAllByText('BIS Central Laboratory').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('BIS Recognized').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('opens review decision modal when clicking Shortlist or Select action', async () => {
    vi.spyOn(testingService, 'analyzeTesting').mockResolvedValue(mockTestingAnalysis);

    render(
      <MemoryRouter>
        <ProductTestingPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Manage Selection')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Manage Selection'));

    await waitFor(() => {
      expect(screen.getByText(/Review Laboratory:/)).toBeInTheDocument();
      expect(screen.getByText('Select as Primary')).toBeInTheDocument();
    });
  });

  it('renders ProductLaboratoriesPage with search and laboratory filter controls', async () => {
    vi.spyOn(testingService, 'getLaboratories').mockResolvedValue(mockTestingAnalysis.laboratories);

    render(
      <MemoryRouter>
        <ProductLaboratoriesPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Testing Laboratories')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by lab, city, or test name...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('BIS Central Laboratory')).toBeInTheDocument();
      expect(screen.getByText('High Capability Match')).toBeInTheDocument();
    });
  });
});
