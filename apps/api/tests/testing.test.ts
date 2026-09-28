process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.JWT_SECRET = 'test-jwt-secret-must-be-at-least-32-characters-long!';

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
let mockProductTestingAnalyses: any[] = [];
let mockProductTestRequirements: any[] = [];
let mockProductTestEquipments: any[] = [];
let mockProductCalibrationRequirements: any[] = [];
let mockProductExternalLabRequirements: any[] = [];
let mockLaboratories: any[] = [];
let mockLaboratoryCapabilities: any[] = [];
let mockProductLaboratoryReviews: any[] = [];
let mockStandards: any[] = [];
let mockSchemes: any[] = [];
let mockProductManuals: any[] = [];
let mockSourceDocuments: any[] = [];
let mockAuditLogs: any[] = [];

vi.mock('../src/db/client.js', () => {
  return {
    checkDatabaseHealth: vi.fn().mockResolvedValue({ connected: true, latencyMs: 1 }),
    disconnectDatabase: vi.fn().mockResolvedValue(undefined),
    prisma: {
      $transaction: vi.fn().mockImplementation(async (callback: any) => {
        return callback({
          productTestingAnalysis: {
            create: vi.fn().mockImplementation(async ({ data }: any) => {
              const item = {
                id: `test-analysis-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              mockProductTestingAnalyses.push(item);
              return item;
            }),
            findUnique: vi.fn().mockImplementation(async ({ where, include }: any) => {
              const item = mockProductTestingAnalyses.find((a) => a.id === where.id);
              if (!item) return null;
              const res = { ...item };
              if (include?.requirements) {
                res.requirements = mockProductTestRequirements
                  .filter((r) => r.analysisId === item.id)
                  .sort((a, b) => a.rank - b.rank);
              }
              if (include?.equipment) {
                res.equipment = mockProductTestEquipments
                  .filter((e) => e.analysisId === item.id)
                  .sort((a, b) => a.rank - b.rank);
              }
              if (include?.calibration) {
                res.calibration = mockProductCalibrationRequirements
                  .filter((c) => c.analysisId === item.id)
                  .sort((a, b) => a.rank - b.rank);
              }
              if (include?.laboratoryRequirements) {
                res.laboratoryRequirements = mockProductExternalLabRequirements
                  .filter((l) => l.analysisId === item.id)
                  .sort((a, b) => a.rank - b.rank);
              }
              return res;
            }),
          },
          productTestRequirement: {
            create: vi.fn().mockImplementation(async ({ data }: any) => {
              const item = { id: `req-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date() };
              mockProductTestRequirements.push(item);
              return item;
            }),
          },
          productTestEquipment: {
            create: vi.fn().mockImplementation(async ({ data }: any) => {
              const item = { id: `equip-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date() };
              mockProductTestEquipments.push(item);
              return item;
            }),
          },
          productCalibrationRequirement: {
            create: vi.fn().mockImplementation(async ({ data }: any) => {
              const item = { id: `cal-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date() };
              mockProductCalibrationRequirements.push(item);
              return item;
            }),
          },
          productExternalLabRequirement: {
            create: vi.fn().mockImplementation(async ({ data }: any) => {
              const item = { id: `labreq-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date() };
              mockProductExternalLabRequirements.push(item);
              return item;
            }),
          },
        });
      }),
      product: {
        findFirst: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockProducts.find((p) => {
            if (where.id && p.id !== where.id) return false;
            if (where.userId && p.userId !== where.userId) return false;
            if (where.isActive !== undefined && p.isActive !== where.isActive) return false;
            return true;
          }) || null;
        }),
      },
      productAttribute: {
        findMany: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockProductAttributes.filter((a) => a.productId === where.productId);
        }),
      },
      productStandardAnalysis: {
        findFirst: vi.fn().mockImplementation(async ({ where, include }: any) => {
          const item = mockProductStandardAnalyses.find(
            (a) => a.productId === where.productId && (where.status ? a.status === where.status : true)
          );
          if (!item) return null;
          const res = { ...item };
          if (include?.matches) {
            res.matches = mockProductStandardMatches
              .filter((m) => m.analysisId === item.id)
              .map((m) => ({
                ...m,
                standard: mockStandards.find((s) => s.id === m.standardId),
              }));
          }
          return res;
        }),
      },
      productStandardReview: {
        findMany: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockProductStandardReviews.filter((r) => r.productId === where.productId);
        }),
      },
      productCertificationAnalysis: {
        findFirst: vi.fn().mockImplementation(async ({ where, include }: any) => {
          const item = mockProductCertificationAnalyses.find(
            (a) => a.productId === where.productId && (where.status ? a.status === where.status : true)
          );
          if (!item) return null;
          const res = { ...item };
          if (include?.schemeRecommendations) {
            res.schemeRecommendations = mockProductSchemeRecommendations
              .filter((r) => r.analysisId === item.id)
              .map((r) => ({
                ...r,
                scheme: mockSchemes.find((s) => s.id === r.schemeId),
                standard: mockStandards.find((s) => s.id === r.standardId),
              }));
          }
          return res;
        }),
      },
      productSchemeReview: {
        findMany: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockProductSchemeReviews.filter((r) => r.productId === where.productId);
        }),
      },
      productTestingAnalysis: {
        findFirst: vi.fn().mockImplementation(async ({ where, include }: any) => {
          let matches = mockProductTestingAnalyses.filter((a) => {
            if (where.productId && a.productId !== where.productId) return false;
            if (where.inputHash && a.inputHash !== where.inputHash) return false;
            if (where.status && a.status !== where.status) return false;
            if (where.analysisVersion && a.analysisVersion !== where.analysisVersion) return false;
            return true;
          });
          const item = matches[matches.length - 1];
          if (!item) return null;
          const res = { ...item };
          if (include?.requirements) {
            res.requirements = mockProductTestRequirements
              .filter((r) => r.analysisId === item.id)
              .map((r) => ({
                ...r,
                standard: mockStandards.find((s) => s.id === r.standardId),
                scheme: mockSchemes.find((s) => s.id === r.schemeId),
              }));
          }
          if (include?.equipment) {
            res.equipment = mockProductTestEquipments.filter((e) => e.analysisId === item.id);
          }
          if (include?.calibration) {
            res.calibration = mockProductCalibrationRequirements.filter((c) => c.analysisId === item.id);
          }
          if (include?.laboratoryRequirements) {
            res.laboratoryRequirements = mockProductExternalLabRequirements.filter((l) => l.analysisId === item.id);
          }
          return res;
        }),
      },
      productTestRequirement: {
        findMany: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockProductTestRequirements.filter((r) => r.analysisId === where.analysisId);
        }),
      },
      laboratory: {
        findMany: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockLaboratories.filter((l) => {
            if (where.isActive !== undefined && l.isActive !== where.isActive) return false;
            if (where.state?.contains && !l.state.toLowerCase().includes(where.state.contains.toLowerCase())) return false;
            if (where.city?.contains && !l.city.toLowerCase().includes(where.city.contains.toLowerCase())) return false;
            if (where.isNabl && !l.isNabl) return false;
            return true;
          }).map((lab) => ({
            ...lab,
            capabilities: mockLaboratoryCapabilities
              .filter((c) => c.laboratoryId === lab.id)
              .map((c) => ({
                ...c,
                standard: mockStandards.find((s) => s.id === c.standardId),
              })),
            sourceDocument: mockSourceDocuments.find((d) => d.id === lab.sourceDocumentId),
          }));
        }),
        findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockLaboratories.find((l) => l.id === where.id) || null;
        }),
      },
      laboratoryCapability: {
        findMany: vi.fn().mockImplementation(async () => mockLaboratoryCapabilities),
      },
      productLaboratoryReview: {
        findMany: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockProductLaboratoryReviews
            .filter((r) => r.productId === where.productId)
            .map((r) => ({
              ...r,
              laboratory: mockLaboratories.find((l) => l.id === r.laboratoryId),
            }));
        }),
        upsert: vi.fn().mockImplementation(async ({ where, create, update }: any) => {
          const idx = mockProductLaboratoryReviews.findIndex(
            (r) => r.productId === where.productId_laboratoryId.productId && r.laboratoryId === where.productId_laboratoryId.laboratoryId
          );
          if (idx >= 0) {
            mockProductLaboratoryReviews[idx] = {
              ...mockProductLaboratoryReviews[idx],
              ...update,
              updatedAt: new Date(),
            };
            return {
              ...mockProductLaboratoryReviews[idx],
              laboratory: mockLaboratories.find((l) => l.id === mockProductLaboratoryReviews[idx].laboratoryId),
            };
          } else {
            const newItem = {
              id: `lab-rev-${Date.now()}`,
              ...create,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            mockProductLaboratoryReviews.push(newItem);
            return {
              ...newItem,
              laboratory: mockLaboratories.find((l) => l.id === newItem.laboratoryId),
            };
          }
        }),
        updateMany: vi.fn().mockImplementation(async ({ where, data }: any) => {
          let count = 0;
          mockProductLaboratoryReviews.forEach((r) => {
            if (r.productId === where.productId && r.decision === where.decision) {
              r.decision = data.decision;
              count++;
            }
          });
          return { count };
        }),
      },
      standard: {
        findMany: vi.fn().mockImplementation(async ({ where }: any) => {
          if (where?.id?.in) {
            return mockStandards.filter((s) => where.id.in.includes(s.id));
          }
          return mockStandards;
        }),
        findFirst: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockStandards.find((s) => s.id === where.id || s.isNumber === where.isNumber) || null;
        }),
      },
      productManual: {
        findFirst: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockProductManuals.find((m) => m.standardId === where.standardId) || null;
        }),
      },
      auditLog: {
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          const item = { id: `audit-${Date.now()}`, ...data, createdAt: new Date() };
          mockAuditLogs.push(item);
          return item;
        }),
      },
    },
  };
});

describe('Phase 8 — Testing & Laboratory Intelligence API Tests', () => {
  let app: any;
  let generateAccessToken: any;
  const testUserId = '00000000-0000-0000-0000-000000000001';
  const otherUserId = '00000000-0000-0000-0000-000000000002';
  let authCookie: string;
  let otherAuthCookie: string;

  const testProduct = {
    id: 'prod-led-street-light-1',
    userId: testUserId,
    name: 'Industrial LED Street Luminaire 120W',
    category: 'LED Lighting',
    intendedUse: 'Outdoor highway illumination',
    manufacturerName: 'Bharat Luminaires Ltd',
    isActive: true,
  };

  const testStandard = {
    id: 'std-10322-5-1',
    isNumber: 'IS 10322 (Part 5/Sec 1) : 2012',
    canonicalNumber: 'IS10322PART5SEC1',
    title: 'Luminaires - Part 5: Particular Requirements - Section 1: General Purpose Luminaires',
    sourceDocumentId: 'src-doc-1',
    sourceDocument: {
      id: 'src-doc-1',
      title: 'BIS Know Your Standard — IS 10322',
      url: 'https://www.services.bis.gov.in/is10322',
      authorityLevel: 'AUTHORITATIVE',
    },
  };

  const testScheme = {
    id: 'scheme-isi-1',
    code: 'SCHEME_I_ISI',
    name: 'Scheme-I (ISI Mark Certification Scheme)',
    description: 'Product certification scheme.',
  };

  const testLab = {
    id: 'lab-bis-central-1',
    name: 'BIS Central Laboratory',
    code: 'BIS-CL-01',
    organizationType: 'BIS_AND_NABL',
    address: 'Site IV, Sahibabad Industrial Area',
    city: 'Ghaziabad',
    state: 'Uttar Pradesh',
    country: 'India',
    pincode: '201010',
    phone: '+91-120-4177100',
    email: 'cl@bis.gov.in',
    website: 'https://www.lims.bis.gov.in',
    isNabl: true,
    isBisLab: true,
    status: 'ACTIVE',
    sourceDocumentId: 'src-doc-lab-1',
    sourceUrl: 'https://www.lims.bis.gov.in/cl',
    authorityLevel: 'AUTHORITATIVE',
    isVerified: true,
    isActive: true,
    lastVerifiedAt: new Date(),
  };

  const testLabCapability = {
    id: 'cap-lab-1',
    laboratoryId: 'lab-bis-central-1',
    standardId: 'std-10322-5-1',
    testName: 'Complete Safety and Electrical Tests for Luminaires',
    testMethod: 'IS 10322 (Part 5/Sec 1)',
    scopeDescription: 'Insulation resistance, electric strength, thermal endurance, IP54/65',
    accreditationStatus: 'ACCREDITED',
    recognitionStatus: 'BIS_RECOGNIZED',
    sourceUrl: 'https://www.lims.bis.gov.in/scopes/10322',
    authorityLevel: 'AUTHORITATIVE',
    verifiedAt: new Date(),
  };

  beforeAll(async () => {
    const appModule = await import('../src/app.js');
    app = appModule.app;

    const sessionModule = await import('../src/services/session.service.js');
    generateAccessToken = sessionModule.createAuthToken;

    const userPayload = {
      id: testUserId,
      email: 'tester@bis.gov.in',
      name: 'BIS Tester',
      role: 'USER' as const,
    };
    const token = generateAccessToken(userPayload);
    authCookie = `bis_auth_token=${token}`;

    const otherUserPayload = {
      id: otherUserId,
      email: 'other@bis.gov.in',
      name: 'Other User',
      role: 'USER' as const,
    };
    const otherToken = generateAccessToken(otherUserPayload);
    otherAuthCookie = `bis_auth_token=${otherToken}`;
  });


  beforeEach(() => {
    mockProducts = [testProduct];
    mockProductAttributes = [
      {
        id: 'attr-1',
        productId: testProduct.id,
        attributeKey: 'wattage',
        attributeValue: '120W',
        normalizedValue: '120 W',
      },
    ];
    mockStandards = [testStandard];
    mockSchemes = [testScheme];
    mockSourceDocuments = [
      {
        id: 'src-doc-1',
        title: 'BIS Know Your Standard — IS 10322',
        url: 'https://www.services.bis.gov.in/is10322',
        authorityLevel: 'AUTHORITATIVE',
      },
    ];
    mockLaboratories = [testLab];
    mockLaboratoryCapabilities = [testLabCapability];
    mockProductStandardAnalyses = [
      {
        id: 'std-analysis-1',
        productId: testProduct.id,
        status: 'COMPLETED',
        analysisVersion: '1.0.0',
        inputHash: 'input-hash-std-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    mockProductStandardMatches = [
      {
        id: 'match-1',
        analysisId: 'std-analysis-1',
        standardId: testStandard.id,
        relevanceScore: 0.95,
        matchLevel: 'HIGHLY_RELEVANT',
        rank: 1,
        matchReasons: ['Title match', 'Category match'],
        applicabilityNotes: 'Applicable standard for LED luminaires',
        createdAt: new Date(),
      },
    ];
    mockProductCertificationAnalyses = [
      {
        id: 'cert-analysis-1',
        productId: testProduct.id,
        status: 'COMPLETED',
        analysisVersion: '1.0.0',
        inputHash: 'input-hash-cert-1',
        readinessStatus: 'READY_FOR_APPLICATION',
        summary: 'Product is ready for Scheme-I certification.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    mockProductSchemeRecommendations = [
      {
        id: 'rec-1',
        analysisId: 'cert-analysis-1',
        schemeId: testScheme.id,
        standardId: testStandard.id,
        relevanceLevel: 'RELEVANT',
        rank: 1,
        recommendationRationale: 'Mandatory ISI Mark under Scheme-I.',
        applicationRoute: 'Normal Procedure / Simplified Procedure',
        auditFrequency: 'Annual',
        createdAt: new Date(),
      },
    ];
    mockProductTestingAnalyses = [];
    mockProductTestRequirements = [];
    mockProductTestEquipments = [];
    mockProductCalibrationRequirements = [];
    mockProductExternalLabRequirements = [];
    mockProductLaboratoryReviews = [];
    mockAuditLogs = [];
  });

  it('1. Rejects unauthenticated testing analysis with 401 Unauthorized', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${testProduct.id}/testing/analyze`)
      .send({ forceRefresh: false });

    expect(res.status).toBe(401);
  });

  it('2. Rejects non-owner product access with 404/403 (IDOR Protection)', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${testProduct.id}/testing/analyze`)
      .set('Cookie', otherAuthCookie)
      .send({ forceRefresh: false });

    expect(res.status).toBe(404);
  });

  it('3. Runs valid testing intelligence analysis and returns structured test parameters and readiness', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${testProduct.id}/testing/analyze`)
      .set('Cookie', authCookie)
      .send({ forceRefresh: true });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toBeDefined();

    const data = res.body.data;
    expect(data.status).toBe('COMPLETED');
    expect(data.analysisVersion).toBe('1.0.0');
    expect(data.inputHash).toBeDefined();
    expect(data.requirements.length).toBeGreaterThan(0);
    expect(data.equipment.length).toBeGreaterThan(0);
    expect(data.calibration.length).toBeGreaterThan(0);
    expect(data.laboratoryRequirements.length).toBeGreaterThan(0);
    expect(data.readiness).toBeDefined();
    expect(data.readiness.score).toBeGreaterThanOrEqual(40);
  });

  it('4. Correctly extracts structured STI parameters with clause, parameter, unit, and testMethod', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${testProduct.id}/testing/analyze`)
      .set('Cookie', authCookie)
      .send({ forceRefresh: true });

    expect(res.status).toBe(200);
    const reqs = res.body.data.requirements;
    const elecReq = reqs.find((r: any) => r.testName.includes('Insulation Resistance'));

    expect(elecReq).toBeDefined();
    expect(elecReq.testCategory).toBe('ELECTRICAL');
    expect(elecReq.clause).toBeDefined();
    expect(elecReq.testMethod).toContain('IS 10322');
    expect(elecReq.parameter).toBeDefined();
    expect(elecReq.requirementValue).toBeDefined();
    expect(elecReq.applicability).toBe('BOTH');
  });

  it('5. Correctly extracts factory test equipment checklist and calibration requirements', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${testProduct.id}/testing/analyze`)
      .set('Cookie', authCookie)
      .send({ forceRefresh: true });

    expect(res.status).toBe(200);
    const equipment = res.body.data.equipment;
    const calibration = res.body.data.calibration;

    expect(equipment.length).toBeGreaterThan(0);
    const hvTester = equipment.find((e: any) => e.equipmentName.includes('High Voltage Breakdown'));
    expect(hvTester).toBeDefined();
    expect(hvTester.calibrationRequired).toBe(true);
    expect(hvTester.calibrationInterval).toBe('12 Months');

    const calReq = calibration.find((c: any) => c.equipmentName.includes('High Voltage Breakdown'));
    expect(calReq).toBeDefined();
    expect(calReq.traceabilityStandard).toContain('NABL');
  });

  it('6. Evaluates external laboratory requirement based on certification scheme', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${testProduct.id}/testing/analyze`)
      .set('Cookie', authCookie)
      .send({ forceRefresh: true });

    expect(res.status).toBe(200);
    const labReqs = res.body.data.laboratoryRequirements;
    expect(labReqs.length).toBeGreaterThan(0);
    expect(labReqs[0].requirementType).toBe('EXTERNAL_LAB_REQUIRED');
    expect(labReqs[0].reason).toContain('Scheme-I');
  });

  it('7. Matches registered laboratories with capability match scoring', async () => {
    const res = await request(app)
      .get(`/api/v1/products/${testProduct.id}/testing/laboratories`)
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    const labs = res.body.data;
    expect(labs.length).toBeGreaterThan(0);
    expect(labs[0].laboratory.name).toBe('BIS Central Laboratory');
    expect(labs[0].capabilityMatch).toBe('HIGH');
    expect(labs[0].recognitionStatus).toBe('BIS_RECOGNIZED');
    expect(labs[0].accreditationStatus).toBe('ACCREDITED');
  });

  it('8. Supports location filtering on laboratory discovery', async () => {
    const res = await request(app)
      .get(`/api/v1/products/${testProduct.id}/testing/laboratories?state=Uttar%20Pradesh`)
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);

    const emptyRes = await request(app)
      .get(`/api/v1/products/${testProduct.id}/testing/laboratories?state=Kerala`)
      .set('Cookie', authCookie);

    expect(emptyRes.status).toBe(200);
    expect(emptyRes.body.data.length).toBe(0);
  });

  it('9. Allows authenticated user to shortlist and select a testing laboratory', async () => {
    // 1. Shortlist
    const shortlistRes = await request(app)
      .post(`/api/v1/products/${testProduct.id}/testing/laboratories/reviews`)
      .set('Cookie', authCookie)
      .send({
        laboratoryId: testLab.id,
        decision: 'SHORTLISTED',
        note: 'Quotation requested from Sahibabad lab.',
      });

    expect(shortlistRes.status).toBe(201);
    expect(shortlistRes.body.data.decision).toBe('SHORTLISTED');
    expect(shortlistRes.body.data.note).toBe('Quotation requested from Sahibabad lab.');

    // 2. Select
    const selectRes = await request(app)
      .post(`/api/v1/products/${testProduct.id}/testing/laboratories/reviews`)
      .set('Cookie', authCookie)
      .send({
        laboratoryId: testLab.id,
        decision: 'SELECTED',
        note: 'Selected as primary testing facility.',
      });

    expect(selectRes.status).toBe(201);
    expect(selectRes.body.data.decision).toBe('SELECTED');

    // 3. Fetch reviews
    const getRes = await request(app)
      .get(`/api/v1/products/${testProduct.id}/testing/laboratories/reviews`)
      .set('Cookie', authCookie);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.length).toBe(1);
    expect(getRes.body.data[0].decision).toBe('SELECTED');
  });

  it('10. Caches testing analysis using SHA-256 input hash and respects forceRefresh', async () => {
    // 1. First run
    const res1 = await request(app)
      .post(`/api/v1/products/${testProduct.id}/testing/analyze`)
      .set('Cookie', authCookie)
      .send({ forceRefresh: false });

    expect(res1.status).toBe(200);
    const id1 = res1.body.data.id;
    const hash1 = res1.body.data.inputHash;

    // 2. Second run without refresh (cache hit)
    const res2 = await request(app)
      .post(`/api/v1/products/${testProduct.id}/testing/analyze`)
      .set('Cookie', authCookie)
      .send({ forceRefresh: false });

    expect(res2.status).toBe(200);
    expect(res2.body.data.id).toBe(id1);
    expect(res2.body.data.inputHash).toBe(hash1);

    // 3. Force refresh
    const res3 = await request(app)
      .post(`/api/v1/products/${testProduct.id}/testing/analyze`)
      .set('Cookie', authCookie)
      .send({ forceRefresh: true });

    expect(res3.status).toBe(200);
    expect(res3.body.data.inputHash).toBe(hash1);
  });

  it('11. Preserves source provenance and rejects unverified source entities', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${testProduct.id}/testing/analyze`)
      .set('Cookie', authCookie)
      .send({ forceRefresh: true });

    expect(res.status).toBe(200);
    const sources = res.body.data.sources;
    expect(sources.length).toBeGreaterThan(0);
    sources.forEach((s: any) => {
      expect(s.url).toBeDefined();
      expect(s.title).toBeDefined();
      expect(s.authorityLevel).toBe('AUTHORITATIVE');
    });
  });

  it('12. Logs audit trail events on testing analysis and laboratory reviews', async () => {
    await request(app)
      .post(`/api/v1/products/${testProduct.id}/testing/analyze`)
      .set('Cookie', authCookie)
      .send({ forceRefresh: true });

    await request(app)
      .post(`/api/v1/products/${testProduct.id}/testing/laboratories/reviews`)
      .set('Cookie', authCookie)
      .send({
        laboratoryId: testLab.id,
        decision: 'SHORTLISTED',
        note: 'Audit check note',
      });

    const actions = mockAuditLogs.map((l) => l.action);
    expect(actions).toContain('TESTING_ANALYSIS_STARTED');
    expect(actions).toContain('TESTING_ANALYSIS_COMPLETED');
    expect(actions).toContain('LABORATORY_SHORTLISTED');
  });

  it('13. Maintains Phase 6 Standard Intelligence stability without regression', async () => {
    const res = await request(app)
      .get(`/api/v1/products/${testProduct.id}/intelligence/analysis`)
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  it('14. Maintains Phase 7 Certification Intelligence stability without regression', async () => {
    const res = await request(app)
      .get(`/api/v1/products/${testProduct.id}/certification`)
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });
});
