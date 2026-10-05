import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { mapCategoryToBisSector, getCompatibleBisSectors } from '../src/services/intelligence/category-sector-mapper.js';
import { tokenizeSearchQuery } from '../src/services/intelligence/normalizer.js';
import { searchStandards } from '../src/services/standard.service.js';
import { executeVectorSearch } from '../src/services/rag/vectorSearch.js';
import { executeHybridSearch } from '../src/services/rag/hybridSearch.js';
import { buildRagContext } from '../src/services/rag/ragContextBuilder.js';
import { getEmbeddingProvider, setEmbeddingProvider } from '../src/services/ai/embedding/factory.js';
import { MockEmbeddingProvider } from '../src/services/ai/embedding/mock.provider.js';
import { AssistantService } from '../src/services/assistant.service.js';
import { normalizeIsNumber } from '../src/services/ingestion/normalizer.js';
import { VERIFIED_SEED_STANDARDS } from '../src/data/seedStandards.js';

// ── Mock Environment ──────────────────────────────────────────────────────────
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test_db');
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('LOG_LEVEL', 'error');
vi.stubEnv('FRONTEND_URL', 'http://localhost:5173');
vi.stubEnv('JWT_SECRET', 'test-jwt-secret-must-be-at-least-32-characters-long!');

// ── In-Memory Database Store ──────────────────────────────────────────────────
let mockStandards: any[] = [];
let mockKnowledgeChunks: any[] = [];
let mockProducts: any[] = [];
let mockProductAttributes: any[] = [];
let mockProductStandardAnalyses: any[] = [];
let mockProductCertificationAnalyses: any[] = [];
let mockProductTestingAnalyses: any[] = [];
let mockComplianceAssessments: any[] = [];
let mockTestingRequirements: any[] = [];
let mockAiConversations: any[] = [];
let mockAiMessages: any[] = [];
let mockAssistantLogs: any[] = [];
let mockAuditLogs: any[] = [];

// Helper to match nested Prisma where conditions in-memory
function matchesCondition(item: any, cond: any): boolean {
  if (!cond) return true;
  for (const [key, val] of Object.entries(cond)) {
    if (key === 'AND' && Array.isArray(val)) {
      if (!val.every((c) => matchesCondition(item, c))) return false;
    } else if (key === 'OR' && Array.isArray(val)) {
      if (!val.some((c) => matchesCondition(item, c))) return false;
    } else if (key === 'NOT') {
      if (matchesCondition(item, val)) return false;
    } else if (val && typeof val === 'object' && 'contains' in val) {
      const fieldVal = String(item[key] || '').toLowerCase();
      const searchVal = String((val as any).contains || '').toLowerCase();
      if (!fieldVal.includes(searchVal)) return false;
    } else if (val && typeof val === 'object' && 'in' in val) {
      const inList = (val as any).in as any[];
      if (!inList.includes(item[key])) return false;
    } else if (val && typeof val === 'object' && 'equals' in val) {
      if (item[key] !== (val as any).equals) return false;
    } else if (val && typeof val === 'object' && 'not' in val) {
      if (item[key] === (val as any).not) return false;
    } else {
      if (item[key] !== val) return false;
    }
  }
  return true;
}

vi.mock('../src/db/client.js', () => {
  return {
    checkDatabaseHealth: vi.fn().mockResolvedValue({ connected: true, latencyMs: 1 }),
    disconnectDatabase: vi.fn().mockResolvedValue(undefined),
    prisma: {
      standard: {
        findUnique: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          return mockStandards.find((s) => s.id === where.id) || null;
        }),
        findFirst: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          return mockStandards.find((s) => matchesCondition(s, where)) || null;
        }),
        findMany: vi.fn().mockImplementation(async ({ where, skip = 0, take }: { where?: any; skip?: number; take?: number } = {}) => {
          const filtered = mockStandards.filter((s) => matchesCondition(s, where));
          if (take !== undefined) {
            return filtered.slice(skip, skip + take);
          }
          return filtered.slice(skip);
        }),
        count: vi.fn().mockImplementation(async ({ where }: { where?: any } = {}) => {
          return mockStandards.filter((s) => matchesCondition(s, where)).length;
        }),
      },
      knowledgeChunk: {
        findMany: vi.fn().mockImplementation(async ({ where, take }: { where?: any; take?: number } = {}) => {
          const filtered = mockKnowledgeChunks
            .filter((c) => {
              if (where?.embeddingStatus && c.embeddingStatus !== where.embeddingStatus) return false;
              if (where?.standardId?.not === null && !c.standardId) return false;
              if (where?.standard) {
                const std = mockStandards.find((s) => s.id === c.standardId);
                if (!std) return false;
                if (!matchesCondition(std, where.standard)) return false;
              }
              return true;
            })
            .map((c) => {
              const std = mockStandards.find((s) => s.id === c.standardId);
              return {
                ...c,
                standard: std || null,
                sourceDocument: std?.sourceDocument || null,
              };
            });
          return take ? filtered.slice(0, take) : filtered;
        }),
        count: vi.fn().mockImplementation(async ({ where }: { where?: any } = {}) => {
          return mockKnowledgeChunks.filter((c) => matchesCondition(c, where)).length;
        }),
        findFirst: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          return mockKnowledgeChunks.find((c) => matchesCondition(c, where)) || null;
        }),
      },
      product: {
        findFirst: vi.fn().mockImplementation(async ({ where, include }: { where: any; include?: any }) => {
          const p = mockProducts.find((item) => matchesCondition(item, where));
          if (!p) return null;
          const res = { ...p };
          if (include?.attributes) {
            res.attributes = mockProductAttributes.filter((a) => a.productId === p.id);
          }
          return res;
        }),
      },
      productAttribute: {
        findMany: vi.fn().mockImplementation(async ({ where }: { where?: any } = {}) => {
          return mockProductAttributes.filter((a) => matchesCondition(a, where));
        }),
      },
      productStandardAnalysis: {
        findFirst: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          return mockProductStandardAnalyses.find((a) => matchesCondition(a, where)) || null;
        }),
      },
      productCertificationAnalysis: {
        findFirst: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          return mockProductCertificationAnalyses.find((a) => matchesCondition(a, where)) || null;
        }),
      },
      productTestingAnalysis: {
        findFirst: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          return mockProductTestingAnalyses.find((a) => matchesCondition(a, where)) || null;
        }),
      },
      complianceAssessment: {
        findFirst: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          return mockComplianceAssessments.find((a) => matchesCondition(a, where)) || null;
        }),
      },
      complianceJourney: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      testingRequirement: {
        findMany: vi.fn().mockImplementation(async ({ where }: { where?: any } = {}) => {
          return mockTestingRequirements.filter((t) => matchesCondition(t, where));
        }),
      },
      aiConversation: {
        findFirst: vi.fn().mockImplementation(async ({ where, include }: { where: any; include?: any }) => {
          const conv = mockAiConversations.find((c) => matchesCondition(c, where));
          if (!conv) return null;
          const res = { ...conv };
          if (include?.product) {
            res.product = mockProducts.find((p) => p.id === conv.productId) || null;
          }
          if (include?.messages) {
            res.messages = mockAiMessages.filter((m) => m.conversationId === conv.id);
          }
          return res;
        }),
        create: vi.fn().mockImplementation(async ({ data }: { data: any }) => {
          const item = {
            id: `conv-${Date.now()}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockAiConversations.push(item);
          return item;
        }),
        update: vi.fn().mockImplementation(async ({ where, data }: { where: any; data: any }) => {
          const item = mockAiConversations.find((c) => c.id === where.id);
          if (item) Object.assign(item, data);
          return item;
        }),
      },
      aiMessage: {
        create: vi.fn().mockImplementation(async ({ data }: { data: any }) => {
          const item = {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            ...data,
            createdAt: new Date(),
          };
          mockAiMessages.push(item);
          return item;
        }),
        findMany: vi.fn().mockImplementation(async ({ where }: { where?: any } = {}) => {
          return mockAiMessages.filter((m) => matchesCondition(m, where));
        }),
      },
      assistantQueryLog: {
        create: vi.fn().mockImplementation(async ({ data }: { data: any }) => {
          const item = { id: `log-${Date.now()}`, ...data, createdAt: new Date() };
          mockAssistantLogs.push(item);
          return item;
        }),
        update: vi.fn().mockImplementation(async ({ where, data }: { where: any; data: any }) => {
          const item = mockAssistantLogs.find((l) => l.id === where.id);
          if (item) Object.assign(item, data);
          return item;
        }),
      },
      auditLog: {
        create: vi.fn().mockImplementation(async ({ data }: { data: any }) => {
          const item = { id: `audit-${Date.now()}`, ...data, createdAt: new Date() };
          mockAuditLogs.push(item);
          return item;
        }),
      },
    },
  };
});

describe('Phase 1 — BIS Intelligence Foundation Regression Test Suite', () => {
  const originalEnv = { ...process.env };

  beforeAll(() => {
    // Populate mock standards with real verified seed dataset
    mockStandards = VERIFIED_SEED_STANDARDS.map((s, idx) => ({
      id: `std-${idx + 1}`,
      isNumber: s.isNumber,
      canonicalNumber: normalizeIsNumber(s.isNumber),
      title: s.title,
      shortTitle: s.shortTitle || null,
      scope: s.scope,
      status: s.status,
      sector: s.sector,
      department: s.department,
      language: s.language || 'English',
      currentEdition: s.currentEdition,
      publicationDate: s.publicationDate,
      sourceDocumentId: `doc-${idx + 1}`,
      sourceDocument: {
        id: `doc-${idx + 1}`,
        title: s.sourceDocument.title,
        url: s.sourceDocument.url,
        sourceType: s.sourceDocument.sourceType,
        authorityLevel: s.sourceDocument.authorityLevel,
        documentType: s.sourceDocument.documentType,
        publishedAt: s.sourceDocument.publishedAt,
        versionLabel: s.sourceDocument.versionLabel,
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  });

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.AI_PROVIDER = 'mock';
    setEmbeddingProvider(null);
    mockKnowledgeChunks = [];
    mockProducts = [];
    mockProductAttributes = [];
    mockProductStandardAnalyses = [];
    mockProductCertificationAnalyses = [];
    mockProductTestingAnalyses = [];
    mockComplianceAssessments = [];
    mockTestingRequirements = [];
    mockAiConversations = [];
    mockAiMessages = [];
    mockAssistantLogs = [];
    mockAuditLogs = [];
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    setEmbeddingProvider(null);
    vi.clearAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  //  A. Product Category → Sector Normalization
  // ───────────────────────────────────────────────────────────────────────────
  describe('A. Product Category → Sector Normalization', () => {
    it('should correctly normalize "Electrical Equipment & Luminaires" to "Electrotechnical"', () => {
      const sector = mapCategoryToBisSector('Electrical Equipment & Luminaires');
      expect(sector).toBe('Electrotechnical');
    });

    it('should map various industry categories to official BIS Technical Divisions', () => {
      expect(mapCategoryToBisSector('Electronics & IT Goods')).toBe('Electronics and Information Technology');
      expect(mapCategoryToBisSector('Chemicals & Petrochemicals')).toBe('Chemical');
      expect(mapCategoryToBisSector('Food Products & Beverages')).toBe('Food and Agriculture');
      expect(mapCategoryToBisSector('Civil Engineering & Construction Materials')).toBe('Civil Engineering');
      expect(mapCategoryToBisSector('Automotive & Transport')).toBe('Transport Engineering');
      expect(mapCategoryToBisSector('Textiles & Garments')).toBe('Textile');
      expect(mapCategoryToBisSector('Medical Devices & Hospital Equipment')).toBe('Medical Equipment and Hospital Planning');
      expect(mapCategoryToBisSector('Mechanical & Machinery')).toBe('Mechanical Engineering');
      expect(mapCategoryToBisSector('Metallurgy & Metals')).toBe('Metallurgical Engineering');
    });

    it('should provide compatible sectors including primary and cross-sector divisions', () => {
      const compatible = getCompatibleBisSectors('Electrical Equipment & Luminaires');
      expect(compatible).toContain('Electrotechnical');
      expect(compatible).toContain('Electronics and Information Technology');
    });

    it('should return null or empty array gracefully for unrecognized categories without throwing', () => {
      expect(mapCategoryToBisSector('Fictional Spacecraft Hardware 9000')).toBeNull();
      expect(getCompatibleBisSectors('Fictional Spacecraft Hardware 9000')).toEqual([]);
      expect(mapCategoryToBisSector('')).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  //  B. Tokenized Standard Search
  // ───────────────────────────────────────────────────────────────────────────
  describe('B. Tokenized Standard Search', () => {
    it('should normalize lowercase, whitespace, and strip punctuation', () => {
      const tokenized = tokenizeSearchQuery('  LED, Light-Fitting (Indoor)!! ');
      expect(tokenized.cleanText).toContain('led');
      expect(tokenized.cleanText).toContain('light fitting');
      expect(tokenized.primaryTokens).toContain('led');
      expect(tokenized.primaryTokens).toContain('light');
      expect(tokenized.primaryTokens).toContain('fitting');
    });

    it('should extract explicit IS number from query string', () => {
      const tokenized = tokenizeSearchQuery('What are the clauses in IS 10322 (Part 5)?');
      expect(tokenized.explicitIsNumber).toContain('10322');
    });

    it('should expand domain synonyms for lighting and electrical equipment', () => {
      const tokenized = tokenizeSearchQuery('LED Light Fitting');
      // Should include expanded synonyms: luminaire, luminaires, fixture, lighting, lamp
      expect(tokenized.expandedTokens).toContain('luminaire');
      expect(tokenized.expandedTokens).toContain('luminaires');
      expect(tokenized.expandedTokens).toContain('fixture');
    });

    it('should filter stop words from primary tokens', () => {
      const tokenized = tokenizeSearchQuery('luminaires for indoor and outdoor use with supply voltage');
      expect(tokenized.primaryTokens).not.toContain('for');
      expect(tokenized.primaryTokens).not.toContain('and');
      expect(tokenized.primaryTokens).not.toContain('with');
      expect(tokenized.primaryTokens).toContain('luminaires');
      expect(tokenized.primaryTokens).toContain('indoor');
      expect(tokenized.primaryTokens).toContain('outdoor');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  //  C. LED Light Fitting Candidate Retrieval
  // ───────────────────────────────────────────────────────────────────────────
  describe('C. LED Light Fitting Candidate Retrieval', () => {
    it('should retrieve IS 10322 and IS 15885 when searching for "LED Light Fitting"', async () => {
      const res = await searchStandards({
        q: 'LED Light Fitting',
        sector: 'Electrotechnical',
      });

      expect(res.standards.length).toBeGreaterThan(0);
      const isNumbers = res.standards.map((s) => s.isNumber);
      expect(isNumbers.some((n) => n.includes('10322'))).toBe(true);
      expect(isNumbers.some((n) => n.includes('15885'))).toBe(true);

      // Verify that unrelated standards like Portland Cement (IS 269) are not returned
      expect(isNumbers.some((n) => n.includes('269'))).toBe(false);
    });

    it('should retrieve relevant standards when product category is passed as sector filter', async () => {
      // The user passes category "Electrical Equipment & Luminaires" instead of raw "Electrotechnical"
      const res = await searchStandards({
        q: 'LED Light Fitting',
        sector: 'Electrical Equipment & Luminaires',
      });

      expect(res.standards.length).toBeGreaterThan(0);
      const isNumbers = res.standards.map((s) => s.isNumber);
      expect(isNumbers.some((n) => n.includes('10322'))).toBe(true);
    });

    it('should fallback and retrieve standards even if sector filter is mismatched', async () => {
      // Intentionally pass a mismatched sector to test the safety fallback
      const res = await searchStandards({
        q: 'General Purpose Luminaires',
        sector: 'Civil Engineering',
      });

      expect(res.standards.length).toBeGreaterThan(0);
      expect(res.standards[0].isNumber).toContain('10322');
    });

    it('should order results by relevance score descending', async () => {
      const res = await searchStandards({
        q: 'Luminaires General Purpose',
      });

      expect(res.standards.length).toBeGreaterThan(0);
      expect(res.standards[0].isNumber).toContain('10322');
      if (res.standards.length > 1) {
        expect(res.standards[0].relevanceScore).toBeGreaterThanOrEqual(res.standards[1].relevanceScore || 0);
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  //  D. Empty Vector Database Behavior
  // ───────────────────────────────────────────────────────────────────────────
  describe('D. Empty Vector Database Behavior', () => {
    it('should handle executeVectorSearch gracefully with 0 chunks and return empty array', async () => {
      mockKnowledgeChunks = [];
      const chunks = await executeVectorSearch({
        query: 'LED Light Fitting',
        sector: 'Electrotechnical',
      });
      expect(Array.isArray(chunks)).toBe(true);
      expect(chunks.length).toBe(0);
    });

    it('should gracefully degrade in executeHybridSearch when vector database has 0 embeddings', async () => {
      mockKnowledgeChunks = [];
      const res = await executeHybridSearch({
        q: 'LED Light Fitting',
        mode: 'hybrid',
        sector: 'Electrotechnical',
      });

      expect(res.results.length).toBeGreaterThan(0);
      expect(res.results.some((r) => r.isNumber.includes('10322'))).toBe(true);
      // All results should have empty matchedChunks because vector store has 0 embeddings
      res.results.forEach((r) => {
        expect(r.matchedChunks).toEqual([]);
      });
    });

    it('should build structured RAG context from keyword search when vector store is empty', async () => {
      mockKnowledgeChunks = [];
      const ragCtx = await buildRagContext({
        query: 'LED Light Fitting',
        filters: { sector: 'Electrotechnical' },
      });

      expect(ragCtx.results.length).toBeGreaterThan(0);
      expect(ragCtx.contextText).toContain('IS 10322');
      expect(ragCtx.contextText).toContain('APPLICABLE INDIAN STANDARDS');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  //  E. RAG Context Generation
  // ───────────────────────────────────────────────────────────────────────────
  describe('E. RAG Context Generation', () => {
    it('should format standard number, title, sector, scope, and source citation in context text', async () => {
      const ragCtx = await buildRagContext({
        query: 'General Purpose Luminaires',
        filters: { sector: 'Electrotechnical' },
      });

      expect(ragCtx.results.length).toBeGreaterThan(0);
      expect(ragCtx.contextText).toContain('IS 10322 (Part 5/Sec 1) : 2012');
      expect(ragCtx.contextText).toContain('Luminaires - Part 5: Particular Requirements');
      expect(ragCtx.contextText).toContain('Electrotechnical');
      expect(ragCtx.citations.length).toBeGreaterThan(0);
      expect(ragCtx.citations[0].sourceUrl).toContain('services.bis.gov.in');
    });

    it('should trigger sector fallback when sector yields 0 results and still return standards', async () => {
      const ragCtx = await buildRagContext({
        query: 'Luminaires',
        filters: { sector: 'NonExistentSector' },
      });

      expect(ragCtx.results.length).toBeGreaterThan(0);
      expect(ragCtx.results.some((r) => r.isNumber.includes('10322'))).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  //  F. AI Provider Missing-Key Behavior
  // ───────────────────────────────────────────────────────────────────────────
  describe('F. AI Provider Missing-Key Behavior', () => {
    it('should fail fast in getEmbeddingProvider when AI_PROVIDER is openai and API key is missing', () => {
      process.env.AI_PROVIDER = 'openai';
      delete process.env.OPENAI_API_KEY;
      delete process.env.AI_API_KEY;

      expect(() => getEmbeddingProvider()).toThrow('OpenAI API key is missing. Set OPENAI_API_KEY or AI_API_KEY in environment.');
    });

    it('should fail fast in getEmbeddingProvider when AI_PROVIDER is gemini and API key is missing', () => {
      process.env.AI_PROVIDER = 'gemini';
      delete process.env.GEMINI_API_KEY;
      delete process.env.AI_API_KEY;

      expect(() => getEmbeddingProvider()).toThrow('Gemini API key is missing. Set GEMINI_API_KEY or AI_API_KEY in environment.');
    });

    it('should fail fast in AssistantService.generateGroundedAnswer when AI_PROVIDER is openai and key is missing', async () => {
      process.env.AI_PROVIDER = 'openai';
      delete process.env.OPENAI_API_KEY;
      delete process.env.AI_API_KEY;

      await expect(
        AssistantService.generateGroundedAnswer({
          query: 'What standard applies?',
          productName: 'LED Light Fitting',
          productCategory: 'Electrical Equipment & Luminaires',
          ragEvidence: [
            {
              standardId: 'std-1',
              isNumber: 'IS 10322 (Part 5/Sec 1) : 2012',
              title: 'General Purpose Luminaires',
              sector: 'Electrotechnical',
              citation: {
                sourceTitle: 'BIS Official',
                sourceUrl: 'https://services.bis.gov.in',
                authorityLevel: 'AUTHORITATIVE',
              },
              source: {
                title: 'BIS Official',
                url: 'https://services.bis.gov.in',
                authorityLevel: 'AUTHORITATIVE',
              },
            } as any,
          ],
        })
      ).rejects.toThrow('AI provider is configured as "openai", but OPENAI_API_KEY is not set in the environment.');
    });

    it('should succeed cleanly with MockEmbeddingProvider when AI_PROVIDER is mock', () => {
      process.env.AI_PROVIDER = 'mock';
      const provider = getEmbeddingProvider();
      expect(provider).toBeInstanceOf(MockEmbeddingProvider);
      expect(provider.name).toBe('mock');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  //  G. AI Assistant Product-Context Propagation
  // ───────────────────────────────────────────────────────────────────────────
  describe('G. AI Assistant Product-Context Propagation', () => {
    it('should propagate product details, category, mapped sector, specs, and compliance data into the assistant flow', async () => {
      const productId = 'prod-test-101';
      const userId = 'user-test-001';
      const convId = 'conv-test-001';

      mockProducts.push({
        id: productId,
        userId,
        name: 'LED Light Fitting',
        category: 'Electrical Equipment & Luminaires',
        description: 'LED luminaire for commercial office and indoor lighting, operating on 230V AC supply.',
        intendedUse: 'Indoor ceiling illumination in commercial complexes',
        targetMarket: 'Domestic Indian Market',
        manufacturerScale: 'MSME',
        isActive: true,
      });

      mockProductAttributes.push(
        { id: 'attr-1', productId, attributeKey: 'supplyVoltage', attributeValue: '230V AC' },
        { id: 'attr-2', productId, attributeKey: 'wattage', attributeValue: '18W' },
        { id: 'attr-3', productId, attributeKey: 'frequency', attributeValue: '50Hz' }
      );

      mockAiConversations.push({
        id: convId,
        productId,
        userId,
        title: 'LED Light Fitting Compliance Consultation',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await AssistantService.sendAssistantMessage(userId, productId, convId, {
        content: 'Which Indian Standard applies to this product and what documents should I prepare?',
      });

      expect(response).toBeDefined();
      expect(response.message.content).toBeTruthy();
      expect(response.grounded).toBe(true);
      expect(response.citations.length).toBeGreaterThan(0);
      expect(response.citations.some((c) => c.isNumber.includes('10322'))).toBe(true);

      // Verify that the conversation messages were recorded
      expect(mockAiMessages.length).toBe(2);
      const userMsg = mockAiMessages.find((m) => m.role === 'USER');
      const assistantMsg = mockAiMessages.find((m) => m.role === 'ASSISTANT');
      expect(userMsg?.content).toContain('Which Indian Standard applies');
      expect(assistantMsg?.content).toContain('IS 10322');
    });

    it('should fallback to product name RAG query when conversational query contains no standard keywords', async () => {
      const productId = 'prod-test-102';
      const userId = 'user-test-002';
      const convId = 'conv-test-002';

      mockProducts.push({
        id: productId,
        userId,
        name: 'LED Light Fitting',
        category: 'Electrical Equipment & Luminaires',
        description: 'LED light fitting indoor luminaire 230V AC',
        isActive: true,
      });

      mockAiConversations.push({
        id: convId,
        productId,
        userId,
        title: 'Document question',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // User asks a conversational query that has no keywords like "luminaire" or "IS 10322"
      const response = await AssistantService.sendAssistantMessage(userId, productId, convId, {
        content: 'What documents should I upload for my application?',
      });

      expect(response.grounded).toBe(true);
      // Because of the product name fallback, citations should contain the relevant luminaire standard
      expect(response.citations.length).toBeGreaterThan(0);
      expect(response.citations.some((c) => c.isNumber.includes('10322'))).toBe(true);
      expect(response.message.content).toContain('Factory Registration');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  //  H. AI Response Generation
  // ───────────────────────────────────────────────────────────────────────────
  describe('H. AI Response Generation', () => {
    it('should answer actual technical testing questions with test parameters and standards', async () => {
      const answer = await AssistantService.generateGroundedAnswer({
        query: 'What laboratory testing and safety tests are required for this LED light fitting?',
        productName: 'LED Light Fitting',
        productCategory: 'Electrical Equipment & Luminaires',
        productSector: 'Electrotechnical',
        productDescription: 'LED indoor luminaire for 230V AC',
        ragEvidence: [
          {
            standardId: 'std-1',
            isNumber: 'IS 10322 (Part 5/Sec 1) : 2012',
            title: 'Luminaires - General Purpose Luminaires',
            sector: 'Electrotechnical',
            scope: 'Safety and performance requirements for general purpose luminaires',
            citation: {
              sourceTitle: 'BIS Know Your Standard — IS 10322 (Part 5/Sec 1)',
              sourceUrl: 'https://services.bis.gov.in/is10322',
              authorityLevel: 'AUTHORITATIVE',
            },
            source: {
              title: 'BIS Know Your Standard — IS 10322 (Part 5/Sec 1)',
              url: 'https://services.bis.gov.in/is10322',
              authorityLevel: 'AUTHORITATIVE',
            },
          } as any,
        ],
      });

      expect(answer.grounded).toBe(true);
      expect(answer.content).toContain('IS 10322 (Part 5/Sec 1) : 2012');
      expect(answer.content).toContain('Insulation Resistance');
      expect(answer.content).toContain('Electric Strength');
      expect(answer.content).toContain('Testing Protocol');
      expect(answer.citations.length).toBe(1);
    });

    it('should answer documentation questions with detailed checklist and next action', async () => {
      const answer = await AssistantService.generateGroundedAnswer({
        query: 'What documents and certificates do I need to prepare for submission?',
        productName: 'LED Light Fitting',
        productCategory: 'Electrical Equipment & Luminaires',
        productSector: 'Electrotechnical',
        ragEvidence: [
          {
            standardId: 'std-1',
            isNumber: 'IS 10322 (Part 5/Sec 1) : 2012',
            title: 'General Purpose Luminaires',
            sector: 'Electrotechnical',
            citation: {
              sourceTitle: 'BIS Know Your Standard',
              sourceUrl: 'https://services.bis.gov.in/is10322',
              authorityLevel: 'AUTHORITATIVE',
            },
            source: {
              title: 'BIS Know Your Standard',
              url: 'https://services.bis.gov.in/is10322',
              authorityLevel: 'AUTHORITATIVE',
            },
          } as any,
        ],
      });

      expect(answer.grounded).toBe(true);
      expect(answer.content).toContain('Factory Registration');
      expect(answer.content).toContain('Calibration Certificates');
      expect(answer.content).toContain('Document Repository');
    });

    it('should NOT return static refusal template when RAG evidence is present', async () => {
      const answer = await AssistantService.generateGroundedAnswer({
        query: 'Which standard applies?',
        productName: 'LED Light Fitting',
        productCategory: 'Electrical Equipment & Luminaires',
        ragEvidence: [
          {
            standardId: 'std-1',
            isNumber: 'IS 10322 (Part 5/Sec 1) : 2012',
            title: 'General Purpose Luminaires',
            sector: 'Electrotechnical',
            citation: {
              sourceTitle: 'BIS Official',
              sourceUrl: 'https://services.bis.gov.in',
              authorityLevel: 'AUTHORITATIVE',
            },
            source: {
              title: 'BIS Official',
              url: 'https://services.bis.gov.in',
              authorityLevel: 'AUTHORITATIVE',
            },
          } as any,
        ],
      });

      expect(answer.content).not.toContain('No matching official Indian Standards (IS), Quality Control Orders');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  //  I. No Hallucinated Standards
  // ───────────────────────────────────────────────────────────────────────────
  describe('I. No Hallucinated Standards', () => {
    it('should state no standards found when evidence is completely empty without fabricating an IS number', async () => {
      const answer = await AssistantService.generateGroundedAnswer({
        query: 'What standard applies to quantum teleportation laser drive?',
        productName: 'Quantum Teleporter 9000',
        productCategory: 'Fictional Science Tech',
        ragEvidence: [],
      });

      expect(answer.grounded).toBe(false);
      expect(answer.citations.length).toBe(0);
      expect(answer.content).toContain('no matching official Indian Standards');
      expect(answer.content).toContain('Information that cannot be verified against official BIS sources is not generated');

      // Verify no fake IS numbers like IS 99999 or IS 12345 were fabricated
      const fakeIsMatch = answer.content.match(/IS\s+\d{4,5}/g);
      // Any mentioned IS numbers should only be the guidance examples (e.g. IS 10322, IS 302-1)
      if (fakeIsMatch) {
        for (const num of fakeIsMatch) {
          expect(['IS 10322', 'IS 302'].some((allowed) => num.includes(allowed))).toBe(true);
        }
      }
    });

    it('should only cite standards present in the retrieved authoritative evidence', async () => {
      const answer = await AssistantService.generateGroundedAnswer({
        query: 'What standard applies?',
        productName: 'LED Light Fitting',
        productCategory: 'Electrical Equipment & Luminaires',
        ragEvidence: [
          {
            standardId: 'std-1',
            isNumber: 'IS 10322 (Part 5/Sec 1) : 2012',
            title: 'General Purpose Luminaires',
            sector: 'Electrotechnical',
            citation: {
              sourceTitle: 'BIS Know Your Standard',
              sourceUrl: 'https://services.bis.gov.in/is10322',
              authorityLevel: 'AUTHORITATIVE',
            },
            source: {
              title: 'BIS Know Your Standard',
              url: 'https://services.bis.gov.in/is10322',
              authorityLevel: 'AUTHORITATIVE',
            },
          } as any,
        ],
      });

      // Citation should only contain IS 10322
      expect(answer.citations.length).toBe(1);
      expect(answer.citations[0].isNumber).toBe('IS 10322 (Part 5/Sec 1) : 2012');
      // No other random IS standards should be cited
      expect(answer.citations.some((c) => c.isNumber.includes('IS 9999'))).toBe(false);
    });
  });
});
