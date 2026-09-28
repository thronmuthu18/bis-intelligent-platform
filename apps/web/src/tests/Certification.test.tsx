import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '@/components/ui/Toast';
import { ProductCertificationPage } from '@/pages/product/ProductCertificationPage';
import { certificationService } from '@/services/api';
import type { ProductCertificationAnalysisResponse } from '@bis/shared';

// Mock Services
vi.mock('@/services/api/certification.service', () => ({
  certificationService: {
    analyzeProduct: vi.fn(),
    getLatestAnalysis: vi.fn(),
    saveSchemeReview: vi.fn(),
    getSchemeReviews: vi.fn(),
    getSchemeDetail: vi.fn(),
  },
}));

// Mock useProduct
vi.mock('@/contexts/ProductContext', () => ({
  useProduct: () => ({
    product: {
      id: 'prod-uuid-1234',
      name: 'Smart LED Luminaire 50W',
      category: 'Electrical Equipment & Luminaires',
      intendedUse: 'Outdoor street and municipal lighting fixture',
      manufacturerName: 'Bharat Electronics Lighting Ltd',
      manufacturerAddress: 'Plot 42, Industrial Area, Okhla Phase III, New Delhi',
    },
    loading: false,
    error: null,
    refreshProduct: vi.fn(),
    updateProductState: vi.fn(),
  }),
}));

const mockCertificationAnalysis: ProductCertificationAnalysisResponse = {
  analysisId: 'cert-analysis-uuid-1',
  productId: 'prod-uuid-1234',
  productStandardAnalysisId: 'std-analysis-uuid-1',
  status: 'COMPLETED',
  analysisVersion: '1.0.0',
  inputHash: 'abcdef1234567890',
  generatedAt: '2026-09-25T08:00:00.000Z',
  fromCache: false,
  schemes: [
    {
      id: 'rec-1',
      schemeId: 'scheme-isi-id',
      standardId: 'std-10322-id',
      schemeCode: 'SCHEME_I_ISI',
      schemeName: 'Scheme-I (ISI Mark Certification Scheme)',
      schemeDescription: 'Conformity assessment scheme governed by BIS (Conformity Assessment) Regulations, 2018.',
      standardIsNumber: 'IS 10322 (Part 5/Sec 1) : 2012',
      standardTitle: 'Luminaires - Particular Requirements - General Purpose Luminaires',
      relevanceLevel: 'RELEVANT',
      confidenceScore: 0.95,
      reasons: [
        'Direct conformity assessment mapping established in BIS Knowledge Repository for IS 10322',
        'Mandatory Quality Control Order published (Electrical Appliances QCO) requires certification under this framework',
        'Official BIS Product Manual published: Product Manual for General Purpose Luminaires',
      ],
      evidence: {
        mappingNotes: 'Mandatory factory inspection and testing.',
        sourceDocument: {
          title: 'BIS Know Your Standard — IS 10322',
          url: 'https://www.services.bis.gov.in/standards/is10322',
          authorityLevel: 'AUTHORITATIVE',
        },
        productManual: {
          title: 'Product Manual for General Purpose Luminaires',
          version: 'PM/10322-5-1/1',
          documentUrl: 'https://www.manakonline.in/pm_10322.pdf',
        },
      },
      rank: 1,
      userReview: null,
    },
  ],
  qcoInformation: [
    {
      id: 'qco-info-1',
      qcoId: 'qco-1',
      standardId: 'std-10322-id',
      qcoTitle: 'Electrical Appliances (Quality Control) Order',
      orderNumber: 'S.O. 2291(E)',
      issuingAuthority: 'Ministry of Heavy Industries',
      notificationDate: '2003-10-09T00:00:00.000Z',
      effectiveDate: '2004-04-01T00:00:00.000Z',
      sourceUrl: 'https://egazette.gov.in/SO2291E.pdf',
      status: 'IN_FORCE',
      isMandatory: true,
      notes: 'General purpose lighting luminaires',
    },
  ],
  documentation: [
    {
      id: 'doc-1',
      schemeId: 'scheme-isi-id',
      category: 'Legal & Organization',
      documentName: 'Proof of Manufacturing Premises & Factory Registration',
      requiredStatus: 'REQUIRED',
      reason: 'Statutory proof of manufacturing premise required for factory inspection',
      source: 'BIS (Conformity Assessment) Regulations, 2018',
      notes: 'Must clearly show factory address',
      rank: 1,
    },
    {
      id: 'doc-2',
      schemeId: 'scheme-isi-id',
      category: 'Technical Specifications',
      documentName: 'Complete Bill of Materials (BOM) & Component Specifications',
      requiredStatus: 'REQUIRED',
      reason: 'Itemized list of critical electrical and mechanical components',
      source: 'Product Manual: PM/10322-5-1/1',
      notes: 'Must include part numbers and safety ratings',
      rank: 2,
    },
  ],
  applicationRequirements: [
    {
      id: 'app-req-1',
      schemeId: 'scheme-isi-id',
      formName: 'Form-I (Application for Grant of Licence to use the Standard Mark)',
      formPurpose: 'Official statutory application for grant of ISI Mark license',
      applicableScheme: 'Scheme-I (ISI Mark Certification)',
      source: 'BIS (Conformity Assessment) Regulations, 2018 - Schedule II',
      officialUrl: 'https://www.manakonline.in',
      rank: 1,
    },
  ],
  fees: [
    {
      id: 'fee-1',
      schemeId: 'scheme-isi-id',
      feeType: 'APPLICATION_FEE',
      amount: 1000,
      currency: 'INR',
      status: 'OFFICIAL_FEE',
      source: 'BIS (Conformity Assessment) Regulations, 2018',
      effectiveDate: '2018-06-01',
      notes: 'Non-refundable statutory application fee.',
    },
    {
      id: 'fee-2',
      schemeId: 'scheme-isi-id',
      feeType: 'PROCESSING_FEE',
      amount: 7000,
      currency: 'INR',
      status: 'OFFICIAL_FEE',
      source: 'BIS Fee Schedule',
      effectiveDate: '2020-01-01',
      notes: 'Preliminary inspection fee for domestic units.',
    },
    {
      id: 'fee-3',
      schemeId: 'scheme-isi-id',
      feeType: 'TESTING_FEE',
      amount: null,
      currency: 'INR',
      status: 'VARIABLE',
      source: 'Designated BIS Laboratory',
      effectiveDate: null,
      notes: 'Testing charges vary depending on product test parameters.',
    },
  ],
  readiness: {
    status: 'READY_FOR_DOCUMENT_REVIEW',
    score: 85,
    summary: 'Candidate certification scheme and statutory checklist established. Ready for document dossier compilation.',
    blockers: [],
    recommendations: [
      'Prepare 2 required statutory documents according to the checklist.',
      'Review candidate scheme recommendations and confirm applicability.',
    ],
  },
  sources: [
    {
      title: 'BIS Know Your Standard — IS 10322',
      url: 'https://www.services.bis.gov.in/standards/is10322',
      authorityLevel: 'AUTHORITATIVE',
      sourceType: 'BIS_OFFICIAL',
    },
  ],
};

const renderCertificationPage = () => {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <ProductCertificationPage />
      </MemoryRouter>
    </ToastProvider>
  );
};

describe('Phase 7 — Frontend Certification Intelligence Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ProductCertificationPage header, readiness banner, and automatically loads certification analysis', async () => {
    vi.mocked(certificationService.analyzeProduct).mockResolvedValueOnce(mockCertificationAnalysis);

    renderCertificationPage();

    // Verify candidate scheme card rendering
    expect(await screen.findByText('Scheme-I (ISI Mark Certification Scheme)')).toBeDefined();
    expect(screen.getByText(/BIS Certification Schemes & Conformity Intelligence/i)).toBeDefined();
    expect(screen.getByText(/Statutory Decision-Support Notice/i)).toBeDefined();
    expect(screen.getByText('Relevant Scheme')).toBeDefined();
    expect(screen.getByText('95% Confidence')).toBeDefined();
    expect(screen.getByText(/Direct conformity assessment mapping established/i)).toBeDefined();
    expect(screen.getByText('Ready for Document Review')).toBeDefined();
    expect(screen.getByText('Readiness Score: 85%')).toBeDefined();
  });

  it('renders statutory documentation checklist with required statuses', async () => {
    vi.mocked(certificationService.analyzeProduct).mockResolvedValueOnce(mockCertificationAnalysis);

    renderCertificationPage();

    expect(await screen.findByText('Statutory Documentation & Dossier Checklist')).toBeDefined();
    expect(screen.getByText('Proof of Manufacturing Premises & Factory Registration')).toBeDefined();
    expect(screen.getByText('Complete Bill of Materials (BOM) & Component Specifications')).toBeDefined();
    const mandatoryBadges = screen.getAllByText('Mandatory');
    expect(mandatoryBadges.length).toBeGreaterThanOrEqual(2);
  });

  it('renders fee estimation breakdown with published and variable statuses', async () => {
    vi.mocked(certificationService.analyzeProduct).mockResolvedValueOnce(mockCertificationAnalysis);

    renderCertificationPage();

    expect(await screen.findByText('Statutory & Estimated Fees')).toBeDefined();
    expect(screen.getByText('₹1,000')).toBeDefined();
    expect(screen.getByText('₹7,000')).toBeDefined();
    expect(screen.getByText('Variable (Prescribed by Lab/STI)')).toBeDefined();
    expect(screen.getAllByText('Officially Published').length).toBeGreaterThanOrEqual(1);
  });

  it('renders mandatory Quality Control Order (QCO) gazette information box', async () => {
    vi.mocked(certificationService.analyzeProduct).mockResolvedValueOnce(mockCertificationAnalysis);

    renderCertificationPage();

    expect(await screen.findByText('Quality Control Orders (QCO)')).toBeDefined();
    expect(screen.getByText('S.O. 2291(E)')).toBeDefined();
    expect(screen.getByText('Mandatory QCO')).toBeDefined();
  });

  it('submits user confirmation review when user clicks "Confirm Relevant"', async () => {
    vi.mocked(certificationService.analyzeProduct).mockResolvedValueOnce(mockCertificationAnalysis);
    vi.mocked(certificationService.saveSchemeReview).mockResolvedValueOnce({
      id: 'rev-1',
      productId: 'prod-uuid-1234',
      schemeId: 'scheme-isi-id',
      decision: 'CONFIRMED',
      note: null,
      createdAt: '2026-09-25T08:00:00.000Z',
      updatedAt: '2026-09-25T08:00:00.000Z',
    });

    renderCertificationPage();

    expect(await screen.findByText('Scheme-I (ISI Mark Certification Scheme)')).toBeDefined();
    const confirmButtons = screen.getAllByRole('button', { name: /confirm relevant/i });
    fireEvent.click(confirmButtons[0]);

    await waitFor(() => {
      expect(certificationService.saveSchemeReview).toHaveBeenCalledWith(
        'prod-uuid-1234',
        expect.objectContaining({
          schemeId: 'scheme-isi-id',
          decision: 'CONFIRMED',
        })
      );
    });
  });

  it('triggers force refresh when "Re-Analyze Certification" button is clicked', async () => {
    vi.mocked(certificationService.analyzeProduct).mockResolvedValue(mockCertificationAnalysis);

    renderCertificationPage();

    const reanalyzeBtn = await screen.findByRole('button', { name: /re-analyze certification/i });
    fireEvent.click(reanalyzeBtn);

    await waitFor(() => {
      expect(certificationService.analyzeProduct).toHaveBeenCalledWith('prod-uuid-1234', true);
    });
  });
});
