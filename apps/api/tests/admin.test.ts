process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.JWT_SECRET = 'test-jwt-secret-must-be-at-least-32-characters-long!';
process.env.TRANSLATION_PROVIDER = 'mock';

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// ── Mock Environment ──────────────────────────────────────────────────────────
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test_db');
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('LOG_LEVEL', 'error');
vi.stubEnv('FRONTEND_URL', 'http://localhost:5173');
vi.stubEnv('JWT_SECRET', 'test-jwt-secret-must-be-at-least-32-characters-long!');
vi.stubEnv('TRANSLATION_PROVIDER', 'mock');

// ── In-Memory Database Store for Admin Tests ─────────────────────────────────
let mockSources: any[] = [];
let mockStandards: any[] = [];
let mockStandardVersions: any[] = [];
let mockStandardAmendments: any[] = [];
let mockQcos: any[] = [];
let mockQcoMappings: any[] = [];
let mockSchemes: any[] = [];
let mockSchemeMappings: any[] = [];
let mockProductManuals: any[] = [];
let mockKnowledgeChunks: any[] = [];
let mockIngestionRuns: any[] = [];
let mockLaboratories: any[] = [];
let mockHallmarkingCentres: any[] = [];
let mockConsumerServices: any[] = [];
let mockRegulatoryChanges: any[] = [];
let mockAuditLogs: any[] = [];

vi.mock('../src/db/client.js', () => {
  return {
    checkDatabaseHealth: vi.fn().mockResolvedValue({ connected: true, latencyMs: 1 }),
    disconnectDatabase: vi.fn().mockResolvedValue(undefined),
    prisma: {
      sourceDocument: {
        count: vi.fn().mockImplementation(async () => mockSources.length),
        findMany: vi.fn().mockImplementation(async () =>
          mockSources.map((s) => ({
            ...s,
            _count: { standards: 0, knowledgeChunks: 0 },
          }))
        ),
        findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
          const s = mockSources.find((src) => src.id === where.id);
          if (!s) return null;
          return { ...s, _count: { standards: 0, qcos: 0, schemes: 0, knowledgeChunks: 0 } };
        }),
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          const s = {
            id: 'source-uuid-' + Math.random().toString(36).substring(2, 9),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
            retrievedAt: new Date(),
          };
          mockSources.push(s);
          return { ...s, _count: { standards: 0, knowledgeChunks: 0 } };
        }),
        update: vi.fn().mockImplementation(async ({ where, data }: any) => {
          const idx = mockSources.findIndex((src) => src.id === where.id);
          if (idx >= 0) {
            mockSources[idx] = { ...mockSources[idx], ...data, updatedAt: new Date() };
            return { ...mockSources[idx], _count: { standards: 0, knowledgeChunks: 0 } };
          }
          return null;
        }),
        delete: vi.fn().mockImplementation(async ({ where }: any) => {
          mockSources = mockSources.filter((src) => src.id !== where.id);
          return { id: where.id };
        }),
      },
      standard: {
        count: vi.fn().mockImplementation(async () => mockStandards.length),
        findMany: vi.fn().mockImplementation(async () =>
          mockStandards.map((std) => ({
            ...std,
            sourceDocument: mockSources.find((s) => s.id === std.sourceDocumentId) || null,
            _count: { versions: 0, amendments: 0, knowledgeChunks: 0, schemeMappings: 0, qcoMappings: 0 },
          }))
        ),
        findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
          const std = mockStandards.find((s) => s.id === where.id || s.isNumber === where.isNumber);
          if (!std) return null;
          return {
            ...std,
            sourceDocument: mockSources.find((s) => s.id === std.sourceDocumentId) || null,
            versions: [],
            amendments: [],
            schemeMappings: [],
            qcoMappings: [],
            productManuals: [],
            knowledgeChunks: [],
            _count: { versions: 0, amendments: 0, knowledgeChunks: 0, schemeMappings: 0, qcoMappings: 0 },
          };
        }),
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          const std = {
            id: 'std-uuid-' + Math.random().toString(36).substring(2, 9),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockStandards.push(std);
          return {
            ...std,
            sourceDocument: mockSources.find((s) => s.id === std.sourceDocumentId) || null,
            _count: { versions: 0, amendments: 0, knowledgeChunks: 0, schemeMappings: 0, qcoMappings: 0 },
          };
        }),
        update: vi.fn().mockImplementation(async ({ where, data }: any) => {
          const idx = mockStandards.findIndex((s) => s.id === where.id);
          if (idx >= 0) {
            mockStandards[idx] = { ...mockStandards[idx], ...data, updatedAt: new Date() };
            return {
              ...mockStandards[idx],
              sourceDocument: mockSources.find((s) => s.id === mockStandards[idx].sourceDocumentId) || null,
              _count: { versions: 0, amendments: 0, knowledgeChunks: 0, schemeMappings: 0, qcoMappings: 0 },
            };
          }
          return null;
        }),
      },
      standardVersion: {
        count: vi.fn().mockImplementation(async () => mockStandardVersions.length),
      },
      standardAmendment: {
        count: vi.fn().mockImplementation(async () => mockStandardAmendments.length),
      },
      qCO: {
        count: vi.fn().mockImplementation(async () => mockQcos.length),
        findMany: vi.fn().mockImplementation(async () =>
          mockQcos.map((q) => ({
            ...q,
            sourceDocument: mockSources.find((s) => s.id === q.sourceDocumentId) || null,
            standardMappings: [],
          }))
        ),
        findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
          const q = mockQcos.find((item) => item.id === where.id || item.orderNumber === where.orderNumber);
          if (!q) return null;
          return {
            ...q,
            sourceDocument: mockSources.find((s) => s.id === q.sourceDocumentId) || null,
            standardMappings: [],
          };
        }),
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          const q = {
            id: 'qco-uuid-' + Math.random().toString(36).substring(2, 9),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockQcos.push(q);
          return {
            ...q,
            sourceDocument: mockSources.find((s) => s.id === q.sourceDocumentId) || null,
            standardMappings: [],
          };
        }),
        update: vi.fn().mockImplementation(async ({ where, data }: any) => {
          const idx = mockQcos.findIndex((item) => item.id === where.id);
          if (idx >= 0) {
            mockQcos[idx] = { ...mockQcos[idx], ...data, updatedAt: new Date() };
            return {
              ...mockQcos[idx],
              sourceDocument: mockSources.find((s) => s.id === mockQcos[idx].sourceDocumentId) || null,
              standardMappings: [],
            };
          }
          return null;
        }),
        delete: vi.fn().mockImplementation(async ({ where }: any) => {
          mockQcos = mockQcos.filter((q) => q.id !== where.id);
          return { id: where.id };
        }),
      },
      qCOStandardMapping: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      scheme: {
        count: vi.fn().mockImplementation(async () => mockSchemes.length),
        findMany: vi.fn().mockImplementation(async () =>
          mockSchemes.map((s) => ({
            ...s,
            sourceDocument: null,
            _count: { standardMappings: 0 },
          }))
        ),
        findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
          const s = mockSchemes.find((item) => item.id === where.id || item.code === where.code);
          if (!s) return null;
          return { ...s, sourceDocument: null, standardMappings: [] };
        }),
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          const s = {
            id: 'scheme-uuid-' + Math.random().toString(36).substring(2, 9),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockSchemes.push(s);
          return s;
        }),
        update: vi.fn().mockImplementation(async ({ where, data }: any) => {
          const idx = mockSchemes.findIndex((s) => s.id === where.id);
          if (idx >= 0) {
            mockSchemes[idx] = { ...mockSchemes[idx], ...data, updatedAt: new Date() };
            return { ...mockSchemes[idx], _count: { standardMappings: 0 } };
          }
          return null;
        }),
      },
      standardSchemeMapping: {
        upsert: vi.fn().mockImplementation(async ({ create }: any) => ({
          id: 'map-uuid-' + Math.random().toString(36).substring(2, 9),
          ...create,
        })),
      },
      productManual: {
        count: vi.fn().mockImplementation(async () => mockProductManuals.length),
      },
      knowledgeChunk: {
        count: vi.fn().mockImplementation(async () => mockKnowledgeChunks.length),
        findMany: vi.fn().mockImplementation(async () => mockKnowledgeChunks),
        findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockKnowledgeChunks.find((c) => c.id === where.id) || null;
        }),
        update: vi.fn().mockImplementation(async ({ where, data }: any) => {
          const idx = mockKnowledgeChunks.findIndex((c) => c.id === where.id);
          if (idx >= 0) {
            mockKnowledgeChunks[idx] = { ...mockKnowledgeChunks[idx], ...data, updatedAt: new Date() };
            return mockKnowledgeChunks[idx];
          }
          return null;
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      ingestionRun: {
        count: vi.fn().mockImplementation(async () => mockIngestionRuns.length),
        findMany: vi.fn().mockImplementation(async () => mockIngestionRuns),
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          const r = {
            id: 'run-uuid-' + Math.random().toString(36).substring(2, 9),
            ...data,
            createdAt: new Date(),
          };
          mockIngestionRuns.push(r);
          return r;
        }),
      },
      laboratory: {
        count: vi.fn().mockImplementation(async () => mockLaboratories.length),
        findMany: vi.fn().mockImplementation(async () =>
          mockLaboratories.map((l) => ({ ...l, _count: { capabilities: 0 } }))
        ),
        findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockLaboratories.find((l) => l.id === where.id) || null;
        }),
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          const l = {
            id: 'lab-uuid-' + Math.random().toString(36).substring(2, 9),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockLaboratories.push(l);
          return l;
        }),
        update: vi.fn().mockImplementation(async ({ where, data }: any) => {
          const idx = mockLaboratories.findIndex((l) => l.id === where.id);
          if (idx >= 0) {
            mockLaboratories[idx] = { ...mockLaboratories[idx], ...data, updatedAt: new Date() };
            return { ...mockLaboratories[idx], _count: { capabilities: 0 } };
          }
          return null;
        }),
      },
      hallmarkingCentre: {
        count: vi.fn().mockImplementation(async () => mockHallmarkingCentres.length),
        findMany: vi.fn().mockImplementation(async () => mockHallmarkingCentres),
        findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockHallmarkingCentres.find((c) => c.id === where.id || c.ahcCode === where.ahcCode) || null;
        }),
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          const c = {
            id: 'ahc-uuid-' + Math.random().toString(36).substring(2, 9),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockHallmarkingCentres.push(c);
          return c;
        }),
        update: vi.fn().mockImplementation(async ({ where, data }: any) => {
          const idx = mockHallmarkingCentres.findIndex((c) => c.id === where.id);
          if (idx >= 0) {
            mockHallmarkingCentres[idx] = { ...mockHallmarkingCentres[idx], ...data, updatedAt: new Date() };
            return mockHallmarkingCentres[idx];
          }
          return null;
        }),
      },
      consumerService: {
        count: vi.fn().mockImplementation(async () => mockConsumerServices.length),
        findMany: vi.fn().mockImplementation(async () => mockConsumerServices),
        findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockConsumerServices.find((s) => s.id === where.id) || null;
        }),
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          const s = {
            id: 'srv-uuid-' + Math.random().toString(36).substring(2, 9),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockConsumerServices.push(s);
          return s;
        }),
        update: vi.fn().mockImplementation(async ({ where, data }: any) => {
          const idx = mockConsumerServices.findIndex((s) => s.id === where.id);
          if (idx >= 0) {
            mockConsumerServices[idx] = { ...mockConsumerServices[idx], ...data, updatedAt: new Date() };
            return mockConsumerServices[idx];
          }
          return null;
        }),
      },
      regulatoryChangeEvent: {
        count: vi.fn().mockImplementation(async () => mockRegulatoryChanges.length),
        findMany: vi.fn().mockImplementation(async () =>
          mockRegulatoryChanges.map((r) => ({ ...r, _count: { impacts: 0 } }))
        ),
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          const r = {
            id: 'reg-uuid-' + Math.random().toString(36).substring(2, 9),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockRegulatoryChanges.push(r);
          return r;
        }),
      },
      complianceAlert: {
        count: vi.fn().mockResolvedValue(0),
      },
      regulatoryImpact: {
        count: vi.fn().mockResolvedValue(0),
      },
      auditLog: {
        count: vi.fn().mockImplementation(async () => mockAuditLogs.length),
        findMany: vi.fn().mockImplementation(async () =>
          mockAuditLogs.map((log) => ({
            ...log,
            user: { name: 'Admin User', email: 'admin@bis.gov.in', role: 'ADMIN' },
            product: null,
          }))
        ),
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          const log = {
            id: 'audit-uuid-' + Math.random().toString(36).substring(2, 9),
            ...data,
            createdAt: new Date(),
          };
          mockAuditLogs.push(log);
          return log;
        }),
      },
    },
  };
});

let app: any;

function createAuthCookie(role: 'USER' | 'ADMIN' | 'DATA_MANAGER', userId = 'user-1'): string {
  const token = jwt.sign(
    { id: userId, email: `${role.toLowerCase()}@bis.gov.in`, role },
    process.env.JWT_SECRET || 'test-jwt-secret-must-be-at-least-32-characters-long!',
    {
      expiresIn: '15m',
      issuer: 'bis-intelligent-platform',
      audience: 'bis-users',
    }
  );
  return `bis_auth_token=${token}`;
}

describe('Phase 13 — Admin & Knowledge Data Management Intelligence Tests', () => {
  beforeAll(async () => {
    const appModule = await import('../src/app.js');
    app = appModule.app || appModule.default;
  });

  beforeEach(() => {
    mockSources = [];
    mockStandards = [];
    mockStandardVersions = [];
    mockStandardAmendments = [];
    mockQcos = [];
    mockQcoMappings = [];
    mockSchemes = [];
    mockSchemeMappings = [];
    mockProductManuals = [];
    mockKnowledgeChunks = [];
    mockIngestionRuns = [];
    mockLaboratories = [];
    mockHallmarkingCentres = [];
    mockConsumerServices = [];
    mockRegulatoryChanges = [];
    mockAuditLogs = [];
    vi.clearAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. RBAC & Authorization
  // ───────────────────────────────────────────────────────────────────────────
  it('1. Rejects unauthenticated request to /admin with 401', async () => {
    const res = await request(app).get('/api/v1/admin/dashboard');
    expect(res.status).toBe(401);
  });

  it('2. Rejects normal USER role with 403 Forbidden', async () => {
    const userCookie = createAuthCookie('USER');
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Cookie', userCookie);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('3. Allows ADMIN role to access dashboard metrics', async () => {
    const adminCookie = createAuthCookie('ADMIN');
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.knowledge).toBeDefined();
    expect(res.body.data.sources).toBeDefined();
    expect(res.body.data.dataQuality).toBeDefined();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Source Registry Management
  // ───────────────────────────────────────────────────────────────────────────
  it('4. Creates and verifies SourceDocument in registry', async () => {
    const adminCookie = createAuthCookie('ADMIN');

    // Create source
    const createRes = await request(app)
      .post('/api/v1/admin/sources')
      .set('Cookie', adminCookie)
      .send({
        title: 'BIS Gazette Notification 2026 - Helmets',
        url: 'https://egazette.gov.in/notification-helmets-2026.pdf',
        sourceType: 'GOVERNMENT_GAZETTE',
        authorityLevel: 'AUTHORITATIVE',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.source.id).toBeDefined();
    expect(createRes.body.data.source.isFresh).toBe(true);

    const sourceId = createRes.body.data.source.id;

    // Verify source
    const verifyRes = await request(app)
      .post(`/api/v1/admin/sources/${sourceId}/verify`)
      .set('Cookie', adminCookie);

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.source.authorityLevel).toBe('AUTHORITATIVE');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Standards Management & Provenance Enforcement
  // ───────────────────────────────────────────────────────────────────────────
  it('5. Blocks standard creation without authoritative source provenance', async () => {
    const adminCookie = createAuthCookie('ADMIN');

    const res = await request(app)
      .post('/api/v1/admin/standards')
      .set('Cookie', adminCookie)
      .send({
        isNumber: 'IS 99999:2026',
        title: 'Fabricated Standard without Source',
        // sourceDocumentId omitted intentionally
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('source document reference');
  });

  it('6. Creates and publishes standard with valid source provenance', async () => {
    const adminCookie = createAuthCookie('ADMIN');

    // 1. First create verified source
    const sourceRes = await request(app)
      .post('/api/v1/admin/sources')
      .set('Cookie', adminCookie)
      .send({
        title: 'Official IS 10322 Specification',
        url: 'https://www.standardsbis.in/is10322.pdf',
        sourceType: 'BIS_OFFICIAL',
      });

    const sourceId = sourceRes.body.data.source.id;

    // 2. Create standard with valid provenance
    const stdRes = await request(app)
      .post('/api/v1/admin/standards')
      .set('Cookie', adminCookie)
      .send({
        isNumber: 'IS 10322 (Part 5/Sec 1)',
        title: 'Luminaires - General Purpose Floodlights',
        scope: 'Safety and photometric requirements for luminaires',
        sourceDocumentId: sourceId,
      });

    expect(stdRes.status).toBe(201);
    expect(stdRes.body.data.standard.isNumber).toBe('IS 10322 (Part 5/Sec 1)');

    const standardId = stdRes.body.data.standard.id;

    // 3. Publish standard
    const publishRes = await request(app)
      .post(`/api/v1/admin/standards/${standardId}/publish`)
      .set('Cookie', adminCookie);

    expect(publishRes.status).toBe(200);
    expect(publishRes.body.data.standard.status).toBe('CURRENT');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. QCO Management
  // ───────────────────────────────────────────────────────────────────────────
  it('7. Creates QCO with order number and standard mapping', async () => {
    const adminCookie = createAuthCookie('ADMIN');

    const sourceRes = await request(app)
      .post('/api/v1/admin/sources')
      .set('Cookie', adminCookie)
      .send({
        title: 'DPIIT QCO Notification for Lighting',
        url: 'https://dpiit.gov.in/lighting-qco.pdf',
        sourceType: 'GOVERNMENT_GAZETTE',
      });

    const sourceId = sourceRes.body.data.source.id;

    const qcoRes = await request(app)
      .post('/api/v1/admin/qcos')
      .set('Cookie', adminCookie)
      .send({
        name: 'Solar DC Luminaires Quality Control Order 2026',
        orderNumber: 'S.O. 4567(E)',
        ministry: 'Ministry of Commerce & Industry',
        sourceDocumentId: sourceId,
      });

    expect(qcoRes.status).toBe(201);
    expect(qcoRes.body.data.qco.orderNumber).toBe('S.O. 4567(E)');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Schemes & Standard Mapping
  // ───────────────────────────────────────────────────────────────────────────
  it('8. Creates Scheme and maps standard to scheme', async () => {
    const adminCookie = createAuthCookie('ADMIN');

    const schemeRes = await request(app)
      .post('/api/v1/admin/schemes')
      .set('Cookie', adminCookie)
      .send({
        name: 'Scheme-I (ISI Mark Certification Scheme)',
        code: 'SCHEME_I',
        description: 'Standard product conformity scheme under BIS Act 2016',
      });

    expect(schemeRes.status).toBe(201);
    expect(schemeRes.body.data.scheme.code).toBe('SCHEME_I');

    const schemeId = schemeRes.body.data.scheme.id;

    // Map standard to scheme
    const mapRes = await request(app)
      .post('/api/v1/admin/schemes/map')
      .set('Cookie', adminCookie)
      .send({
        standardId: 'std-test-1',
        schemeId,
      });

    expect(mapRes.status).toBe(200);
    expect(mapRes.body.data.mapping).toBeDefined();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Embeddings & Ingestion Management
  // ───────────────────────────────────────────────────────────────────────────
  it('9. Retrieves embedding status and triggers re-index', async () => {
    const adminCookie = createAuthCookie('ADMIN');

    const statusRes = await request(app)
      .get('/api/v1/admin/embeddings/status')
      .set('Cookie', adminCookie);

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.status.dimension).toBe(1536);

    const reindexRes = await request(app)
      .post('/api/v1/admin/embeddings/reindex')
      .set('Cookie', adminCookie)
      .send({ scope: 'MISSING' });

    expect(reindexRes.status).toBe(200);
    expect(reindexRes.body.data.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('10. Triggers an ingestion run record', async () => {
    const adminCookie = createAuthCookie('ADMIN');

    const res = await request(app)
      .post('/api/v1/admin/ingestion/trigger')
      .set('Cookie', adminCookie)
      .send({
        sourceName: 'BIS Portal Standard Sync',
        sourceUrl: 'https://www.services.bis.gov.in',
        sourceType: 'BIS_OFFICIAL',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.run.status).toBe('COMPLETED');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Laboratories & Hallmarking Centres
  // ───────────────────────────────────────────────────────────────────────────
  it('11. Creates Laboratory with NABL status and Hallmarking Centre with AHC Code', async () => {
    const adminCookie = createAuthCookie('ADMIN');

    // Lab
    const labRes = await request(app)
      .post('/api/v1/admin/laboratories')
      .set('Cookie', adminCookie)
      .send({
        name: 'National Test House (Southern Region)',
        city: 'Chennai',
        state: 'Tamil Nadu',
        isNabl: true,
        isBisLab: true,
      });

    expect(labRes.status).toBe(201);
    expect(labRes.body.data.laboratory.isNabl).toBe(true);

    // AHC
    const ahcRes = await request(app)
      .post('/api/v1/admin/hallmarking-centres')
      .set('Cookie', adminCookie)
      .send({
        name: 'Chennai Assay & Hallmarking Centre',
        ahcCode: 'AHC-TN-042',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
      });

    expect(ahcRes.status).toBe(201);
    expect(ahcRes.body.data.centre.ahcCode).toBe('AHC-TN-042');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 8. Data Quality Scanner & Audit Logs
  // ───────────────────────────────────────────────────────────────────────────
  it('12. Runs Data Quality diagnostics and returns categorized report', async () => {
    const adminCookie = createAuthCookie('ADMIN');

    // Add a standard without source document to trigger critical issue
    mockStandards.push({
      id: 'orphan-std-1',
      isNumber: 'IS 8888',
      title: 'Standard Missing Source',
      sourceDocumentId: null,
    });

    const res = await request(app)
      .get('/api/v1/admin/data-quality')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.report.totalIssues).toBeGreaterThan(0);
    expect(res.body.data.report.criticalCount).toBeGreaterThanOrEqual(1);
  });

  it('13. Retrieves append-only audit trail with actor metadata', async () => {
    const adminCookie = createAuthCookie('ADMIN');

    // First do an action that logs audit
    await request(app)
      .post('/api/v1/admin/sources')
      .set('Cookie', adminCookie)
      .send({
        title: 'Audit Test Source',
        url: 'https://bis.gov.in/audit-test',
        sourceType: 'BIS_OFFICIAL',
      });

    const res = await request(app)
      .get('/api/v1/admin/audit')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.logs.length).toBeGreaterThan(0);
    expect(res.body.data.logs[0].action).toBeDefined();
  });
});
