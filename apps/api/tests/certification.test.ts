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
let mockProductCertificationAnalyses: any[] = [];
let mockProductSchemeRecommendations: any[] = [];
let mockProductSchemeReviews: any[] = [];
let mockCertificationFeeEstimates: any[] = [];
let mockProductDocumentationChecklistItems: any[] = [];
let mockProductApplicationRequirementItems: any[] = [];
let mockProductQcoInformationItems: any[] = [];
let mockStandards: any[] = [];
let mockSchemes: any[] = [];
let mockStandardSchemeMappings: any[] = [];
let mockProductManuals: any[] = [];
let mockSourceDocuments: any[] = [];
let mockQCOs: any[] = [];
let mockQCOStandardMappings: any[] = [];
let mockKnowledgeChunks: any[] = [];

vi.mock('../src/db/client.js', () => {
  return {
    checkDatabaseHealth: vi.fn().mockResolvedValue({ connected: true, latencyMs: 1 }),
    disconnectDatabase: vi.fn().mockResolvedValue(undefined),
    prisma: {
      $transaction: vi.fn().mockImplementation(async (callback: any) => {
        return callback({
          productCertificationAnalysis: {
            create: vi.fn().mockImplementation(async ({ data }: any) => {
              const item = {
                id: `cert-analysis-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              mockProductCertificationAnalyses.push(item);
              return item;
            }),
            findUnique: vi.fn().mockImplementation(async ({ where, include }: any) => {
              const item = mockProductCertificationAnalyses.find((a) => a.id === where.id);
              if (!item) return null;
              const res = { ...item };
              if (include?.schemeRecommendations) {
                res.schemeRecommendations = mockProductSchemeRecommendations
                  .filter((r) => r.analysisId === item.id)
                  .sort((a, b) => a.rank - b.rank)
                  .map((r) => {
                    const rCopy = { ...r };
                    if (include.schemeRecommendations.include?.scheme) {
                      rCopy.scheme = mockSchemes.find((s) => s.id === r.schemeId) || {};
                    }
                    if (include.schemeRecommendations.include?.standard) {
                      rCopy.standard = mockStandards.find((s) => s.id === r.standardId) || {};
                    }
                    return rCopy;
                  });
              }
              if (include?.feeEstimates) {
                res.feeEstimates = mockCertificationFeeEstimates.filter((f) => f.analysisId === item.id);
              }
              if (include?.documentationChecklist) {
                res.documentationChecklist = mockProductDocumentationChecklistItems
                  .filter((d) => d.analysisId === item.id)
                  .sort((a, b) => a.rank - b.rank);
              }
              if (include?.applicationRequirements) {
                res.applicationRequirements = mockProductApplicationRequirementItems
                  .filter((a) => a.analysisId === item.id)
                  .sort((a, b) => a.rank - b.rank);
              }
              if (include?.qcoInformation) {
                res.qcoInformation = mockProductQcoInformationItems
                  .filter((q) => q.analysisId === item.id)
                  .map((q) => ({
                    ...q,
                    qco: mockQCOs.find((o) => o.id === q.qcoId) || {},
                    standard: mockStandards.find((s) => s.id === q.standardId) || {},
                  }));
              }
              return res;
            }),
          },
          productSchemeRecommendation: {
            create: vi.fn().mockImplementation(async ({ data }: any) => {
              const item = {
                id: `rec-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                ...data,
                createdAt: new Date(),
              };
              mockProductSchemeRecommendations.push(item);
              return item;
            }),
          },
          certificationFeeEstimate: {
            create: vi.fn().mockImplementation(async ({ data }: any) => {
              const item = {
                id: `fee-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                ...data,
                createdAt: new Date(),
              };
              mockCertificationFeeEstimates.push(item);
              return item;
            }),
          },
          productDocumentationChecklistItem: {
            create: vi.fn().mockImplementation(async ({ data }: any) => {
              const item = {
                id: `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                ...data,
                createdAt: new Date(),
              };
              mockProductDocumentationChecklistItems.push(item);
              return item;
            }),
          },
          productApplicationRequirementItem: {
            create: vi.fn().mockImplementation(async ({ data }: any) => {
              const item = {
                id: `app-req-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                ...data,
                createdAt: new Date(),
              };
              mockProductApplicationRequirementItems.push(item);
              return item;
            }),
          },
          productQcoInformationItem: {
            create: vi.fn().mockImplementation(async ({ data }: any) => {
              const item = {
                id: `qco-info-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                ...data,
                createdAt: new Date(),
              };
              mockProductQcoInformationItems.push(item);
              return item;
            }),
          },
        });
      }),
      product: {
        findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockProducts.find((p) => p.id === where.id) || null;
        }),
        findFirst: vi.fn().mockImplementation(async ({ where }: any) => {
          return (
            mockProducts.find((p) => {
              if (where.id && p.id !== where.id) return false;
              if (where.userId && p.userId !== where.userId) return false;
              if (where.isActive !== undefined && p.isActive !== where.isActive) return false;
              return true;
            }) || null
          );
        }),
      },
      productAttribute: {
        findMany: vi.fn().mockImplementation(async ({ where }: any = {}) => {
          return mockProductAttributes.filter((a) => {
            if (where?.productId && a.productId !== where.productId) return false;
            return true;
          });
        }),
      },
      productStandardAnalysis: {
        findFirst: vi.fn().mockImplementation(async ({ where, include }: any) => {
          const a = mockProductStandardAnalyses.find((item) => {
            if (where.productId && item.productId !== where.productId) return false;
            if (where.status && item.status !== where.status) return false;
            return true;
          });
          if (!a) return null;
          const res = { ...a };
          if (include?.matches) {
            res.matches = mockProductStandardMatches
              .filter((m) => m.analysisId === a.id)
              .sort((m1, m2) => m1.rank - m2.rank)
              .map((m) => {
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
                    if (include.matches.include.standard.include?.schemeMappings) {
                      sCopy.schemeMappings = mockStandardSchemeMappings
                        .filter((sm) => sm.standardId === std.id)
                        .map((sm) => ({
                          ...sm,
                          scheme: mockSchemes.find((sc) => sc.id === sm.schemeId) || {},
                          sourceDocument: mockSourceDocuments.find((d) => d.id === sm.sourceDocumentId) || null,
                        }));
                    }
                    if (include.matches.include.standard.include?.productManuals) {
                      sCopy.productManuals = mockProductManuals
                        .filter((pm) => pm.standardId === std.id)
                        .map((pm) => ({
                          ...pm,
                          sourceDocument: mockSourceDocuments.find((d) => d.id === pm.sourceDocumentId) || null,
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
      },
      productCertificationAnalysis: {
        findFirst: vi.fn().mockImplementation(async ({ where, include }: any) => {
          const item = mockProductCertificationAnalyses.find((a) => {
            if (where.productId && a.productId !== where.productId) return false;
            if (where.inputHash && a.inputHash !== where.inputHash) return false;
            if (where.status && a.status !== where.status) return false;
            if (where.analysisVersion && a.analysisVersion !== where.analysisVersion) return false;
            return true;
          });
          if (!item) return null;
          const res = { ...item };
          if (include?.schemeRecommendations) {
            res.schemeRecommendations = mockProductSchemeRecommendations
              .filter((r) => r.analysisId === item.id)
              .sort((a, b) => a.rank - b.rank)
              .map((r) => {
                const rCopy = { ...r };
                if (include.schemeRecommendations.include?.scheme) {
                  rCopy.scheme = mockSchemes.find((s) => s.id === r.schemeId) || {};
                }
                if (include.schemeRecommendations.include?.standard) {
                  rCopy.standard = mockStandards.find((s) => s.id === r.standardId) || {};
                }
                return rCopy;
              });
          }
          if (include?.feeEstimates) {
            res.feeEstimates = mockCertificationFeeEstimates.filter((f) => f.analysisId === item.id);
          }
          if (include?.documentationChecklist) {
            res.documentationChecklist = mockProductDocumentationChecklistItems
              .filter((d) => d.analysisId === item.id)
              .sort((a, b) => a.rank - b.rank);
          }
          if (include?.applicationRequirements) {
            res.applicationRequirements = mockProductApplicationRequirementItems
              .filter((a) => a.analysisId === item.id)
              .sort((a, b) => a.rank - b.rank);
          }
          if (include?.qcoInformation) {
            res.qcoInformation = mockProductQcoInformationItems
              .filter((q) => q.analysisId === item.id)
              .map((q) => ({
                ...q,
                qco: mockQCOs.find((o) => o.id === q.qcoId) || {},
                standard: mockStandards.find((s) => s.id === q.standardId) || {},
              }));
          }
          return res;
        }),
      },
      scheme: {
        findUnique: vi.fn().mockImplementation(async ({ where, include }: any) => {
          const s = mockSchemes.find((item) => item.id === where.id);
          if (!s) return null;
          const res = { ...s };
          if (include?.sourceDocument) {
            res.sourceDocument = mockSourceDocuments.find((d) => d.id === s.sourceDocumentId) || null;
          }
          if (include?.standardMappings) {
            res.standardMappings = mockStandardSchemeMappings
              .filter((m) => m.schemeId === s.id)
              .map((m) => ({
                ...m,
                standard: mockStandards.find((std) => std.id === m.standardId) || {},
              }));
          }
          return res;
        }),
      },
      productSchemeReview: {
        findMany: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockProductSchemeReviews.filter((r) => {
            if (where.productId && r.productId !== where.productId) return false;
            return true;
          });
        }),
        upsert: vi.fn().mockImplementation(async ({ where, create, update }: any) => {
          const { productId_schemeId } = where;
          let existing = mockProductSchemeReviews.find(
            (r) => r.productId === productId_schemeId.productId && r.schemeId === productId_schemeId.schemeId
          );
          if (existing) {
            Object.assign(existing, update, { updatedAt: new Date() });
            return existing;
          }
          const item = {
            id: `rev-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            ...create,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockProductSchemeReviews.push(item);
          return item;
        }),
      },
      standard: {
        findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockStandards.find((s) => s.id === where.id) || null;
        }),
      },
    },
  };
});

describe('Phase 7 — Certification Intelligence & Scheme Recommendation Tests', () => {
  let app: any;
  let user1Token: string;
  let user2Token: string;

  const user1Id = '11111111-1111-1111-1111-111111111111';
  const user2Id = '22222222-2222-2222-2222-222222222222';
  const prod1Id = 'prod-uuid-1111-1111';
  const prod2Id = 'prod-uuid-2222-2222';
  const scheme1Id = 'scheme-isi-id';

  beforeAll(async () => {
    const sessionModule = await import('../src/services/session.service.js');
    const appModule = await import('../src/app.js');

    app = appModule.app;

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
    mockProductCertificationAnalyses = [];
    mockProductSchemeRecommendations = [];
    mockProductSchemeReviews = [];
    mockCertificationFeeEstimates = [];
    mockProductDocumentationChecklistItems = [];
    mockProductApplicationRequirementItems = [];
    mockProductQcoInformationItems = [];
    mockStandards = [];
    mockSchemes = [];
    mockStandardSchemeMappings = [];
    mockProductManuals = [];
    mockSourceDocuments = [];
    mockQCOs = [];
    mockQCOStandardMappings = [];
    mockKnowledgeChunks = [];

    // Setup Seed Data
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

    const scheme1 = {
      id: scheme1Id,
      code: 'SCHEME_I_ISI',
      name: 'Scheme-I (ISI Mark Certification Scheme)',
      description: 'Conformity assessment scheme governed by BIS (Conformity Assessment) Regulations, 2018.',
      sourceDocumentId: srcDoc1.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockSchemes.push(scheme1);

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

    const mapping1 = {
      id: 'map-1',
      standardId: std1.id,
      schemeId: scheme1.id,
      notes: 'Mandatory factory inspection and testing.',
      sourceDocumentId: srcDoc1.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockStandardSchemeMappings.push(mapping1);

    const qco1 = {
      id: 'qco-1',
      name: 'Electrical Appliances (Quality Control) Order',
      orderNumber: 'S.O. 2291(E)',
      ministry: 'Ministry of Heavy Industries and Public Enterprises',
      notificationDate: new Date('2003-10-09'),
      effectiveDate: new Date('2004-04-01'),
      status: 'IN_FORCE',
      documentUrl: 'https://egazette.gov.in/WriteReadData/2003/SO2291E.pdf',
      sourceDocumentId: srcDoc1.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockQCOs.push(qco1);

    const qcoMap1 = {
      id: 'qco-map-1',
      qcoId: qco1.id,
      standardId: std1.id,
      productDescription: 'General purpose lighting luminaires and fittings',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockQCOStandardMappings.push(qcoMap1);

    const manual1 = {
      id: 'pm-1',
      standardId: std1.id,
      title: 'Product Manual for General Purpose Luminaires as per IS 10322 (Part 5/Sec 1)',
      version: 'PM/10322-5-1/1',
      publicationDate: new Date('2020-05-10'),
      documentUrl: 'https://www.manakonline.in/product_manuals/PM_10322_5_1.pdf',
      sourceDocumentId: srcDoc1.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockProductManuals.push(manual1);

    // Products Setup
    const prod1 = {
      id: prod1Id,
      userId: user1Id,
      name: 'LED Street Lighting Luminaire 50W',
      category: 'Electrical Equipment & Luminaires',
      description: 'Outdoor street lighting fitting with high-efficiency LED module',
      intendedUse: 'Outdoor municipal street lighting and roadway illumination',
      manufacturerName: 'Bharat Electronics Lighting Ltd',
      manufacturerAddress: 'Plot 42, Industrial Area, Okhla Phase III, New Delhi',
      targetMarket: 'India',
      status: 'ACTIVE',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockProducts.push(prod1);

    // Phase 6 Standard Analysis for Prod 1
    const standardAnalysis1 = {
      id: 'std-analysis-1',
      productId: prod1Id,
      status: 'COMPLETED',
      analysisVersion: '1.0.0',
      inputHash: 'abcdef1234567890',
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockProductStandardAnalyses.push(standardAnalysis1);

    const match1 = {
      id: 'match-1',
      analysisId: standardAnalysis1.id,
      standardId: std1.id,
      relevanceScore: 0.94,
      matchLevel: 'HIGHLY_RELEVANT',
      reasons: ['Direct standard match'],
      evidence: {},
      rank: 1,
      createdAt: new Date(),
    };
    mockProductStandardMatches.push(match1);

    // Prod 2 (owned by User 2)
    const prod2 = {
      id: prod2Id,
      userId: user2Id,
      name: 'Other User Appliance',
      category: 'Appliances',
      status: 'ACTIVE',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockProducts.push(prod2);
  });

  it('1. Rejects unauthenticated requests with 401 UNAUTHORIZED', async () => {
    const res = await request(app).post(`/api/v1/products/${prod1Id}/certification/analyze`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('2. Prevents non-owner product access with 404/403 IDOR protection', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${prod2Id}/certification/analyze`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ forceRefresh: false });

    expect(res.status).toBe(404);
  });

  it('3. Generates valid certification intelligence analysis for owner product', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${prod1Id}/certification/analyze`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ forceRefresh: true });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');

    const analysis = res.body.data;
    expect(analysis.status).toBe('COMPLETED');
    expect(analysis.productId).toBe(prod1Id);
    expect(analysis.analysisVersion).toBe('1.0.0');
    expect(analysis.schemes.length).toBeGreaterThan(0);
    expect(analysis.fromCache).toBe(false);

    // Verify Scheme Recommendation
    const schemeRec = analysis.schemes[0];
    expect(schemeRec.schemeCode).toBe('SCHEME_I_ISI');
    expect(schemeRec.relevanceLevel).toBe('RELEVANT');
    expect(schemeRec.confidenceScore).toBeGreaterThanOrEqual(0.85);
    expect(schemeRec.reasons.length).toBeGreaterThan(0);
  });

  it('4. Resolves Scheme-I (ISI Mark) with authoritative source evidence and QCO mandate', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${prod1Id}/certification/analyze`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ forceRefresh: true });

    const analysis = res.body.data;
    const scheme = analysis.schemes.find((s: any) => s.schemeCode === 'SCHEME_I_ISI');
    expect(scheme).toBeDefined();
    expect(scheme.standardIsNumber).toBe('IS 10322 (Part 5/Sec 1) : 2012');
    expect(scheme.reasons.some((r: string) => r.includes('Direct conformity assessment mapping'))).toBe(true);
    expect(scheme.reasons.some((r: string) => r.includes('Quality Control Order'))).toBe(true);

    // Evidence
    expect(scheme.evidence.productManual).toBeDefined();
    expect(scheme.evidence.productManual.title).toContain('Product Manual for General Purpose Luminaires');
  });

  it('5. Extracts mandatory QCO gazette information', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${prod1Id}/certification/analyze`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ forceRefresh: true });

    const analysis = res.body.data;
    expect(analysis.qcoInformation.length).toBe(1);

    const qco = analysis.qcoInformation[0];
    expect(qco.orderNumber).toBe('S.O. 2291(E)');
    expect(qco.qcoTitle).toBe('Electrical Appliances (Quality Control) Order');
    expect(qco.isMandatory).toBe(true);
    expect(qco.sourceUrl).toBe('https://egazette.gov.in/WriteReadData/2003/SO2291E.pdf');
  });

  it('6. Builds statutory documentation checklist with required statuses', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${prod1Id}/certification/analyze`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ forceRefresh: true });

    const analysis = res.body.data;
    expect(analysis.documentation.length).toBeGreaterThanOrEqual(4);

    const requiredDocs = analysis.documentation.filter((d: any) => d.requiredStatus === 'REQUIRED');
    expect(requiredDocs.length).toBeGreaterThan(0);

    const premDoc = analysis.documentation.find((d: any) => d.documentName.includes('Proof of Manufacturing Premises'));
    expect(premDoc).toBeDefined();
    expect(premDoc.category).toBe('Legal & Organization');
    expect(premDoc.requiredStatus).toBe('REQUIRED');
  });

  it('7. Builds statutory application requirements with Form-I for Scheme-I', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${prod1Id}/certification/analyze`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ forceRefresh: true });

    const analysis = res.body.data;
    expect(analysis.applicationRequirements.length).toBeGreaterThan(0);

    const form1 = analysis.applicationRequirements.find((r: any) => r.formName.includes('Form-I'));
    expect(form1).toBeDefined();
    expect(form1.officialUrl).toBe('https://www.manakonline.in');
    expect(form1.applicableScheme).toContain('Scheme-I');
  });

  it('8. Retrieves official and variable fee estimates without fabricating numbers', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${prod1Id}/certification/analyze`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ forceRefresh: true });

    const analysis = res.body.data;
    expect(analysis.fees.length).toBeGreaterThan(0);

    const appFee = analysis.fees.find((f: any) => f.feeType === 'APPLICATION_FEE');
    expect(appFee).toBeDefined();
    expect(appFee.amount).toBe(1000);
    expect(appFee.status).toBe('OFFICIAL_FEE');

    const testingFee = analysis.fees.find((f: any) => f.feeType === 'TESTING_FEE');
    expect(testingFee).toBeDefined();
    expect(testingFee.status).toBe('VARIABLE');
    expect(testingFee.amount).toBeNull();
  });

  it('9. Reuses cached analysis using SHA-256 input hash on identical inputs', async () => {
    // Run 1
    const res1 = await request(app)
      .post(`/api/v1/products/${prod1Id}/certification/analyze`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ forceRefresh: false });

    expect(res1.body.data.fromCache).toBe(false);

    // Run 2 without forceRefresh
    const res2 = await request(app)
      .post(`/api/v1/products/${prod1Id}/certification/analyze`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ forceRefresh: false });

    expect(res2.body.data.fromCache).toBe(true);
    expect(res2.body.data.inputHash).toBe(res1.body.data.inputHash);
  });

  it('10. Forces recomputation when forceRefresh is true', async () => {
    // Initial Run
    await request(app)
      .post(`/api/v1/products/${prod1Id}/certification/analyze`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ forceRefresh: false });

    // Force Refresh Run
    const res = await request(app)
      .post(`/api/v1/products/${prod1Id}/certification/analyze`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ forceRefresh: true });

    expect(res.status).toBe(200);
    expect(res.body.data.fromCache).toBe(false);
  });

  it('11. Allows user to record and retrieve scheme review decisions', async () => {
    const postReviewRes = await request(app)
      .post(`/api/v1/products/${prod1Id}/certification/reviews`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        schemeId: scheme1Id,
        decision: 'CONFIRMED',
        note: 'Verified applicable ISI mark route with quality control team.',
      });

    expect(postReviewRes.status).toBe(200);
    expect(postReviewRes.body.data.decision).toBe('CONFIRMED');

    // Get Reviews
    const getReviewsRes = await request(app)
      .get(`/api/v1/products/${prod1Id}/certification/reviews`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(getReviewsRes.status).toBe(200);
    expect(getReviewsRes.body.data.length).toBe(1);
    expect(getReviewsRes.body.data[0].schemeId).toBe(scheme1Id);
    expect(getReviewsRes.body.data[0].decision).toBe('CONFIRMED');
  });

  it('12. Rejects invalid review decision with 400 INVALID_DECISION', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${prod1Id}/certification/reviews`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        schemeId: scheme1Id,
        decision: 'INVALID_STATUS',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('13. Retrieves scheme detail endpoint with associated standards and documents', async () => {
    const res = await request(app)
      .get(`/api/v1/products/${prod1Id}/certification/schemes/${scheme1Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.scheme.code).toBe('SCHEME_I_ISI');
    expect(res.body.data.documentation.length).toBeGreaterThan(0);
    expect(res.body.data.fees.length).toBeGreaterThan(0);
  });

  it('14. Returns latest completed certification analysis via GET endpoint', async () => {
    // Ensure an analysis is generated
    await request(app)
      .post(`/api/v1/products/${prod1Id}/certification/analyze`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ forceRefresh: false });

    const res = await request(app)
      .get(`/api/v1/products/${prod1Id}/certification`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).not.toBeNull();
    expect(res.body.data.productId).toBe(prod1Id);
  });
});
