import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';

// ── Mock Environment ──────────────────────────────────────────────────────────
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test_db');
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('LOG_LEVEL', 'error');
vi.stubEnv('FRONTEND_URL', 'http://localhost:5173');
vi.stubEnv('JWT_SECRET', 'test-jwt-secret-must-be-at-least-32-characters-long!');

// ── In-Memory Database Store for Testing ─────────────────────────────────────
let mockProducts: any[] = [];
let mockProductAttributes: any[] = [];
let mockProductStandardAnalyses: any[] = [];
let mockProductStandardMatches: any[] = [];
let mockProductStandardReviews: any[] = [];
let mockStandards: any[] = [];
let mockSourceDocuments: any[] = [];
let mockQCOs: any[] = [];
let mockQCOStandardMappings: any[] = [];
let mockKnowledgeChunks: any[] = [];

vi.mock('../src/db/client.js', () => {
  return {
    checkDatabaseHealth: vi.fn().mockResolvedValue({ connected: true, latencyMs: 1 }),
    disconnectDatabase: vi.fn().mockResolvedValue(undefined),
    prisma: {
      product: {
        findFirst: vi.fn().mockImplementation(async ({ where, include }: { where: any; include?: any }) => {
          const p = mockProducts.find((item) => {
            if (where.id && item.id !== where.id) return false;
            if (where.userId && item.userId !== where.userId) return false;
            if (where.isActive !== undefined && item.isActive !== where.isActive) return false;
            return true;
          });
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
          return mockProductAttributes.filter((a) => {
            if (where?.productId && a.productId !== where.productId) return false;
            return true;
          });
        }),
        upsert: vi.fn().mockImplementation(async ({ where, create, update }: any) => {
          const { productId_attributeKey } = where;
          let existing = mockProductAttributes.find(
            (a) => a.productId === productId_attributeKey.productId && a.attributeKey === productId_attributeKey.attributeKey
          );
          if (existing) {
            Object.assign(existing, update, { updatedAt: new Date() });
            return existing;
          }
          const item = {
            id: `attr-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            ...create,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockProductAttributes.push(item);
          return item;
        }),
      },
      productStandardAnalysis: {
        findFirst: vi.fn().mockImplementation(async ({ where, include }: { where: any; include?: any }) => {
          const a = mockProductStandardAnalyses.find((item) => {
            if (where.productId && item.productId !== where.productId) return false;
            if (where.inputHash && item.inputHash !== where.inputHash) return false;
            if (where.status && item.status !== where.status) return false;
            if (where.analysisVersion && item.analysisVersion !== where.analysisVersion) return false;
            return true;
          });
          if (!a) return null;
          const res = { ...a };
          if (include?.matches) {
            const matches = mockProductStandardMatches
              .filter((m) => m.analysisId === a.id)
              .sort((m1, m2) => m1.rank - m2.rank);

            res.matches = matches.map((m) => {
              const mCopy = { ...m };
              if (include.matches.include?.standard) {
                const std = mockStandards.find((s) => s.id === m.standardId);
                if (std) {
                  const sCopy = { ...std };
                  if (include.matches.include.standard.include?.sourceDocument) {
                    sCopy.sourceDocument = mockSourceDocuments.find((d) => d.id === std.sourceDocumentId) || null;
                  }
                  if (include.matches.include.standard.include?.qcoMappings) {
                    sCopy.qcoMappings = mockQCOStandardMappings
                      .filter((qm) => qm.standardId === std.id)
                      .map((qm) => ({
                        ...qm,
                        qco: mockQCOs.find((q) => q.id === qm.qcoId) || {},
                      }));
                  }
                  mCopy.standard = sCopy;
                }
              }
              return mCopy;
            });
          }
          return res;
        }),
        create: vi.fn().mockImplementation(async ({ data }: { data: any }) => {
          const item = {
            id: `analysis-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockProductStandardAnalyses.push(item);
          return item;
        }),
      },
      productStandardMatch: {
        create: vi.fn().mockImplementation(async ({ data }: { data: any }) => {
          const item = {
            id: `match-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            ...data,
            createdAt: new Date(),
          };
          mockProductStandardMatches.push(item);
          return item;
        }),
      },
      productStandardReview: {
        findMany: vi.fn().mockImplementation(async ({ where, include }: { where?: any; include?: any } = {}) => {
          return mockProductStandardReviews
            .filter((r) => {
              if (where?.productId && r.productId !== where.productId) return false;
              if (where?.standardId && r.standardId !== where.standardId) return false;
              return true;
            })
            .map((r) => {
              const res = { ...r };
              if (include?.standard) {
                const std = mockStandards.find((s) => s.id === r.standardId);
                if (std) {
                  res.standard = { isNumber: std.isNumber, title: std.title };
                }
              }
              return res;
            });
        }),
        upsert: vi.fn().mockImplementation(async ({ where, create, update, include }: any) => {
          const { productId_standardId } = where;
          let existing = mockProductStandardReviews.find(
            (r) => r.productId === productId_standardId.productId && r.standardId === productId_standardId.standardId
          );
          if (existing) {
            Object.assign(existing, update, { updatedAt: new Date() });
            const res = { ...existing };
            if (include?.standard) {
              const std = mockStandards.find((s) => s.id === existing.standardId);
              if (std) res.standard = { isNumber: std.isNumber, title: std.title };
            }
            return res;
          }
          const item = {
            id: `rev-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            ...create,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockProductStandardReviews.push(item);
          const res = { ...item };
          if (include?.standard) {
            const std = mockStandards.find((s) => s.id === item.standardId);
            if (std) res.standard = { isNumber: std.isNumber, title: std.title };
          }
          return res;
        }),
      },
      standard: {
        findUnique: vi.fn().mockImplementation(async ({ where, include }: { where: any; include?: any }) => {
          const std = mockStandards.find((s) => s.id === where.id);
          if (!std) return null;
          const res = { ...std };
          if (include?.sourceDocument) {
            res.sourceDocument = mockSourceDocuments.find((d) => d.id === std.sourceDocumentId) || null;
          }
          if (include?.qcoMappings) {
            res.qcoMappings = mockQCOStandardMappings
              .filter((m) => m.standardId === std.id)
              .map((m) => ({ ...m, qco: mockQCOs.find((q) => q.id === m.qcoId) || {} }));
          }
          return res;
        }),
        findMany: vi.fn().mockImplementation(async ({ where, include }: { where?: any; include?: any } = {}) => {
          return mockStandards
            .filter((s) => {
              if (where?.isActive !== undefined && s.isActive !== where.isActive) return false;
              if (where?.status && s.status !== where.status) return false;
              if (where?.sector?.contains && !s.sector?.toLowerCase().includes(where.sector.contains.toLowerCase())) return false;
              if (where?.department?.contains && !s.department?.toLowerCase().includes(where.department.contains.toLowerCase())) return false;

              const checkTerm = (term: string) => {
                const t = term.toLowerCase().trim();
                const tokens = t.split(/[\s,.:;/()-]+/).filter((w: string) => w.length >= 3);
                const haystack = `${s.isNumber} ${s.canonicalNumber} ${s.title} ${s.shortTitle || ''} ${s.scope || ''} ${s.sector || ''} ${s.department || ''}`.toLowerCase();
                if (haystack.includes(t)) return true;
                return tokens.some((tok: string) => haystack.includes(tok));
              };

              if (where?.OR) {
                const matchesAny = where.OR.some((cond: any) => {
                  const target =
                    cond.isNumber?.contains ||
                    cond.canonicalNumber?.contains ||
                    cond.title?.contains ||
                    cond.shortTitle?.contains ||
                    cond.scope?.contains ||
                    cond.sector?.contains ||
                    cond.department?.contains;
                  if (target) return checkTerm(target);
                  return false;
                });
                if (!matchesAny) return false;
              }

              if (where?.AND) {
                const matchesAll = where.AND.every((andCond: any) => {
                  if (andCond.OR) {
                    return andCond.OR.some((cond: any) => {
                      const target =
                        cond.isNumber?.contains ||
                        cond.canonicalNumber?.contains ||
                        cond.title?.contains ||
                        cond.shortTitle?.contains ||
                        cond.scope?.contains ||
                        cond.sector?.contains ||
                        cond.department?.contains;
                      if (target) return checkTerm(target);
                      return false;
                    });
                  }
                  return true;
                });
                if (!matchesAll) return false;
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
            return true;
          }).length;
        }),
      },
      knowledgeChunk: {
        findMany: vi.fn().mockImplementation(async () => mockKnowledgeChunks),
        findFirst: vi.fn().mockImplementation(async () => mockKnowledgeChunks[0] || null),
        count: vi.fn().mockImplementation(async () => mockKnowledgeChunks.length),
      },
    },
  };
});

describe('Phase 6 — Product Intelligence & Standard Matching Tests', () => {
  let app: any;
  let user1Token: string;
  let user2Token: string;
  let normalizeAttribute: any;
  let normalizeTechnicalUnits: any;
  let generateCandidateQueries: any;
  let matchStandardToProduct: any;

  const user1Id = '11111111-1111-1111-1111-111111111111';
  const user2Id = '22222222-2222-2222-2222-222222222222';
  const prod1Id = 'prod-uuid-1111-1111';
  const prod2Id = 'prod-uuid-2222-2222';

  beforeAll(async () => {
    const sessionModule = await import('../src/services/session.service.js');
    const appModule = await import('../src/app.js');
    const normalizerModule = await import('../src/services/intelligence/normalizer.js');
    const queryGenModule = await import('../src/services/intelligence/query-generator.js');
    const matchEngineModule = await import('../src/services/intelligence/matching-engine.js');

    app = appModule.app;
    normalizeAttribute = normalizerModule.normalizeAttribute;
    normalizeTechnicalUnits = normalizerModule.normalizeTechnicalUnits;
    generateCandidateQueries = queryGenModule.generateCandidateQueries;
    matchStandardToProduct = matchEngineModule.matchStandardToProduct;

    user1Token = sessionModule.createAuthToken({
      id: user1Id,
      email: 'user1@example.com',
      role: 'USER',
      name: 'Owner User',
    });

    user2Token = sessionModule.createAuthToken({
      id: user2Id,
      email: 'user2@example.com',
      role: 'USER',
      name: 'Other User',
    });
  });

  beforeEach(() => {
    mockProducts = [];
    mockProductAttributes = [];
    mockProductStandardAnalyses = [];
    mockProductStandardMatches = [];
    mockProductStandardReviews = [];
    mockStandards = [];
    mockSourceDocuments = [];
    mockQCOs = [];
    mockQCOStandardMappings = [];
    mockKnowledgeChunks = [];

    // Setup Seed Standard 1: IS 10322 (Luminaires)
    const srcDoc1 = {
      id: 'src-1',
      title: 'BIS Know Your Standard — IS 10322 (Part 5/Sec 1)',
      url: 'https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails/IS10322_5_1',
      sourceType: 'BIS_OFFICIAL',
      authorityLevel: 'AUTHORITATIVE',
      status: 'ACTIVE',
      retrievedAt: new Date(),
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
      scope: 'Requirements for general purpose luminaires on supply voltages not exceeding 1000 V.',
      status: 'CURRENT',
      sector: 'Electrotechnical',
      department: 'Lamps and Related Equipment (ETD 23)',
      currentEdition: 'First Revision (2012)',
      sourceDocumentId: srcDoc1.id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockStandards.push(std1);

    // Setup Seed Standard 2: IS 1293 (Plugs & Sockets)
    const srcDoc2 = {
      id: 'src-2',
      title: 'BIS Know Your Standard — IS 1293 : 2019',
      url: 'https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails/IS1293',
      sourceType: 'BIS_OFFICIAL',
      authorityLevel: 'AUTHORITATIVE',
      status: 'ACTIVE',
      retrievedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockSourceDocuments.push(srcDoc2);

    const std2 = {
      id: 'std-1293',
      isNumber: 'IS 1293 : 2019',
      canonicalNumber: 'IS 1293',
      title: 'Plugs and Socket-Outlets of Related Voltages Up to and Including 250 V',
      shortTitle: 'Plugs and Socket-Outlets',
      scope: 'Plugs and fixed or portable socket-outlets for domestic and industrial wiring.',
      status: 'CURRENT',
      sector: 'Electrotechnical',
      department: 'Electrical Installation (ETD 20)',
      currentEdition: 'Fourth Revision (2019)',
      sourceDocumentId: srcDoc2.id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockStandards.push(std2);

    // Quality Control Order for Electrical Appliances
    const qco1 = {
      id: 'qco-1',
      name: 'Electrical Appliances (Quality Control) Order',
      orderNumber: 'S.O. 2291(E)',
      ministry: 'Ministry of Heavy Industries',
      status: 'IN_FORCE',
      sourceDocumentId: srcDoc1.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockQCOs.push(qco1);

    mockQCOStandardMappings.push({
      id: 'qcom-1',
      qcoId: qco1.id,
      standardId: std1.id,
      productDescription: 'Luminaires and lighting fittings',
    });

    // Product 1: Owned by User 1 (LED Luminaire)
    mockProducts.push({
      id: prod1Id,
      userId: user1Id,
      name: 'Smart Commercial LED Luminaire 50W',
      category: 'Electrical Equipment & Luminaires',
      description: 'Outdoor street and general lighting fixture operating at 230V 50Hz',
      intendedUse: 'General purpose lighting for commercial and municipal premises',
      productCategory: 'Electrotechnical',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Product 2: Owned by User 2 (Power Strip)
    mockProducts.push({
      id: prod2Id,
      userId: user2Id,
      name: 'Industrial Power Strip 16A',
      category: 'Electrical Accessories',
      description: 'Heavy duty plug and socket extension board',
      intendedUse: 'Domestic and commercial power distribution',
      productCategory: 'Electrotechnical',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  // ── 1. Normalization & Query Generation Unit Tests ─────────────────────────
  describe('1. Attribute Normalization & Query Generator Unit Tests', () => {
    it('should normalize units consistently (230v -> 230 V, 16a -> 16 A)', () => {
      const input = 'Rated for 230v 50hz at 16a with 50w consumption';
      const output = normalizeTechnicalUnits(input);
      expect(output).toBe('Rated for 230 V 50 Hz at 16 A with 50 W consumption');
    });

    it('should expand domain synonyms (led bulb -> self ballasted led lamp)', () => {
      const res = normalizeAttribute('Smart LED bulb');
      expect(res.normalizedValue).toContain('self ballasted led lamp');
      expect(res.tokens).toContain('led');
      expect(res.tokens).toContain('lamp');
    });

    it('should generate multi-signal candidate queries without fabricating standards', () => {
      const queriesRes = generateCandidateQueries({
        productId: prod1Id,
        name: 'Smart Commercial LED Luminaire 50W',
        category: 'Electrical Equipment & Luminaires',
        intendedUse: 'General purpose lighting fixtures',
        attributes: { voltage: '230V', wattage: '50W' },
        normalizedTokens: [],
      });

      expect(queriesRes.queries.length).toBeGreaterThanOrEqual(3);
      expect(queriesRes.queries.some((q) => q.includes('luminaire'))).toBe(true);
    });
  });

  // ── 2. Standard Matching Engine Unit Tests ─────────────────────────────────
  describe('2. Matching Engine & Explainability Unit Tests', () => {
    it('should score and explain relevant candidate standard with transparent reasons', () => {
      const match = matchStandardToProduct(
        {
          id: 'std-10322',
          isNumber: 'IS 10322 (Part 5/Sec 1) : 2012',
          canonicalNumber: 'IS 10322-5-1',
          title: 'Luminaires - General Purpose Luminaires',
          scope: 'Requirements for general purpose luminaires on supply voltages not exceeding 1000 V.',
          status: 'CURRENT',
          sector: 'Electrotechnical',
          department: 'Lamps and Related Equipment (ETD 23)',
          sourceDocument: mockSourceDocuments[0],
          qcoMappings: [
            {
              qco: mockQCOs[0],
            },
          ],
        },
        {
          productId: prod1Id,
          name: 'Commercial LED Luminaire',
          category: 'Luminaires',
          intendedUse: 'General purpose luminaires',
          sector: 'Electrotechnical',
          attributes: {},
          normalizedTokens: ['commercial', 'led', 'luminaire', 'lighting', 'general', 'purpose'],
        }
      );

      expect(match.relevanceScore).toBeGreaterThan(0.5);
      expect(match.matchLevel).toBe('HIGHLY_RELEVANT');
      expect(match.reasons.length).toBeGreaterThanOrEqual(2);
      expect(match.reasons.some((r) => r.includes('Quality Control Order'))).toBe(true);
      expect(match.evidence?.qco?.orderNumber).toBe('S.O. 2291(E)');
      expect(match.sourceDocument?.authorityLevel).toBe('AUTHORITATIVE');
    });
  });

  // ── 3. Product Standard Analysis API (/intelligence/analyze) ───────────────
  describe('3. Product Intelligence Analysis API', () => {
    it('should reject unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).post(`/api/v1/products/${prod1Id}/intelligence/analyze`);
      expect(res.status).toBe(401);
    });

    it('should reject non-owner user attempting to analyze product (IDOR prevention)', async () => {
      const res = await request(app)
        .post(`/api/v1/products/${prod1Id}/intelligence/analyze`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should execute product intelligence analysis and return ranked candidates with reasons', async () => {
      const res = await request(app)
        .post(`/api/v1/products/${prod1Id}/intelligence/analyze`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ forceRefresh: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.productId).toBe(prod1Id);
      expect(data.status).toBe('COMPLETED');
      expect(data.candidateStandards.length).toBeGreaterThanOrEqual(1);

      const topMatch = data.candidateStandards[0];
      expect(topMatch.isNumber).toBe('IS 10322 (Part 5/Sec 1) : 2012');
      expect(topMatch.rank).toBe(1);
      expect(topMatch.reasons.length).toBeGreaterThan(0);
      expect(topMatch.sourceDocument.authorityLevel).toBe('AUTHORITATIVE');
    });

    it('should reuse cached analysis on subsequent request with same input hash', async () => {
      const res1 = await request(app)
        .post(`/api/v1/products/${prod1Id}/intelligence/analyze`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res1.status).toBe(200);

      const res2 = await request(app)
        .post(`/api/v1/products/${prod1Id}/intelligence/analyze`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ forceRefresh: false });

      expect(res2.status).toBe(200);
      expect(res2.body.data.fromCache).toBe(true);
    });

    it('should recompute when forceRefresh=true is explicitly requested', async () => {
      const res = await request(app)
        .post(`/api/v1/products/${prod1Id}/intelligence/analyze`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ forceRefresh: true });

      expect(res.status).toBe(200);
      expect(res.body.data.fromCache).toBe(false);
    });
  });

  // ── 4. User Review & Confirmation API (/intelligence/reviews) ──────────────
  describe('4. User Review & Confirmation Workflow', () => {
    it('should save user review decision (CONFIRMED) on a candidate standard', async () => {
      const res = await request(app)
        .post(`/api/v1/products/${prod1Id}/intelligence/reviews`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          standardId: 'std-10322',
          decision: 'CONFIRMED',
          note: 'Applicable standard for our commercial luminaire line.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.decision).toBe('CONFIRMED');
      expect(res.body.data.note).toContain('commercial luminaire');
    });

    it('should retrieve existing user reviews for product', async () => {
      mockProductStandardReviews.push({
        id: 'rev-seeded-1',
        productId: prod1Id,
        standardId: 'std-10322',
        decision: 'CONFIRMED',
        note: 'Seeded confirmation review.',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .get(`/api/v1/products/${prod1Id}/intelligence/reviews`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].decision).toBe('CONFIRMED');
    });

    it('should reject review submission for non-existent standard with 404', async () => {
      const res = await request(app)
        .post(`/api/v1/products/${prod1Id}/intelligence/reviews`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          standardId: 'non-existent-std-uuid',
          decision: 'CONFIRMED',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ── 5. Product Structured Attributes API (/attributes) ─────────────────────
  describe('5. Product Structured Attributes API', () => {
    it('should upsert structured attributes with automatic normalization', async () => {
      const res = await request(app)
        .post(`/api/v1/products/${prod1Id}/attributes`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send([
          { attributeKey: 'ratedVoltage', attributeValue: '230v 50hz' },
          { attributeKey: 'powerRating', attributeValue: '50w' },
        ]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].normalizedValue).toContain('230 V 50 Hz');
      expect(res.body.data[1].normalizedValue).toContain('50 W');
    });

    it('should retrieve product structured attributes', async () => {
      mockProductAttributes.push(
        {
          id: 'attr-1',
          productId: prod1Id,
          attributeKey: 'ratedVoltage',
          attributeValue: '230V 50Hz',
          normalizedValue: '230 V 50 Hz',
          source: 'USER',
          confidence: 1.0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'attr-2',
          productId: prod1Id,
          attributeKey: 'powerRating',
          attributeValue: '50W',
          normalizedValue: '50 W',
          source: 'USER',
          confidence: 1.0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      );

      const res = await request(app)
        .get(`/api/v1/products/${prod1Id}/attributes`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });
});
