import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '@/components/ui/Toast';
import { ProductStandardsPage } from '@/pages/product/ProductStandardsPage';
import { standardService, productIntelligenceService } from '@/services/api';
import type {
  HybridSearchResponse,
  StandardDetailResponse,
  ProductStandardAnalysisResponse,
} from '@bis/shared';

// Mock Services
vi.mock('@/services/api/standard.service', () => ({
  standardService: {
    searchStandards: vi.fn(),
    getStandardById: vi.fn(),
    getStandardVersions: vi.fn(),
    getStandardAmendments: vi.fn(),
    getStandardQCOs: vi.fn(),
    getStandardManuals: vi.fn(),
    getSources: vi.fn(),
    getIngestionRuns: vi.fn(),
    getRagContext: vi.fn(),
    reindexEmbeddings: vi.fn(),
    getEmbeddingStatus: vi.fn(),
  },
}));

vi.mock('@/services/api/product-intelligence.service', () => ({
  productIntelligenceService: {
    analyzeProduct: vi.fn(),
    getLatestAnalysis: vi.fn(),
    saveProductReview: vi.fn(),
    getProductReviews: vi.fn(),
    getProductAttributes: vi.fn(),
    upsertProductAttributes: vi.fn(),
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
    },
    loading: false,
    error: null,
    refreshProduct: vi.fn(),
    updateProductState: vi.fn(),
  }),
}));

const mockAnalysisResponse: ProductStandardAnalysisResponse = {
  analysisId: 'analysis-uuid-1',
  productId: 'prod-uuid-1234',
  status: 'COMPLETED',
  analysisVersion: '1.0.0',
  inputHash: 'abcdef1234567890',
  totalCandidates: 2,
  generatedAt: '2026-09-24T12:00:00.000Z',
  fromCache: false,
  productProfile: {
    name: 'Smart LED Luminaire 50W',
    category: 'Electrical Equipment & Luminaires',
    intendedUse: 'Outdoor street and municipal lighting fixture',
    attributes: {},
  },
  candidateStandards: [
    {
      id: 'match-1',
      standardId: 'std-10322-id',
      isNumber: 'IS 10322 (Part 5/Sec 1) : 2012',
      canonicalNumber: 'IS 10322-5-1',
      title: 'Luminaires - Part 5: Particular Requirements - Section 1: General Purpose Luminaires',
      shortTitle: 'General Purpose Luminaires',
      scope: 'Requirements for general purpose luminaires on supply voltages not exceeding 1000 V.',
      status: 'CURRENT',
      sector: 'Electrotechnical',
      department: 'Lamps and Related Equipment (ETD 23)',
      currentEdition: 'First Revision (2012)',
      relevanceScore: 0.94,
      matchLevel: 'HIGHLY_RELEVANT',
      rank: 1,
      reasons: [
        'Standard title specifies matching product terminology: luminaire, lighting',
        'Product intended use aligns with standard scope: municipal, lighting',
        'Mandatory Quality Control Order published: Electrical Appliances QCO (Order: S.O. 2291(E))',
      ],
      evidence: {
        qco: {
          name: 'Electrical Appliances (Quality Control) Order',
          orderNumber: 'S.O. 2291(E)',
          ministry: 'Ministry of Heavy Industries',
        },
      },
      sourceDocument: {
        title: 'BIS Know Your Standard — IS 10322 (Part 5/Sec 1)',
        url: 'https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails/IS10322_5_1',
        authorityLevel: 'AUTHORITATIVE',
      },
      userReview: null,
    },
    {
      id: 'match-2',
      standardId: 'std-1293-id',
      isNumber: 'IS 1293 : 2019',
      canonicalNumber: 'IS 1293',
      title: 'Plugs and Socket-Outlets of Related Voltages Up to and Including 250 V',
      shortTitle: 'Plugs and Socket-Outlets',
      scope: 'Specification for plugs and socket-outlets for domestic usage.',
      status: 'CURRENT',
      sector: 'Electrotechnical',
      department: 'Electrical Installation (ETD 20)',
      currentEdition: 'Fourth Revision (2019)',
      relevanceScore: 0.62,
      matchLevel: 'RELEVANT',
      rank: 2,
      reasons: [
        'Sector classification alignment with Electrotechnical',
      ],
      sourceDocument: {
        title: 'BIS Know Your Standard — IS 1293 : 2019',
        url: 'https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails/IS1293',
        authorityLevel: 'AUTHORITATIVE',
      },
      userReview: null,
    },
  ],
};

const mockHybridSearchResponse: HybridSearchResponse = {
  results: [
    {
      id: 'std-10322-id',
      isNumber: 'IS 10322 (Part 5/Sec 1) : 2012',
      canonicalNumber: 'IS 10322-5-1',
      title: 'Luminaires - Part 5: Particular Requirements - Section 1: General Purpose Luminaires',
      shortTitle: 'General Purpose Luminaires',
      scope: 'Requirements for general purpose luminaires on supply voltages not exceeding 1000 V.',
      status: 'CURRENT',
      sector: 'Electrotechnical',
      department: 'Lamps and Related Equipment (ETD 23)',
      currentEdition: 'First Revision (2012)',
      publicationDate: '2012-07-15T00:00:00.000Z',
      relevanceScore: 0.94,
      lexicalScore: 0.90,
      semanticScore: 0.97,
      searchMode: 'hybrid',
      matchReason: 'Hybrid match across keywords and semantic scope',
      matchedChunks: [
        {
          chunkId: 'chk-1',
          chunkType: 'STANDARD_SCOPE',
          sectionTitle: 'Standard Scope & Specifications',
          contentSnippet: 'Requirements for general purpose luminaires and lighting fixtures...',
          score: 0.97,
        },
      ],
      sourceDocument: {
        id: 'src-1',
        title: 'BIS Know Your Standard — IS 10322 (Part 5/Sec 1)',
        url: 'https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails/IS10322_5_1',
        sourceType: 'BIS_OFFICIAL',
        authorityLevel: 'AUTHORITATIVE',
        retrievedAt: '2026-09-24T10:00:00.000Z',
        status: 'ACTIVE',
        createdAt: '2026-09-24T10:00:00.000Z',
        updatedAt: '2026-09-24T10:00:00.000Z',
      },
    },
  ],
  pagination: {
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  },
  meta: {
    query: 'luminaires',
    mode: 'hybrid',
  },
};

const mockStandardDetail: StandardDetailResponse = {
  id: 'std-10322-id',
  isNumber: 'IS 10322 (Part 5/Sec 1) : 2012',
  canonicalNumber: 'IS 10322-5-1',
  title: 'Luminaires - Part 5: Particular Requirements - Section 1: General Purpose Luminaires',
  shortTitle: 'General Purpose Luminaires',
  scope: 'Requirements for general purpose luminaires on supply voltages not exceeding 1000 V.',
  status: 'CURRENT',
  sector: 'Electrotechnical',
  department: 'Lamps and Related Equipment (ETD 23)',
  language: 'English',
  currentEdition: 'First Revision (2012)',
  publicationDate: '2012-07-15T00:00:00.000Z',
  createdAt: '2026-09-24T10:00:00.000Z',
  updatedAt: '2026-09-24T10:00:00.000Z',
  sourceDocument: {
    id: 'src-1',
    title: 'BIS Know Your Standard — IS 10322 (Part 5/Sec 1)',
    url: 'https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails/IS10322_5_1',
    sourceType: 'BIS_OFFICIAL',
    authorityLevel: 'AUTHORITATIVE',
    retrievedAt: '2026-09-24T10:00:00.000Z',
    status: 'ACTIVE',
    createdAt: '2026-09-24T10:00:00.000Z',
    updatedAt: '2026-09-24T10:00:00.000Z',
  },
  versions: [],
  amendments: [],
  qcoMappings: [],
  schemeMappings: [],
  productManuals: [],
};

const renderStandardsPage = () => {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <ProductStandardsPage />
      </MemoryRouter>
    </ToastProvider>
  );
};

describe('Phase 6 — Frontend Standards Intelligence & Candidate Matching Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ProductStandardsPage header, tabs, and automatically loads standards intelligence analysis', async () => {
    vi.mocked(productIntelligenceService.analyzeProduct).mockResolvedValueOnce(mockAnalysisResponse);

    renderStandardsPage();

    expect(screen.getByText(/Indian Standards \(IS\) Intelligence & Knowledge Base/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /standards intelligence/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /repository explorer/i })).toBeDefined();

    // Verify candidate standards rendering
    expect(await screen.findByText('IS 10322 (Part 5/Sec 1) : 2012')).toBeDefined();
    expect(screen.getByText('Highly Relevant Candidate')).toBeDefined();
    expect(screen.getByText('94% Match')).toBeDefined();
    expect(screen.getByText(/Standard title specifies matching product terminology/i)).toBeDefined();
    expect(screen.getByText(/Quality Control Order: Electrical Appliances/i)).toBeDefined();
  });

  it('submits user confirmation review when user clicks "Confirm Relevant"', async () => {
    vi.mocked(productIntelligenceService.analyzeProduct).mockResolvedValueOnce(mockAnalysisResponse);
    vi.mocked(productIntelligenceService.saveProductReview).mockResolvedValueOnce({
      id: 'rev-1',
      productId: 'prod-uuid-1234',
      standardId: 'std-10322-id',
      decision: 'CONFIRMED',
      note: null,
      createdAt: '2026-09-24T12:00:00.000Z',
      updatedAt: '2026-09-24T12:00:00.000Z',
    });

    renderStandardsPage();

    expect(await screen.findByText('IS 10322 (Part 5/Sec 1) : 2012')).toBeDefined();
    const confirmButtons = screen.getAllByRole('button', { name: /confirm relevant/i });
    fireEvent.click(confirmButtons[0]);

    await waitFor(() => {
      expect(productIntelligenceService.saveProductReview).toHaveBeenCalledWith(
        'prod-uuid-1234',
        expect.objectContaining({
          standardId: 'std-10322-id',
          decision: 'CONFIRMED',
        })
      );
    });
  });

  it('triggers force refresh when "Re-Analyze Product" button is clicked', async () => {
    vi.mocked(productIntelligenceService.analyzeProduct).mockResolvedValue(mockAnalysisResponse);

    renderStandardsPage();

    const reanalyzeBtn = await screen.findByRole('button', { name: /re-analyze product/i });
    fireEvent.click(reanalyzeBtn);

    await waitFor(() => {
      expect(productIntelligenceService.analyzeProduct).toHaveBeenCalledWith('prod-uuid-1234', true);
    });
  });

  it('switches to Repository Explorer tab and allows search and filtering', async () => {
    vi.mocked(productIntelligenceService.analyzeProduct).mockResolvedValueOnce(mockAnalysisResponse);
    vi.mocked(standardService.searchStandards).mockResolvedValueOnce(mockHybridSearchResponse);

    renderStandardsPage();

    const explorerTab = screen.getByRole('button', { name: /repository explorer/i });
    fireEvent.click(explorerTab);

    expect(await screen.findByPlaceholderText(/Search by IS number/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /hybrid/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /keyword/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /semantic/i })).toBeDefined();
  });

  it('opens StandardDetailModal from specifications link', async () => {
    vi.mocked(productIntelligenceService.analyzeProduct).mockResolvedValueOnce(mockAnalysisResponse);
    vi.mocked(standardService.getStandardById).mockResolvedValueOnce(mockStandardDetail);

    renderStandardsPage();

    const specButtons = await screen.findAllByRole('button', { name: /full specifications/i });
    fireEvent.click(specButtons[0]);

    await waitFor(() => {
      expect(standardService.getStandardById).toHaveBeenCalledWith('std-10322-id');
    });

    expect(await screen.findByText('Overview & Scope')).toBeDefined();
  });
});
