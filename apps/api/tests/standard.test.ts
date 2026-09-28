import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';

// ── Mock Environment (Must precede dynamic imports of app/env) ───────────────
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
let mockIngestionRuns: any[] = [];

vi.mock('../src/db/client.js', () => {
  return {
    checkDatabaseHealth: vi.fn().mockResolvedValue({ connected: true, latencyMs: 1 }),
    disconnectDatabase: vi.fn().mockResolvedValue(undefined),
    prisma: {
      standard: {
        create: vi.fn().mockImplementation(async ({ data }: { data: any }) => {
          const newStandard = {
            id: `std-uuid-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            isNumber: data.isNumber,
            canonicalNumber: data.canonicalNumber,
            title: data.title,
            shortTitle: data.shortTitle || null,
            scope: data.scope || null,
            status: data.status || 'CURRENT',
            sector: data.sector || null,
            department: data.department || null,
            language: data.language || 'English',
            currentEdition: data.currentEdition || null,
            publicationDate: data.publicationDate || null,
            withdrawalDate: data.withdrawalDate || null,
            sourceDocumentId: data.sourceDocumentId || null,
            isActive: data.isActive !== undefined ? data.isActive : true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockStandards.push(newStandard);
          return newStandard;
        }),
        findFirst: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          if (where.OR) {
            return (
              mockStandards.find((s) => {
                return where.OR.some((cond: any) => {
                  if (cond.isNumber && s.isNumber.toLowerCase() === cond.isNumber.toLowerCase()) return true;
                  if (cond.canonicalNumber && s.canonicalNumber.toLowerCase() === cond.canonicalNumber.toLowerCase()) return true;
                  return false;
                });
              }) || null
            );
          }
          if (where.id) {
            return mockStandards.find((s) => s.id === where.id) || null;
          }
          return null;
        }),
        findUnique: vi.fn().mockImplementation(async ({ where, include }: { where: any; include?: any }) => {
          const std = mockStandards.find((s) => s.id === where.id);
          if (!std) return null;
          const result = { ...std };
          if (include?.sourceDocument) {
            result.sourceDocument = mockSourceDocuments.find((d) => d.id === std.sourceDocumentId) || null;
          }
          if (include?.versions) {
            result.versions = mockStandardVersions.filter((v) => v.standardId === std.id);
          }
          if (include?.amendments) {
            result.amendments = mockStandardAmendments.filter((a) => a.standardId === std.id);
          }
          if (include?.qcoMappings) {
            result.qcoMappings = mockQCOStandardMappings
              .filter((m) => m.standardId === std.id)
              .map((m) => ({
                ...m,
                qco: mockQCOs.find((q) => q.id === m.qcoId) || {},
              }));
          }
          if (include?.schemeMappings) {
            result.schemeMappings = mockStandardSchemeMappings
              .filter((sm) => sm.standardId === std.id)
              .map((sm) => ({
                ...sm,
                scheme: mockSchemes.find((sc) => sc.id === sm.schemeId) || {},
              }));
          }
          if (include?.productManuals) {
            result.productManuals = mockProductManuals.filter((pm) => pm.standardId === std.id);
          }
          return result;
        }),
        findMany: vi.fn().mockImplementation(async ({ where, include }: { where: any; include?: any }) => {
          return mockStandards
            .filter((s) => {
              if (where.isActive !== undefined && s.isActive !== where.isActive) return false;
              if (where.status && s.status !== where.status) return false;
              if (where.sector?.contains && !s.sector?.toLowerCase().includes(where.sector.contains.toLowerCase())) return false;
              if (where.department?.contains && !s.department?.toLowerCase().includes(where.department.contains.toLowerCase())) return false;
              if (where.OR) {
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
              if (include?.sourceDocument) {
                res.sourceDocument = mockSourceDocuments.find((d) => d.id === s.sourceDocumentId) || null;
              }
              return res;
            });
        }),
        count: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          return mockStandards.filter((s) => {
            if (where.isActive !== undefined && s.isActive !== where.isActive) return false;
            if (where.status && s.status !== where.status) return false;
            if (where.sector?.contains && !s.sector?.toLowerCase().includes(where.sector.contains.toLowerCase())) return false;
            if (where.department?.contains && !s.department?.toLowerCase().includes(where.department.contains.toLowerCase())) return false;
            if (where.OR) {
              const matchesAny = where.OR.some((cond: any) => {
                if (cond.isNumber?.contains && s.isNumber.toLowerCase().includes(cond.isNumber.contains.toLowerCase())) return true;
                if (cond.canonicalNumber?.contains && s.canonicalNumber.toLowerCase().includes(cond.canonicalNumber.contains.toLowerCase())) return true;
                if (cond.title?.contains && s.title.toLowerCase().includes(cond.title.contains.toLowerCase())) return true;
                return false;
              });
              if (!matchesAny) return false;
            }
            return true;
          }).length;
        }),
        update: vi.fn().mockImplementation(async ({ where, data }: { where: { id: string }; data: any }) => {
          const std = mockStandards.find((s) => s.id === where.id);
          if (std) {
            Object.assign(std, data, { updatedAt: new Date() });
            return std;
          }
          throw new Error('Standard not found');
        }),
      },
      standardVersion: {
        create: vi.fn().mockImplementation(async ({ data }: { data: any }) => {
          const item = { id: `ver-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
          mockStandardVersions.push(item);
          return item;
        }),
        findFirst: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          return mockStandardVersions.find((v) => v.standardId === where.standardId && v.edition === where.edition) || null;
        }),
        findMany: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          return mockStandardVersions.filter((v) => v.standardId === where.standardId);
        }),
      },
      standardAmendment: {
        create: vi.fn().mockImplementation(async ({ data }: { data: any }) => {
          const item = { id: `am-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
          mockStandardAmendments.push(item);
          return item;
        }),
        findFirst: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          return mockStandardAmendments.find((a) => a.standardId === where.standardId && a.amendmentNumber === where.amendmentNumber) || null;
        }),
        findMany: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          return mockStandardAmendments.filter((a) => a.standardId === where.standardId);
        }),
      },
      qCO: {
        create: vi.fn().mockImplementation(async ({ data }: { data: any }) => {
          const item = { id: `qco-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
          mockQCOs.push(item);
          return item;
        }),
        findUnique: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          return mockQCOs.find((q) => q.orderNumber === where.orderNumber) || null;
        }),
      },
      qCOStandardMapping: {
        create: vi.fn().mockImplementation(async ({ data }: { data: any }) => {
          const item = { id: `qcomap-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
          mockQCOStandardMappings.push(item);
          return item;
        }),
        findUnique: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          return (
            mockQCOStandardMappings.find(
              (m) => m.qcoId === where.qcoId_standardId?.qcoId && m.standardId === where.qcoId_standardId?.standardId
            ) || null
          );
        }),
        findMany: vi.fn().mockImplementation(async ({ where, include }: { where: any; include?: any }) => {
          return mockQCOStandardMappings
            .filter((m) => m.standardId === where.standardId)
            .map((m) => ({
              ...m,
              qco: mockQCOs.find((q) => q.id === m.qcoId) || {},
            }));
        }),
      },
      scheme: {
        create: vi.fn().mockImplementation(async ({ data }: { data: any }) => {
          const item = { id: `sch-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
          mockSchemes.push(item);
          return item;
        }),
        findUnique: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          return mockSchemes.find((s) => s.code === where.code) || null;
        }),
      },
      standardSchemeMapping: {
        create: vi.fn().mockImplementation(async ({ data }: { data: any }) => {
          const item = { id: `schmap-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
          mockStandardSchemeMappings.push(item);
          return item;
        }),
        findUnique: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          return (
            mockStandardSchemeMappings.find(
              (m) => m.standardId === where.standardId_schemeId?.standardId && m.schemeId === where.standardId_schemeId?.schemeId
            ) || null
          );
        }),
      },
      productManual: {
        create: vi.fn().mockImplementation(async ({ data }: { data: any }) => {
          const item = { id: `pm-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
          mockProductManuals.push(item);
          return item;
        }),
        findFirst: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          return mockProductManuals.find((m) => m.standardId === where.standardId && m.title === where.title) || null;
        }),
        findMany: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          return mockProductManuals.filter((m) => m.standardId === where.standardId);
        }),
      },
      knowledgeChunk: {
        findMany: vi.fn().mockImplementation(async () => []),
        findFirst: vi.fn().mockImplementation(async () => null),
        create: vi.fn().mockImplementation(async ({ data }: { data: any }) => data),
        deleteMany: vi.fn().mockImplementation(async () => ({ count: 0 })),
        count: vi.fn().mockImplementation(async () => 0),
      },
      sourceDocument: {
        create: vi.fn().mockImplementation(async ({ data }: { data: any }) => {
          const item = { id: `src-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
          mockSourceDocuments.push(item);
          return item;
        }),
        findFirst: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          return mockSourceDocuments.find((d) => d.url === where.url) || null;
        }),
      },
      ingestionRun: {
        create: vi.fn().mockImplementation(async ({ data }: { data: any }) => {
          const item = { id: `run-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date() };
          mockIngestionRuns.push(item);
          return item;
        }),
        update: vi.fn().mockImplementation(async ({ where, data }: { where: any; data: any }) => {
          const run = mockIngestionRuns.find((r) => r.id === where.id);
          if (run) {
            Object.assign(run, data);
            return run;
          }
          throw new Error('Run not found');
        }),
        findMany: vi.fn().mockImplementation(async () => {
          return mockIngestionRuns;
        }),
      },
    },
  };
});

describe('Phase 4 — BIS Knowledge Layer & Ingestion Tests', () => {
  let app: any;
  let userToken: string;
  let dataManagerToken: string;
  let adminToken: string;
  let isAllowedSourceUrl: any;
  let normalizeIsNumber: any;
  let validateStandardItem: any;

  beforeAll(async () => {
    const sessionModule = await import('../src/services/session.service.js');
    const sourceRegModule = await import('../src/config/sourceRegistry.js');
    const normModule = await import('../src/services/ingestion/normalizer.js');
    const valModule = await import('../src/services/ingestion/validator.js');
    const appModule = await import('../src/app.js');

    app = appModule.app;
    isAllowedSourceUrl = sourceRegModule.isAllowedSourceUrl;
    normalizeIsNumber = normModule.normalizeIsNumber;
    validateStandardItem = valModule.validateStandardItem;

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

  beforeEach(() => {
    mockStandards = [];
    mockStandardVersions = [];
    mockStandardAmendments = [];
    mockQCOs = [];
    mockQCOStandardMappings = [];
    mockSchemes = [];
    mockStandardSchemeMappings = [];
    mockProductManuals = [];
    mockSourceDocuments = [];
    mockIngestionRuns = [];

    // Pre-populate an authoritative sample standard
    const srcDoc = {
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
    mockSourceDocuments.push(srcDoc);

    const std = {
      id: 'std-10322',
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
      publicationDate: new Date('2012-07-15'),
      sourceDocumentId: srcDoc.id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockStandards.push(std);

    mockStandardVersions.push({
      id: 'ver-1',
      standardId: std.id,
      edition: 'First Edition (1985)',
      year: 1985,
      status: 'SUPERSEDED',
      documentUrl: 'https://standardsbis.in/archive/IS_10322_Part_5_Sec_1_1985.pdf',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockStandardVersions.push({
      id: 'ver-2',
      standardId: std.id,
      edition: 'First Revision (2012)',
      year: 2012,
      status: 'CURRENT',
      documentUrl: 'https://standardsbis.in/standards/IS_10322_Part_5_Sec_1_2012.pdf',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockStandardAmendments.push({
      id: 'am-1',
      standardId: std.id,
      amendmentNumber: 'Amendment No. 1',
      title: 'Amendment to insulation resistance and electric strength clauses',
      effectiveDate: new Date('2016-12-01'),
      documentUrl: 'https://standardsbis.in/amendments/IS10322_5_1_A1.pdf',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const qco = {
      id: 'qco-1',
      orderNumber: 'S.O. 2291(E)',
      name: 'Electrical Appliances (Quality Control) Order',
      ministry: 'Ministry of Heavy Industries and Public Enterprises',
      notificationDate: new Date('2003-10-09'),
      effectiveDate: new Date('2004-04-01'),
      status: 'IN_FORCE',
      documentUrl: 'https://egazette.gov.in/WriteReadData/2003/SO2291E.pdf',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockQCOs.push(qco);

    mockQCOStandardMappings.push({
      id: 'qcomap-1',
      qcoId: qco.id,
      standardId: std.id,
      productDescription: 'General purpose lighting luminaires and fittings',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  // ── 1. Authentication & Route Protection Tests ──────────────────────────────
  describe('1. Route Protection & Access Control', () => {
    it('should reject unauthenticated request to /api/v1/standards with 401', async () => {
      const res = await request(app).get('/api/v1/standards');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should allow authenticated USER to search standards', async () => {
      const res = await request(app)
        .get('/api/v1/standards')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.standards).toHaveLength(1);
      expect(res.body.data.standards[0].isNumber).toBe('IS 10322 (Part 5/Sec 1) : 2012');
    });

    it('should allow authenticated USER to view registered sources', async () => {
      const res = await request(app)
        .get('/api/v1/knowledge/sources')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── 2. Search & Filtering Tests ─────────────────────────────────────────────
  describe('2. Standards Search & Filtering', () => {
    it('should find standard by exact IS number', async () => {
      const res = await request(app)
        .get('/api/v1/standards/search?isNumber=IS 10322 (Part 5/Sec 1) : 2012')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.standards).toHaveLength(1);
      expect(res.body.data.standards[0].canonicalNumber).toBe('IS 10322-5-1');
    });

    it('should find standard by normalized canonical query (e.g. "10322-5-1")', async () => {
      const res = await request(app)
        .get('/api/v1/standards/search?q=10322-5-1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.standards).toHaveLength(1);
    });

    it('should find standard by keyword in title (e.g. "luminaires")', async () => {
      const res = await request(app)
        .get('/api/v1/standards/search?q=luminaires')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.standards).toHaveLength(1);
    });

    it('should filter by sector', async () => {
      const res = await request(app)
        .get('/api/v1/standards?sector=Electrotechnical')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.standards).toHaveLength(1);
    });

    it('should return empty results when search term does not match', async () => {
      const res = await request(app)
        .get('/api/v1/standards?q=NonExistentProductKeywordXYZ')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.standards).toHaveLength(0);
      expect(res.body.data.pagination.total).toBe(0);
    });
  });

  // ── 3. Detail & Provenance Relations Tests ──────────────────────────────────
  describe('3. Standard Detail & Provenance Verification', () => {
    it('should return full standard details with source provenance, versions, amendments, and QCOs', async () => {
      const res = await request(app)
        .get('/api/v1/standards/std-10322')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.id).toBe('std-10322');
      expect(data.isNumber).toBe('IS 10322 (Part 5/Sec 1) : 2012');

      // Source Provenance
      expect(data.sourceDocument).toBeDefined();
      expect(data.sourceDocument.sourceType).toBe('BIS_OFFICIAL');
      expect(data.sourceDocument.authorityLevel).toBe('AUTHORITATIVE');
      expect(data.sourceDocument.url).toContain('services.bis.gov.in');

      // Editions / Versions
      expect(data.versions).toHaveLength(2);
      expect(data.versions[0].edition).toBe('First Edition (1985)');

      // Amendments
      expect(data.amendments).toHaveLength(1);
      expect(data.amendments[0].amendmentNumber).toBe('Amendment No. 1');

      // QCO Mappings
      expect(data.qcoMappings).toHaveLength(1);
      expect(data.qcoMappings[0].qco.orderNumber).toBe('S.O. 2291(E)');
      expect(data.qcoMappings[0].qco.name).toBe('Electrical Appliances (Quality Control) Order');
    });

    it('should return 404 for non-existent standard ID', async () => {
      const res = await request(app)
        .get('/api/v1/standards/non-existent-uuid')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ── 4. Role-Based Access Control for Ingestion Tests ────────────────────────
  describe('4. Security & Role-Based Ingestion Authorization', () => {
    it('should forbid regular USER from triggering ingestion (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/knowledge/ingest')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ sourceKey: 'bis-know-your-standard' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow DATA_MANAGER to trigger registered official ingestion', async () => {
      const res = await request(app)
        .post('/api/v1/knowledge/ingest')
        .set('Authorization', `Bearer ${dataManagerToken}`)
        .send({ sourceKey: 'bis-know-your-standard' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recordsProcessed).toBeGreaterThan(0);
    });

    it('should allow ADMIN to trigger registered official ingestion', async () => {
      const res = await request(app)
        .post('/api/v1/knowledge/ingest')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sourceKey: 'bis-standards-portal' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject arbitrary external source key or URL injection with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/knowledge/ingest')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sourceKey: 'https://evil-unauthorized-site.com/standards' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('not a registered official BIS source');
    });
  });

  // ── 5. Ingestion Pipeline & Normalization Unit Tests ─────────────────────────
  describe('5. Ingestion Unit & Normalization Logic', () => {
    it('should normalize various raw IS number formats to canonical slug', () => {
      expect(normalizeIsNumber('IS 10322 (Part 5/Sec 1) : 2012')).toBe('IS 10322-5-1');
      expect(normalizeIsNumber('IS 1293: 2019')).toBe('IS 1293');
      expect(normalizeIsNumber('is 302 (part 1)')).toBe('IS 302-1');
      expect(normalizeIsNumber('IS 15885 (PART 2 / SECTION 13) : 2012')).toBe('IS 15885-2-13');
    });

    it('should validate official domain allowlist and reject non-government URLs', () => {
      expect(isAllowedSourceUrl('https://services.bis.gov.in/php/standards')).toBe(true);
      expect(isAllowedSourceUrl('https://standardsbis.in/standards')).toBe(true);
      expect(isAllowedSourceUrl('https://egazette.gov.in/order.pdf')).toBe(true);
      expect(isAllowedSourceUrl('https://www.crsbis.in/cert')).toBe(true);

      expect(isAllowedSourceUrl('https://random-commercial-compliance-blog.com')).toBe(false);
      expect(isAllowedSourceUrl('https://fake-bis-portal.net')).toBe(false);
    });

    it('should reject standard items missing source document provenance', () => {
      const invalidItem: any = {
        isNumber: 'IS 9999',
        title: 'Fabricated Standard Without Source',
      };
      const result = validateStandardItem(invalidItem);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Source document provenance is mandatory for every imported record.');
    });

    it('should reject standard items with non-allowlisted source URLs', () => {
      const invalidItem: any = {
        isNumber: 'IS 9999',
        title: 'Third Party Blog Standard',
        sourceDocument: {
          title: 'Third Party Blog',
          url: 'https://thirdparty-blog.com/is9999',
          sourceType: 'OTHER_REFERENCE',
          authorityLevel: 'UNVERIFIED',
        },
      };
      const result = validateStandardItem(invalidItem);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('not from an authorized official government domain'))).toBe(true);
    });
  });
});
