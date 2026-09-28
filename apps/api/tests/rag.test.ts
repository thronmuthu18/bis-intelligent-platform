import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';

// ── Mock Environment ──────────────────────────────────────────────────────────
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test_db');
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('LOG_LEVEL', 'error');
vi.stubEnv('FRONTEND_URL', 'http://localhost:5173');
vi.stubEnv('JWT_SECRET', 'test-jwt-secret-must-be-at-least-32-characters-long!');

// ── In-Memory Database Store for Testing ─────────────────────────────────────
let mockStandards: any[] = [];
let mockStandardVersions: any[] = [];
let mockStandardAmendments: any[] = [];
let mockQCOs: any[] = [];
let mockQCOStandardMappings: any[] = [];
let mockSchemes: any[] = [];
let mockStandardSchemeMappings: any[] = [];
let mockProductManuals: any[] = [];
let mockSourceDocuments: any[] = [];
let mockKnowledgeChunks: any[] = [];
let mockIngestionRuns: any[] = [];

vi.mock('../src/db/client.js', () => {
  return {
    checkDatabaseHealth: vi.fn().mockResolvedValue({ connected: true, latencyMs: 1 }),
    disconnectDatabase: vi.fn().mockResolvedValue(undefined),
    prisma: {
      standard: {
        findUnique: vi.fn().mockImplementation(async ({ where, include }: { where: any; include?: any }) => {
          const std = mockStandards.find((s) => s.id === where.id);
          if (!std) return null;
          const res = { ...std };
          if (include?.sourceDocument) res.sourceDocument = mockSourceDocuments.find((d) => d.id === std.sourceDocumentId) || null;
          if (include?.versions) res.versions = mockStandardVersions.filter((v) => v.standardId === std.id);
          if (include?.amendments) res.amendments = mockStandardAmendments.filter((a) => a.standardId === std.id);
          if (include?.qcoMappings) {
            res.qcoMappings = mockQCOStandardMappings
              .filter((m) => m.standardId === std.id)
              .map((m) => ({ ...m, qco: mockQCOs.find((q) => q.id === m.qcoId) || {} }));
          }
          if (include?.schemeMappings) {
            res.schemeMappings = mockStandardSchemeMappings
              .filter((sm) => sm.standardId === std.id)
              .map((sm) => ({ ...sm, scheme: mockSchemes.find((sc) => sc.id === sm.schemeId) || {} }));
          }
          if (include?.productManuals) res.productManuals = mockProductManuals.filter((pm) => pm.standardId === std.id);
          return res;
        }),
        findMany: vi.fn().mockImplementation(async ({ where, include }: { where?: any; include?: any }) => {
          return mockStandards
            .filter((s) => {
              if (where?.isActive !== undefined && s.isActive !== where.isActive) return false;
              if (where?.status && s.status !== where.status) return false;
              if (where?.sector?.contains && !s.sector?.toLowerCase().includes(where.sector.contains.toLowerCase())) return false;
              if (where?.department?.contains && !s.department?.toLowerCase().includes(where.department.contains.toLowerCase())) return false;
              if (where?.OR) {
                const matchesAny = where.OR.some((cond: any) => {
                  if (cond.isNumber?.contains && s.isNumber.toLowerCase().includes(cond.isNumber.contains.toLowerCase())) return true;
                  if (cond.canonicalNumber?.contains && s.canonicalNumber.toLowerCase().includes(cond.canonicalNumber.contains.toLowerCase())) return true;
                  if (cond.title?.contains && s.title.toLowerCase().includes(cond.title.contains.toLowerCase())) return true;
                  if (cond.shortTitle?.contains && s.shortTitle?.toLowerCase().includes(cond.shortTitle.contains.toLowerCase())) return true;
                  if (cond.scope?.contains && s.scope?.toLowerCase().includes(cond.scope.contains.toLowerCase())) return true;
                  return false;
                });
                if (!matchesAny) return false;
              }
              return true;
            })
            .map((s) => {
              const res = { ...s };
              if (include?.sourceDocument) res.sourceDocument = mockSourceDocuments.find((d) => d.id === s.sourceDocumentId) || null;
              return res;
            });
        }),
        count: vi.fn().mockImplementation(async ({ where }: { where?: any } = {}) => {
          return mockStandards.filter((s) => {
            if (where?.isActive !== undefined && s.isActive !== where.isActive) return false;
            if (where?.status && s.status !== where.status) return false;
            if (where?.sector?.contains && !s.sector?.toLowerCase().includes(where.sector.contains.toLowerCase())) return false;
            if (where?.department?.contains && !s.department?.toLowerCase().includes(where.department.contains.toLowerCase())) return false;
            return true;
          }).length;
        }),
      },
      knowledgeChunk: {
        findMany: vi.fn().mockImplementation(async ({ where, include }: { where?: any; include?: any } = {}) => {
          return mockKnowledgeChunks
            .filter((c) => {
              if (where?.embeddingStatus && c.embeddingStatus !== where.embeddingStatus) return false;
              if (where?.standardId?.not === null && !c.standardId) return false;
              if (where?.standard) {
                const std = mockStandards.find((s) => s.id === c.standardId);
                if (!std) return false;
                if (where.standard.sector?.contains && !std.sector?.toLowerCase().includes(where.standard.sector.contains.toLowerCase())) return false;
                if (where.standard.department?.contains && !std.department?.toLowerCase().includes(where.standard.department.contains.toLowerCase())) return false;
                if (where.standard.status && std.status !== where.standard.status) return false;
              }
              if (where?.sourceDocument) {
                const src = mockSourceDocuments.find((d) => d.id === c.sourceDocumentId);
                if (!src) return false;
                if (where.sourceDocument.authorityLevel && src.authorityLevel !== where.sourceDocument.authorityLevel) return false;
              }
              return true;
            })
            .map((c) => {
              const res = { ...c };
              if (include?.standard) {
                const std = mockStandards.find((s) => s.id === c.standardId);
                if (std) {
                  const sCopy = { ...std };
                  if (include.standard.include?.sourceDocument) {
                    sCopy.sourceDocument = mockSourceDocuments.find((d) => d.id === std.sourceDocumentId) || null;
                  }
                  res.standard = sCopy;
                }
              }
              if (include?.sourceDocument) {
                res.sourceDocument = mockSourceDocuments.find((d) => d.id === c.sourceDocumentId) || null;
              }
              return res;
            });
        }),
        findFirst: vi.fn().mockImplementation(async ({ where }: { where: any } = { where: {} }) => {
          return mockKnowledgeChunks.find((c) => {
            if (where.standardId && c.standardId !== where.standardId) return false;
            if (where.chunkType && c.chunkType !== where.chunkType) return false;
            if (where.chunkIndex !== undefined && c.chunkIndex !== where.chunkIndex) return false;
            if (where.contentHash && c.contentHash !== where.contentHash) return false;
            return true;
          }) || null;
        }),
        create: vi.fn().mockImplementation(async ({ data }: { data: any }) => {
          const item = {
            id: `chunk-${Date.now()}-${Math.random()}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockKnowledgeChunks.push(item);
          return item;
        }),
        deleteMany: vi.fn().mockImplementation(async ({ where }: { where: any } = { where: {} }) => {
          mockKnowledgeChunks = mockKnowledgeChunks.filter((c) => {
            if (where.standardId && c.standardId === where.standardId && c.chunkType === where.chunkType && c.chunkIndex === where.chunkIndex) return false;
            return true;
          });
          return { count: 1 };
        }),
        count: vi.fn().mockImplementation(async ({ where }: { where?: any } = {}) => {
          if (!where) return mockKnowledgeChunks.length;
          return mockKnowledgeChunks.filter((c) => {
            if (where.embeddingStatus && c.embeddingStatus !== where.embeddingStatus) return false;
            return true;
          }).length;
        }),
      },
      sourceDocument: {
        findFirst: vi.fn().mockImplementation(async () => mockSourceDocuments[0] || null),
      },
    },
  };
});

describe('Phase 5 — Hybrid Search & RAG Foundation Tests', () => {
  let app: any;
  let userToken: string;
  let dataManagerToken: string;
  let adminToken: string;
  let mockProvider: any;
  let cosineSimilarity: (a: number[], b: number[]) => number;
  let buildChunksForStandard: (standard: any) => any[];

  beforeAll(async () => {
    const sessionModule = await import('../src/services/session.service.js');
    const appModule = await import('../src/app.js');
    const mockModule = await import('../src/services/ai/embedding/mock.provider.js');
    const vectorModule = await import('../src/services/rag/vectorSearch.js');
    const chunkerModule = await import('../src/services/rag/chunker.js');

    app = appModule.app;
    mockProvider = new mockModule.MockEmbeddingProvider(1536);
    cosineSimilarity = vectorModule.cosineSimilarity;
    buildChunksForStandard = chunkerModule.buildChunksForStandard;

    userToken = sessionModule.createAuthToken({
      id: '11111111-1111-1111-1111-111111111111',
      email: 'user@example.com',
      role: 'USER',
      name: 'Standard User',
    });

    dataManagerToken = sessionModule.createAuthToken({
      id: '22222222-2222-2222-2222-222222222222',
      email: 'manager@example.com',
      role: 'DATA_MANAGER',
      name: 'Data Manager',
    });

    adminToken = sessionModule.createAuthToken({
      id: '33333333-3333-3333-3333-333333333333',
      email: 'admin@example.com',
      role: 'ADMIN',
      name: 'System Admin',
    });
  });

  beforeEach(async () => {
    mockStandards = [];
    mockStandardVersions = [];
    mockStandardAmendments = [];
    mockQCOs = [];
    mockQCOStandardMappings = [];
    mockSchemes = [];
    mockStandardSchemeMappings = [];
    mockProductManuals = [];
    mockSourceDocuments = [];
    mockKnowledgeChunks = [];
    mockIngestionRuns = [];

    // Pre-populate Sample Standard 1: IS 10322 (Luminaires)
    const srcDoc1 = {
      id: 'src-1',
      title: 'BIS Know Your Standard — IS 10322 (Part 5/Sec 1)',
      url: 'https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails/IS10322_5_1',
      sourceType: 'BIS_OFFICIAL',
      authorityLevel: 'AUTHORITATIVE',
      documentType: 'Standard Specification',
      publishedAt: new Date('2012-07-15'),
      retrievedAt: new Date(),
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockSourceDocuments.push(srcDoc1);

    const std1 = {
      id: 'std-10322',
      isNumber: 'IS 10322 (Part 5/Sec 1) : 2012',
      canonicalNumber: 'IS 10322-5-1',
      title: 'Luminaires - Part 5: Particular Requirements - Section 1: General Purpose Luminaires',
      shortTitle: 'General Purpose Luminaires',
      scope: 'Requirements for general purpose luminaires and lighting fixtures on supply voltages not exceeding 1000 V.',
      status: 'CURRENT',
      sector: 'Electrotechnical',
      department: 'Lamps and Related Equipment (ETD 23)',
      language: 'English',
      currentEdition: 'First Revision (2012)',
      publicationDate: new Date('2012-07-15'),
      sourceDocumentId: srcDoc1.id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockStandards.push(std1);

    // Pre-populate Sample Standard 2: IS 1293 (Plugs & Sockets)
    const srcDoc2 = {
      id: 'src-2',
      title: 'BIS Know Your Standard — IS 1293 : 2019',
      url: 'https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails/IS1293',
      sourceType: 'BIS_OFFICIAL',
      authorityLevel: 'AUTHORITATIVE',
      documentType: 'Standard Specification',
      publishedAt: new Date('2019-10-23'),
      retrievedAt: new Date(),
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockSourceDocuments.push(srcDoc2);

    const std2 = {
      id: 'std-1293',
      isNumber: 'IS 1293 : 2019',
      canonicalNumber: 'IS 1293',
      title: 'Plugs and Socket-Outlets of Related Voltages Up to and Including 250 V and Rated Current Up to and Including 16 A',
      shortTitle: 'Plugs and Socket-Outlets',
      scope: 'Applies to plugs and fixed or portable socket-outlets for domestic and industrial wiring.',
      status: 'CURRENT',
      sector: 'Electrotechnical',
      department: 'Electrical Installation (ETD 20)',
      language: 'English',
      currentEdition: 'Fourth Revision (2019)',
      publicationDate: new Date('2019-10-23'),
      sourceDocumentId: srcDoc2.id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockStandards.push(std2);

    // Embed chunks for both standards
    const chunks1 = buildChunksForStandard(std1);
    for (let i = 0; i < chunks1.length; i++) {
      const c = chunks1[i];
      const vec = await mockProvider.embedText(c.content);
      mockKnowledgeChunks.push({
        id: `chunk-1-${i}`,
        ...c,
        embedding: vec,
        embeddingModel: mockProvider.model,
        embeddingDimension: mockProvider.dimension,
        embeddingVersion: mockProvider.version,
        embeddingStatus: 'COMPLETED',
      });
    }

    const chunks2 = buildChunksForStandard(std2);
    for (let i = 0; i < chunks2.length; i++) {
      const c = chunks2[i];
      const vec = await mockProvider.embedText(c.content);
      mockKnowledgeChunks.push({
        id: `chunk-2-${i}`,
        ...c,
        embedding: vec,
        embeddingModel: mockProvider.model,
        embeddingDimension: mockProvider.dimension,
        embeddingVersion: mockProvider.version,
        embeddingStatus: 'COMPLETED',
      });
    }
  });

  // ── 1. Vector Math & Chunking Unit Tests ────────────────────────────────────
  describe('1. Vector Similarity & Chunking Unit Tests', () => {
    it('should compute cosine similarity = 1.0 for identical vectors', () => {
      const v = [0.6, 0.8];
      expect(cosineSimilarity(v, v)).toBeCloseTo(1.0, 4);
    });

    it('should compute cosine similarity = 0.0 for orthogonal vectors', () => {
      const v1 = [1, 0];
      const v2 = [0, 1];
      expect(cosineSimilarity(v1, v2)).toBeCloseTo(0.0, 4);
    });

    it('should generate deterministic unit vectors with dimension 1536 from MockEmbeddingProvider', async () => {
      const v1 = await mockProvider.embedText('Luminaires safety');
      const v2 = await mockProvider.embedText('Luminaires safety');
      expect(v1).toHaveLength(1536);
      expect(v1).toEqual(v2);

      // Verify unit length
      let sumSq = 0;
      for (const val of v1) sumSq += val * val;
      expect(Math.sqrt(sumSq)).toBeCloseTo(1.0, 2);
    });

    it('should build structured chunks for standard with deterministic SHA-256 hash', () => {
      const chunks = buildChunksForStandard(mockStandards[0]);
      expect(chunks.length).toBeGreaterThanOrEqual(2);
      expect(chunks[0].chunkType).toBe('STANDARD_SCOPE');
      expect(chunks[0].contentHash).toBeDefined();
      expect(chunks[0].contentHash).toHaveLength(64);
    });
  });

  // ── 2. Hybrid Search API Tests ──────────────────────────────────────────────
  describe('2. Hybrid Search API (/api/v1/standards/search)', () => {
    it('should execute hybrid search and return ranked results with relevance scores', async () => {
      const res = await request(app)
        .get('/api/v1/standards/search?q=luminaires lighting&mode=hybrid')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.results.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.results[0].isNumber).toBe('IS 10322 (Part 5/Sec 1) : 2012');
      expect(res.body.data.results[0].relevanceScore).toBeGreaterThan(0);
      expect(res.body.data.meta.mode).toBe('hybrid');
    });

    it('should boost exact IS number queries to #1 rank with high relevance', async () => {
      const res = await request(app)
        .get('/api/v1/standards/search?q=IS 1293&mode=hybrid')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.results[0].isNumber).toBe('IS 1293 : 2019');
      expect(res.body.data.results[0].relevanceScore).toBeGreaterThanOrEqual(0.85);
    });

    it('should support pure keyword search mode', async () => {
      const res = await request(app)
        .get('/api/v1/standards/search?q=plugs&mode=keyword')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.results[0].canonicalNumber).toBe('IS 1293');
      expect(res.body.data.meta.mode).toBe('keyword');
    });

    it('should support pure semantic search mode', async () => {
      const res = await request(app)
        .get('/api/v1/standards/search?q=illumination fixtures&mode=semantic')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.results.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.meta.mode).toBe('semantic');
    });
  });

  // ── 3. RAG Context Builder API Tests ────────────────────────────────────────
  describe('3. RAG Context Retrieval API (/api/v1/knowledge/retrieve)', () => {
    it('should retrieve source-grounded RAG context evidence blocks with numbered citations', async () => {
      const res = await request(app)
        .post('/api/v1/knowledge/retrieve')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          query: 'luminaires requirements',
          topK: 3,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.query).toBe('luminaires requirements');
      expect(data.results.length).toBeGreaterThanOrEqual(1);
      expect(data.citations.length).toBeGreaterThanOrEqual(1);

      // Verify citation structure
      const c1 = data.citations[0];
      expect(c1.citationIndex).toBe(1);
      expect(c1.sourceTitle).toContain('BIS');
      expect(c1.authorityLevel).toBe('AUTHORITATIVE');

      // Verify structured context text formatting
      expect(data.contextText).toContain('[Source 1]');
      expect(data.contextText).toContain('Official Source:');
    });

    it('should respect maxCharacters limit and set truncated flag if exceeded', async () => {
      const res = await request(app)
        .post('/api/v1/knowledge/retrieve')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          query: 'luminaires',
          maxCharacters: 150,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.meta.characterCount).toBeLessThanOrEqual(250);
    });

    it('should reject empty query with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/knowledge/retrieve')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ query: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ── 4. Reindexing & Security Access Control Tests ───────────────────────────
  describe('4. Embedding Reindexing Security & Role Access', () => {
    it('should forbid regular USER from triggering embedding reindex (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/knowledge/embeddings/reindex')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow DATA_MANAGER to trigger embedding reindex', async () => {
      const res = await request(app)
        .post('/api/v1/knowledge/embeddings/reindex')
        .set('Authorization', `Bearer ${dataManagerToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.standardsProcessed).toBe(2);
    });

    it('should allow ADMIN to retrieve embedding status', async () => {
      const res = await request(app)
        .get('/api/v1/knowledge/embeddings/status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.embeddingDimension).toBe(1536);
      expect(res.body.data.provider).toBe('mock');
    });

    it('should never expose raw vector embeddings or secret keys in search responses', async () => {
      const res = await request(app)
        .get('/api/v1/standards/search?q=luminaires')
        .set('Authorization', `Bearer ${userToken}`);

      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain('passwordHash');
      expect(bodyStr).not.toContain('JWT_SECRET');
      expect(bodyStr).not.toContain('OPENAI_API_KEY');
      expect(bodyStr).not.toContain('embedding":[');
    });
  });
});
