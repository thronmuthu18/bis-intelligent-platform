process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.JWT_SECRET = 'test-jwt-secret-must-be-at-least-32-characters-long!';
process.env.BIS_VERIFICATION_PROVIDER = 'mock';

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// ── Mock Environment ──────────────────────────────────────────────────────────
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test_db');
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('LOG_LEVEL', 'error');
vi.stubEnv('FRONTEND_URL', 'http://localhost:5173');
vi.stubEnv('JWT_SECRET', 'test-jwt-secret-must-be-at-least-32-characters-long!');
vi.stubEnv('BIS_VERIFICATION_PROVIDER', 'mock');

// ── In-Memory Database Store for Consumer Tests ──────────────────────────────
let mockUsers: any[] = [];
let mockStandards: any[] = [];
let mockSourceDocuments: any[] = [];
let mockHallmarkingCentres: any[] = [];
let mockHallmarkVerifications: any[] = [];
let mockConsumerVerifications: any[] = [];
let mockAuditLogs: any[] = [];

vi.mock('../src/db/client.js', () => {
  return {
    checkDatabaseHealth: vi.fn().mockResolvedValue({ connected: true, latencyMs: 1 }),
    disconnectDatabase: vi.fn().mockResolvedValue(undefined),
    prisma: {
      user: {
        findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockUsers.find((u) => u.id === where.id || u.email === where.email) || null;
        }),
      },
      standard: {
        findMany: vi.fn().mockImplementation(async ({ where, include, take }: any) => {
          let list = [...mockStandards];
          if (where?.OR) {
            const orConditions = where.OR;
            list = list.filter((s) => {
              return orConditions.some((cond: any) => {
                if (cond.standardNumber && s.standardNumber?.toLowerCase().includes(cond.standardNumber.contains.toLowerCase())) return true;
                if (cond.title && s.title?.toLowerCase().includes(cond.title.contains.toLowerCase())) return true;
                if (cond.scope && s.scope?.toLowerCase().includes(cond.scope.contains.toLowerCase())) return true;
                if (cond.category && s.category?.toLowerCase().includes(cond.category.contains.toLowerCase())) return true;
                return false;
              });
            });
          }
          if (take) {
            list = list.slice(0, take);
          }
          return list.map((s) => ({
            ...s,
            sourceDocument: mockSourceDocuments.find((d) => d.id === s.sourceDocumentId) || null,
            qcoMappings: s.qcoMappings || [],
          }));
        }),
      },
      hallmarkingCentre: {
        count: vi.fn().mockImplementation(async ({ where }: any) => {
          if (!where || Object.keys(where).length === 0) {
            return mockHallmarkingCentres.length;
          }
          let list = [...mockHallmarkingCentres];
          if (where.state) {
            list = list.filter((c) => c.state.toLowerCase() === where.state.equals.toLowerCase());
          }
          if (where.city) {
            list = list.filter((c) => c.city.toLowerCase().includes(where.city.contains.toLowerCase()));
          }
          if (where.pincode) {
            list = list.filter((c) => c.pincode.startsWith(where.pincode.startsWith));
          }
          if (where.status) {
            list = list.filter((c) => c.status.toLowerCase() === where.status.equals.toLowerCase());
          }
          return list.length;
        }),
        findMany: vi.fn().mockImplementation(async ({ where, skip, take, distinct }: any) => {
          if (distinct && distinct.includes('state')) {
            const states = Array.from(new Set(mockHallmarkingCentres.map((c) => c.state))).map((st) => ({ state: st }));
            return states;
          }
          let list = [...mockHallmarkingCentres];
          if (where?.state) {
            list = list.filter((c) => c.state.toLowerCase() === where.state.equals.toLowerCase());
          }
          if (where?.city) {
            list = list.filter((c) => c.city.toLowerCase().includes(where.city.contains.toLowerCase()));
          }
          if (where?.pincode) {
            list = list.filter((c) => c.pincode.startsWith(where.pincode.startsWith));
          }
          if (where?.status) {
            list = list.filter((c) => c.status.toLowerCase() === where.status.equals.toLowerCase());
          }
          if (where?.OR) {
            const s = where.OR[0].name.contains.toLowerCase();
            list = list.filter(
              (c) =>
                c.name.toLowerCase().includes(s) ||
                c.code.toLowerCase().includes(s) ||
                c.city.toLowerCase().includes(s) ||
                c.state.toLowerCase().includes(s)
            );
          }
          const start = skip || 0;
          const end = take ? start + take : undefined;
          return list.slice(start, end);
        }),
        findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockHallmarkingCentres.find((c) => c.id === where.id || c.code === where.code) || null;
        }),
        upsert: vi.fn().mockImplementation(async ({ where, create }: any) => {
          const existing = mockHallmarkingCentres.find((c) => c.code === where.code);
          if (existing) return existing;
          const item = {
            id: `ahc-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            ...create,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockHallmarkingCentres.push(item);
          return item;
        }),
      },
      hallmarkVerification: {
        findFirst: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockHallmarkVerifications.find((h) => h.huid === where.huid) || null;
        }),
      },
      consumerVerification: {
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          const item = {
            id: `ver-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            ...data,
            createdAt: new Date(),
          };
          mockConsumerVerifications.push(item);
          return item;
        }),
        findMany: vi.fn().mockImplementation(async ({ where, take }: any) => {
          let list = mockConsumerVerifications.filter((v) => v.userId === where.userId);
          if (take) list = list.slice(0, take);
          return list;
        }),
        findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockConsumerVerifications.find((v) => v.id === where.id) || null;
        }),
        delete: vi.fn().mockImplementation(async ({ where }: any) => {
          const idx = mockConsumerVerifications.findIndex((v) => v.id === where.id);
          if (idx !== -1) {
            const removed = mockConsumerVerifications.splice(idx, 1);
            return removed[0];
          }
          return null;
        }),
      },
      sourceDocument: {
        findFirst: vi.fn().mockImplementation(async () => null),
      },
      auditLog: {
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          const item = { id: `log-${Date.now()}`, ...data, createdAt: new Date() };
          mockAuditLogs.push(item);
          return item;
        }),
      },
    },
  };
});

let app: any;

const USER_A_ID = '11111111-1111-1111-1111-111111111111';
const USER_B_ID = '22222222-2222-2222-2222-222222222222';

let userAToken: string;
let userBToken: string;

describe('Phase 11 — Consumer Services & Hallmarking Intelligence API Tests', () => {
  beforeAll(async () => {
    const appModule = await import('../src/app.js');
    app = appModule.app;

    const { createAuthToken } = await import('../src/services/session.service.js');
    userAToken = createAuthToken({ id: USER_A_ID, email: 'user_a@example.com', name: 'Consumer Alice', role: 'USER' });
    userBToken = createAuthToken({ id: USER_B_ID, email: 'user_b@example.com', name: 'Consumer Bob', role: 'USER' });
  });

  beforeEach(() => {
    mockUsers = [
      { id: USER_A_ID, email: 'user_a@example.com', name: 'Consumer Alice', role: 'USER', isActive: true },
      { id: USER_B_ID, email: 'user_b@example.com', name: 'Consumer Bob', role: 'USER', isActive: true },
    ];

    mockStandards = [
      {
        id: 'std-1',
        standardNumber: 'IS 10322 (Part 5/Sec 1)',
        title: 'Luminaires - Particular Requirements - Fixed General Purpose Luminaires',
        scope: 'Specifies safety and constructional requirements for fixed general purpose luminaires.',
        status: 'CURRENT',
        category: 'Lighting',
        publicationYear: 2012,
        isMandatory: true,
        bisUrl: 'https://standardsbis.bsbedge.com',
        isActive: true,
        qcoMappings: [
          {
            qco: {
              id: 'qco-1',
              title: 'Luminaires (Quality Control) Order, 2024',
              status: 'ACTIVE',
            },
          },
        ],
      },
      {
        id: 'std-2',
        standardNumber: 'IS 1417:2016',
        title: 'Gold and Gold Alloys, Jewellery/Artefacts - Fineness and Marking',
        scope: 'Specifies the fineness grades and hallmarking identification rules for gold articles.',
        status: 'CURRENT',
        category: 'Precious Metals',
        publicationYear: 2016,
        isMandatory: true,
        bisUrl: 'https://standardsbis.bsbedge.com',
        isActive: true,
        qcoMappings: [],
      },
    ];

    mockHallmarkingCentres = [
      {
        id: 'ahc-1',
        name: 'Apex Assaying & Hallmarking Centre',
        code: 'AHC-DL-001',
        address: '24/1, Karol Bagh Jewellery Market',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110005',
        phone: '+91 11 2875 4421',
        email: 'contact@apexassaying.in',
        status: 'ACTIVE',
        authorityLevel: 'AUTHORITATIVE',
        isVerified: true,
        lastVerifiedAt: new Date('2026-01-15'),
        sourceUrl: 'https://www.manakonline.in',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'ahc-2',
        name: 'National Gold Assaying Centre',
        code: 'AHC-MH-012',
        address: 'Shop 10, Zaveri Bazaar, Kalbadevi',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400002',
        phone: '+91 22 2342 8890',
        email: 'info@nationalassaying.com',
        status: 'ACTIVE',
        authorityLevel: 'AUTHORITATIVE',
        isVerified: true,
        lastVerifiedAt: new Date('2026-02-01'),
        sourceUrl: 'https://www.manakonline.in',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockConsumerVerifications = [
      {
        id: 'ver-100',
        userId: USER_A_ID,
        verificationType: 'LICENCE',
        query: { licenceNumber: 'CM/L-1234567' },
        resultStatus: 'VERIFIED',
        source: 'BIS Manakonline Product Certification Portal',
        evidence: { scheme: 'Scheme-I (ISI Mark)' },
        createdAt: new Date(),
      },
    ];

    mockAuditLogs = [];
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Citizen Services Directory
  // ───────────────────────────────────────────────────────────────────────────
  it('1. GET /api/v1/consumer/services returns list of official citizen services', async () => {
    const res = await request(app).get('/api/v1/consumer/services');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.services)).toBe(true);
    expect(res.body.data.services.length).toBeGreaterThanOrEqual(4);

    const licenceService = res.body.data.services.find((s: any) => s.serviceType === 'LICENCE_VERIFICATION');
    expect(licenceService).toBeDefined();
    expect(licenceService.title).toContain('Verify BIS');
    expect(licenceService.officialUrl).toBeDefined();
  });

  it('2. GET /api/v1/consumer/services/:serviceId returns details for specific service and 404 for invalid', async () => {
    const validRes = await request(app).get('/api/v1/consumer/services/srv-huid-verify');
    expect(validRes.status).toBe(200);
    expect(validRes.body.data.service.serviceType).toBe('HUID_VERIFICATION');

    const invalidRes = await request(app).get('/api/v1/consumer/services/nonexistent-service-id');
    expect(invalidRes.status).toBe(404);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Plain-Language Standards Search
  // ───────────────────────────────────────────────────────────────────────────
  it('3. GET /api/v1/consumer/standards/search returns plain-language standard explanations with QCO info', async () => {
    const res = await request(app).get('/api/v1/consumer/standards/search?q=Luminaires');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.results.length).toBeGreaterThanOrEqual(1);

    const first = res.body.data.results[0];
    expect(first.standardNumber).toContain('IS 10322');
    expect(first.isMandatoryQco).toBe(true);
    expect(first.consumerExplanation).toBeDefined();
    expect(first.consumerExplanation.whatThisMeans).toBeDefined();
    expect(first.consumerExplanation.whyItMatters).toBeDefined();
    expect(first.consumerExplanation.whatYouCanCheck.length).toBeGreaterThanOrEqual(1);
    expect(first.consumerExplanation.nextStep).toBeDefined();
  });

  it('4. GET /api/v1/consumer/standards/search with empty query returns empty array', async () => {
    const res = await request(app).get('/api/v1/consumer/standards/search?q=');
    expect(res.status).toBe(200);
    expect(res.body.data.results).toEqual([]);
    expect(res.body.data.total).toBe(0);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. BIS Licence Verification
  // ───────────────────────────────────────────────────────────────────────────
  it('5. POST /api/v1/consumer/licence/verify returns VERIFIED status for known fixture', async () => {
    const res = await request(app)
      .post('/api/v1/consumer/licence/verify')
      .send({ licenceNumber: 'CM/L-1234567' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const v = res.body.data.verification;
    expect(v.status).toBe('VERIFIED');
    expect(v.manufacturer).toContain('Havells');
    expect(v.standardNumber).toBe('IS 16102 (Part 1)');
    expect(v.sourceAuthority).toBe('Bureau of Indian Standards (BIS)');
    expect(v.disclaimer).toBeDefined();
  });

  it('6. POST /api/v1/consumer/licence/verify returns NOT_FOUND status without declaring invalidity', async () => {
    const res = await request(app)
      .post('/api/v1/consumer/licence/verify')
      .send({ licenceNumber: 'CM/L-9999999' });

    expect(res.status).toBe(200);
    const v = res.body.data.verification;
    expect(v.status).toBe('NOT_FOUND');
    expect(v.disclaimer).toContain('does not constitute a legal declaration of invalidity');
  });

  it('7. POST /api/v1/consumer/licence/verify returns SOURCE_UNAVAILABLE when source cannot be reached', async () => {
    const res = await request(app)
      .post('/api/v1/consumer/licence/verify')
      .send({ licenceNumber: 'CM/L-UNAVAILABLE' });

    expect(res.status).toBe(200);
    const v = res.body.data.verification;
    expect(v.status).toBe('SOURCE_UNAVAILABLE');
    expect(v.disclaimer).toContain('Verification could not be completed from the currently connected authoritative source');
  });

  it('8. POST /api/v1/consumer/licence/verify returns 400 when licenceNumber is missing', async () => {
    const res = await request(app)
      .post('/api/v1/consumer/licence/verify')
      .send({});

    expect(res.status).toBe(400);
  });

  it('9. POST /api/v1/consumer/licence/verify saves verification history when authenticated', async () => {
    const res = await request(app)
      .post('/api/v1/consumer/licence/verify')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ licenceNumber: 'CM/L-8765432', saveHistory: true });

    expect(res.status).toBe(200);
    expect(res.body.data.savedVerificationId).toBeDefined();

    const saved = mockConsumerVerifications.find((v) => v.id === res.body.data.savedVerificationId);
    expect(saved).toBeDefined();
    expect(saved.userId).toBe(USER_A_ID);
    expect(saved.verificationType).toBe('LICENCE');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Hallmarking & HUID Verification
  // ───────────────────────────────────────────────────────────────────────────
  it('10. POST /api/v1/consumer/huid/verify returns VERIFIED status with purity and jeweller info', async () => {
    const res = await request(app)
      .post('/api/v1/consumer/huid/verify')
      .send({ huid: 'AZ1234' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const v = res.body.data.verification;
    expect(v.verificationStatus).toBe('VERIFIED');
    expect(v.purityKarat).toBe('22K (916)');
    expect(v.purityPpm).toBe(916);
    expect(v.jewellerName).toContain('Tanishq');
    expect(v.hallmarkingCentreCode).toBe('AHC-DL-001');
    expect(v.sourceAuthority).toBe('Bureau of Indian Standards (BIS)');
  });

  it('11. POST /api/v1/consumer/huid/verify returns NOT_FOUND with safe disclaimer for unknown HUID', async () => {
    const res = await request(app)
      .post('/api/v1/consumer/huid/verify')
      .send({ huid: 'ZZ9999' });

    expect(res.status).toBe(200);
    const v = res.body.data.verification;
    expect(v.verificationStatus).toBe('NOT_FOUND');
    expect(v.disclaimer).toContain('does not definitively conclude that the jewellery item is unauthentic');
  });

  it('12. POST /api/v1/consumer/huid/verify returns SOURCE_UNAVAILABLE when source fails', async () => {
    const res = await request(app)
      .post('/api/v1/consumer/huid/verify')
      .send({ huid: 'HUID-UNAVAIL' });

    expect(res.status).toBe(200);
    const v = res.body.data.verification;
    expect(v.verificationStatus).toBe('SOURCE_UNAVAILABLE');
    expect(v.disclaimer).toContain('BIS CARE');
  });

  it('13. GET /api/v1/consumer/hallmarking/education returns concepts and mandatory 3 hallmark signs', async () => {
    const res = await request(app).get('/api/v1/consumer/hallmarking/education');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.concepts)).toBe(true);
    expect(res.body.data.concepts.length).toBeGreaterThanOrEqual(4);

    expect(Array.isArray(res.body.data.mandatorySigns)).toBe(true);
    expect(res.body.data.mandatorySigns.length).toBe(3);
    expect(res.body.data.mandatorySigns[0].name).toContain('Triangle Logo');
    expect(res.body.data.mandatorySigns[1].name).toContain('Purity');
    expect(res.body.data.mandatorySigns[2].name).toContain('HUID');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Hallmarking Centres Discovery
  // ───────────────────────────────────────────────────────────────────────────
  it('14. GET /api/v1/consumer/hallmarking-centres returns paginated list and state filters', async () => {
    const res = await request(app).get('/api/v1/consumer/hallmarking-centres');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.centres)).toBe(true);
    expect(res.body.data.total).toBeGreaterThanOrEqual(2);
    expect(res.body.data.availableStates).toContain('Delhi');
  });

  it('15. GET /api/v1/consumer/hallmarking-centres filtered by state returns matching centres', async () => {
    const res = await request(app).get('/api/v1/consumer/hallmarking-centres?state=Delhi');

    expect(res.status).toBe(200);
    expect(res.body.data.centres.length).toBe(1);
    expect(res.body.data.centres[0].state).toBe('Delhi');
  });

  it('16. GET /api/v1/consumer/hallmarking-centres/:id returns single centre details', async () => {
    const res = await request(app).get('/api/v1/consumer/hallmarking-centres/ahc-1');

    expect(res.status).toBe(200);
    expect(res.body.data.centre.name).toBe('Apex Assaying & Hallmarking Centre');
    expect(res.body.data.centre.code).toBe('AHC-DL-001');

    const notFound = await request(app).get('/api/v1/consumer/hallmarking-centres/ahc-nonexistent');
    expect(notFound.status).toBe(404);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Saved Verification History & IDOR Protection
  // ───────────────────────────────────────────────────────────────────────────
  it('17. GET /api/v1/consumer/verifications returns authenticated user history and requires auth', async () => {
    const unauth = await request(app).get('/api/v1/consumer/verifications');
    expect(unauth.status).toBe(401);

    const authRes = await request(app)
      .get('/api/v1/consumer/verifications')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(authRes.status).toBe(200);
    expect(Array.isArray(authRes.body.data.verifications)).toBe(true);
    expect(authRes.body.data.verifications.length).toBeGreaterThanOrEqual(1);
    expect(authRes.body.data.verifications[0].userId).toBe(USER_A_ID);
  });

  it('18. DELETE /api/v1/consumer/verifications/:id enforces IDOR ownership check', async () => {
    // User B attempts to delete User A's verification -> 403 Forbidden
    const forbiddenRes = await request(app)
      .delete('/api/v1/consumer/verifications/ver-100')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(forbiddenRes.status).toBe(403);
    expect(forbiddenRes.body.error.code).toBe('FORBIDDEN');

    // User A deletes own verification -> 200 OK
    const deleteRes = await request(app)
      .delete('/api/v1/consumer/verifications/ver-100')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.success).toBe(true);

    // Record is deleted -> 404
    const notFoundRes = await request(app)
      .delete('/api/v1/consumer/verifications/ver-100')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(notFoundRes.status).toBe(404);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Official Guidance & Grievance Redressal
  // ───────────────────────────────────────────────────────────────────────────
  it('19. GET /api/v1/consumer/guidance/CONSUMER_COMPLAINT returns structured steps and helpline contacts', async () => {
    const res = await request(app).get('/api/v1/consumer/guidance/CONSUMER_COMPLAINT');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const g = res.body.data.guidance;
    expect(g.guidanceStatus).toBe('GUIDANCE_ONLY');
    expect(g.officialPortalUrl).toContain('bisconnect/complaints');
    expect(g.officialAppName).toBe('BIS CARE App');
    expect(Array.isArray(g.steps)).toBe(true);
    expect(g.steps.length).toBeGreaterThanOrEqual(3);
    expect(g.tips.length).toBeGreaterThanOrEqual(1);
    expect(g.disclaimers.length).toBeGreaterThanOrEqual(1);
    expect(g.contacts.some((c: any) => c.value === '1800-11-1206')).toBe(true);
  });
});
