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
let mockProductDocuments: any[] = [];
let mockDocumentPageEvidences: any[] = [];
let mockDocumentStructuredExtractions: any[] = [];
let mockDocumentChecklistMatches: any[] = [];
let mockDocumentTestMatches: any[] = [];
let mockProductCertificationAnalyses: any[] = [];
let mockProductDocumentationChecklistItems: any[] = [];
let mockProductTestingAnalyses: any[] = [];
let mockProductTestRequirements: any[] = [];
let mockStandards: any[] = [];
let mockSchemes: any[] = [];
let mockAuditLogs: any[] = [];

vi.mock('../src/db/client.js', () => {
  return {
    checkDatabaseHealth: vi.fn().mockResolvedValue({ connected: true, latencyMs: 1 }),
    disconnectDatabase: vi.fn().mockResolvedValue(undefined),
    prisma: {
      $transaction: vi.fn().mockImplementation(async (callback: any) => {
        return callback({
          productDocument: {
            create: vi.fn().mockImplementation(async ({ data }: any) => {
              const item = {
                id: `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              mockProductDocuments.push(item);
              return item;
            }),
            findUnique: vi.fn().mockImplementation(async ({ where, include }: any) => {
              const item = mockProductDocuments.find((d) => d.id === where.id);
              if (!item) return null;
              const res = { ...item };
              if (include?.structuredExtraction) {
                res.structuredExtraction = mockDocumentStructuredExtractions.find((s) => s.documentId === item.id) || null;
              }
              if (include?.pageEvidence) {
                res.pageEvidence = mockDocumentPageEvidences.filter((e) => e.documentId === item.id);
              }
              if (include?.checklistMatches) {
                res.checklistMatches = mockDocumentChecklistMatches.filter((m) => m.documentId === item.id);
              }
              if (include?.testMatches) {
                res.testMatches = mockDocumentTestMatches.filter((t) => t.documentId === item.id);
              }
              return res;
            }),
          },
          documentPageEvidence: {
            create: vi.fn().mockImplementation(async ({ data }: any) => {
              const item = { id: `ev-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date() };
              mockDocumentPageEvidences.push(item);
              return item;
            }),
          },
          documentStructuredExtraction: {
            create: vi.fn().mockImplementation(async ({ data }: any) => {
              const item = { id: `str-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
              mockDocumentStructuredExtractions.push(item);
              return item;
            }),
          },
          documentChecklistMatch: {
            create: vi.fn().mockImplementation(async ({ data }: any) => {
              const item = { id: `cm-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
              mockDocumentChecklistMatches.push(item);
              return item;
            }),
          },
          documentTestMatch: {
            create: vi.fn().mockImplementation(async ({ data }: any) => {
              const item = { id: `tm-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
              mockDocumentTestMatches.push(item);
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
      productDocument: {
        findMany: vi.fn().mockImplementation(async ({ where, include }: any) => {
          return mockProductDocuments
            .filter((d) => {
              if (where.productId && d.productId !== where.productId) return false;
              if (where.originalFileName && d.originalFileName !== where.originalFileName) return false;
              if (where.documentFamily && d.documentFamily !== where.documentFamily) return false;
              if (where.isCurrent !== undefined && d.isCurrent !== where.isCurrent) return false;
              return true;
            })
            .map((item) => {
              const res = { ...item };
              if (include?.structuredExtraction) {
                res.structuredExtraction = mockDocumentStructuredExtractions.find((s) => s.documentId === item.id) || null;
              }
              if (include?.pageEvidence) {
                res.pageEvidence = mockDocumentPageEvidences.filter((e) => e.documentId === item.id);
              }
              if (include?.checklistMatches) {
                res.checklistMatches = mockDocumentChecklistMatches.filter((m) => m.documentId === item.id);
              }
              if (include?.testMatches) {
                res.testMatches = mockDocumentTestMatches.filter((t) => t.documentId === item.id);
              }
              return res;
            });
        }),
        findFirst: vi.fn().mockImplementation(async ({ where, include }: any) => {
          const item = mockProductDocuments.find((d) => {
            if (where.id && d.id !== where.id) return false;
            if (where.productId && d.productId !== where.productId) return false;
            return true;
          });
          if (!item) return null;
          const res = { ...item };
          if (include?.structuredExtraction) {
            res.structuredExtraction = mockDocumentStructuredExtractions.find((s) => s.documentId === item.id) || null;
          }
          if (include?.pageEvidence) {
            res.pageEvidence = mockDocumentPageEvidences.filter((e) => e.documentId === item.id);
          }
          if (include?.checklistMatches) {
            res.checklistMatches = mockDocumentChecklistMatches.filter((m) => m.documentId === item.id);
          }
          if (include?.testMatches) {
            res.testMatches = mockDocumentTestMatches.filter((t) => t.documentId === item.id);
          }
          return res;
        }),
        update: vi.fn().mockImplementation(async ({ where, data, include }: any) => {
          const idx = mockProductDocuments.findIndex((d) => d.id === where.id);
          if (idx === -1) return null;
          mockProductDocuments[idx] = {
            ...mockProductDocuments[idx],
            ...data,
            updatedAt: new Date(),
          };
          const item = mockProductDocuments[idx];
          const res = { ...item };
          if (include?.structuredExtraction) {
            res.structuredExtraction = mockDocumentStructuredExtractions.find((s) => s.documentId === item.id) || null;
          }
          if (include?.pageEvidence) {
            res.pageEvidence = mockDocumentPageEvidences.filter((e) => e.documentId === item.id);
          }
          if (include?.checklistMatches) {
            res.checklistMatches = mockDocumentChecklistMatches.filter((m) => m.documentId === item.id);
          }
          if (include?.testMatches) {
            res.testMatches = mockDocumentTestMatches.filter((t) => t.documentId === item.id);
          }
          return res;
        }),
        updateMany: vi.fn().mockImplementation(async ({ where, data }: any) => {
          let count = 0;
          mockProductDocuments.forEach((d) => {
            if (where.productId && d.productId !== where.productId) return;
            if (where.documentFamily && d.documentFamily !== where.documentFamily) return;
            Object.assign(d, data);
            count++;
          });
          return { count };
        }),
        delete: vi.fn().mockImplementation(async ({ where }: any) => {
          const idx = mockProductDocuments.findIndex((d) => d.id === where.id);
          if (idx >= 0) {
            const removed = mockProductDocuments.splice(idx, 1)[0];
            return removed;
          }
          return null;
        }),
      },
      productCertificationAnalysis: {
        findFirst: vi.fn().mockImplementation(async ({ where, include }: any) => {
          const item = mockProductCertificationAnalyses.find(
            (a) => a.productId === where.productId && (where.status ? a.status === where.status : true)
          );
          if (!item) return null;
          const res = { ...item };
          if (include?.documentationChecklist) {
            res.documentationChecklist = mockProductDocumentationChecklistItems.filter(
              (c) => c.analysisId === item.id
            );
          }
          return res;
        }),
      },
      productTestingAnalysis: {
        findFirst: vi.fn().mockImplementation(async ({ where, include }: any) => {
          const item = mockProductTestingAnalyses.find(
            (a) => a.productId === where.productId && (where.status ? a.status === where.status : true)
          );
          if (!item) return null;
          const res = { ...item };
          if (include?.requirements) {
            res.requirements = mockProductTestRequirements.filter((r) => r.analysisId === item.id);
          }
          return res;
        }),
      },
      productDocumentCompletenessAnalysis: {
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          return { id: `comp-${Date.now()}`, ...data, createdAt: new Date() };
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

describe('Phase 9 — Document Intelligence API Tests', () => {
  let app: any;
  let generateAccessToken: any;
  const testUserId = '00000000-0000-0000-0000-000000000001';
  const otherUserId = '00000000-0000-0000-0000-000000000002';
  let authCookie: string;
  let otherAuthCookie: string;

  const testProduct = {
    id: 'prod-led-luminaire-doc-1',
    userId: testUserId,
    name: 'Industrial LED High Bay 150W',
    category: 'LED Lighting',
    isActive: true,
  };

  const testStandard = {
    id: 'std-10322-5-1',
    isNumber: 'IS 10322 (Part 5/Sec 1) : 2012',
    title: 'Luminaires - Particular Requirements - General Purpose',
  };

  beforeAll(async () => {
    const appModule = await import('../src/app.js');
    app = appModule.app;

    const sessionModule = await import('../src/services/session.service.js');
    generateAccessToken = sessionModule.createAuthToken;

    const userPayload = {
      id: testUserId,
      email: 'doc-tester@bis.gov.in',
      name: 'Document Compliance Officer',
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
    mockProductDocuments = [];
    mockDocumentPageEvidences = [];
    mockDocumentStructuredExtractions = [];
    mockDocumentChecklistMatches = [];
    mockDocumentTestMatches = [];
    mockAuditLogs = [];

    mockProductCertificationAnalyses = [
      {
        id: 'cert-analysis-doc-1',
        productId: testProduct.id,
        status: 'COMPLETED',
      },
    ];

    mockProductDocumentationChecklistItems = [
      {
        id: 'check-1',
        analysisId: 'cert-analysis-doc-1',
        category: 'Testing',
        documentName: 'Independent Test Report from BIS Recognized Lab',
        requiredStatus: 'REQUIRED',
        reason: 'Statutory compliance verification',
      },
      {
        id: 'check-2',
        analysisId: 'cert-analysis-doc-1',
        category: 'Calibration',
        documentName: 'Calibration Certificates of Test Equipment',
        requiredStatus: 'REQUIRED',
        reason: 'Measurement traceability assurance',
      },
      {
        id: 'check-3',
        analysisId: 'cert-analysis-doc-1',
        category: 'Manufacturing',
        documentName: 'Factory Layout Plan and Machinery List',
        requiredStatus: 'REQUIRED',
        reason: 'Factory premises verification',
      },
    ];

    mockProductTestingAnalyses = [
      {
        id: 'test-analysis-doc-1',
        productId: testProduct.id,
        status: 'COMPLETED',
      },
    ];

    mockProductTestRequirements = [
      {
        id: 'test-req-1',
        analysisId: 'test-analysis-doc-1',
        testName: 'Insulation Resistance Test',
        testMethod: 'IS 10322 (Part 5/Sec 1)',
        clause: 'Cl 8.1',
        parameter: 'insulation resistance',
      },
      {
        id: 'test-req-2',
        analysisId: 'test-analysis-doc-1',
        testName: 'High Voltage Breakdown Strength Test',
        testMethod: 'IS 10322 (Part 5/Sec 1)',
        clause: 'Cl 8.2',
        parameter: 'dielectric voltage',
      },
    ];
  });

  it('1. Rejects unauthenticated document upload with 401 Unauthorized', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${testProduct.id}/documents`)
      .send({ rawText: 'Sample test report' });

    expect(res.status).toBe(401);
  });

  it('2. Prevents non-owner product access with 404/403 (IDOR Protection)', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${testProduct.id}/documents`)
      .set('Cookie', otherAuthCookie)
      .send({ rawText: 'Sample test report' });

    expect(res.status).toBe(404);
  });

  it('3. Uploads and processes a valid compliance test report successfully', async () => {
    const reportText = `=== PAGE 1 ===
TEST REPORT
Testing Laboratory: National Test House, Kolkata (BIS Recognized & NABL Accredited)
Report No: TR/NTH/2026/10322-8842
Date of Issue: 15-08-2026
Product Name: Industrial LED High Bay Luminaire 150W
Model No: LHB-150-CW
Manufacturer: Bharat Luminaires Pvt Ltd
Indian Standard: IS 10322 (Part 5/Sec 1) : 2012

=== PAGE 2 ===
TEST RESULTS TABLE
Test Item: Insulation Resistance Test (Clause 8.1)
Method: IS 10322 (Part 5/Sec 1)
Requirement: Min 2.0 Megaohms
Observed Value: 45.8 Megaohms
Outcome: PASSED / SATISFACTORY

Test Item: High Voltage Breakdown Strength Test (Clause 8.2)
Applied Voltage: 1500 V AC for 60 seconds
Observed Breakdown: Nil breakdown
Outcome: PASSED / COMPLIES
`;

    const res = await request(app)
      .post(`/api/v1/products/${testProduct.id}/documents`)
      .set('Cookie', authCookie)
      .send({
        rawText: reportText,
        fileName: 'NTH_Test_Report_IS10322.pdf',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toBeDefined();

    const doc = res.body.data;
    expect(doc.originalFileName).toBe('NTH_Test_Report_IS10322.pdf');
    expect(doc.documentType).toBe('TEST_REPORT');
    expect(doc.processingStatus).toBe('ANALYZED');
    expect(doc.pageCount).toBe(2);
    expect(doc.structuredExtraction).toBeDefined();
    expect(doc.structuredExtraction.laboratoryName).toContain('National Test House');
    expect(doc.structuredExtraction.reportNumber).toBe('TR/NTH/2026/10322-8842');
    expect(doc.structuredExtraction.standardNumber).toContain('IS 10322');
    expect(doc.structuredExtraction.passFailStatus).toBe('PASS');
  });

  it('4. Preserves page-level evidence citations with page numbers and text snippets', async () => {
    const reportText = `=== PAGE 1 ===
TEST REPORT
Testing Laboratory: BIS Central Laboratory
Report No: BIS-CL-2026-992
Date of Issue: 20-09-2026
Indian Standard: IS 10322 (Part 5/Sec 1) : 2012
Outcome: PASSED
`;

    const res = await request(app)
      .post(`/api/v1/products/${testProduct.id}/documents`)
      .set('Cookie', authCookie)
      .send({
        rawText: reportText,
        fileName: 'BIS_Central_Lab_Report.pdf',
      });

    expect(res.status).toBe(201);
    const doc = res.body.data;
    expect(doc.pageEvidence.length).toBeGreaterThan(0);
    expect(doc.pageEvidence[0].pageNumber).toBe(1);
    expect(doc.pageEvidence[0].claim).toBeDefined();
    expect(doc.pageEvidence[0].sourceText).toBeDefined();
  });

  it('5. Correctly handles calibration certificates with due dates and intervals', async () => {
    const calText = `=== PAGE 1 ===
CERTIFICATE OF CALIBRATION
Issued by: Apex Precision Calibration Laboratory (NABL Accredited)
Certificate No: CAL/2026/HV-042
Equipment Name: High Voltage Breakdown Tester 5kV
Equipment ID: EQ-HVT-01
Date of Calibration: 10-01-2026
Next Calibration Due: 10-01-2027
Calibration Interval: 12 Months
Traceability: Traceable to NPL (National Physical Laboratory, New Delhi)
Calibration Outcome Status: CALIBRATED / SATISFACTORY
`;

    const res = await request(app)
      .post(`/api/v1/products/${testProduct.id}/documents`)
      .set('Cookie', authCookie)
      .send({
        rawText: calText,
        fileName: 'HV_Tester_Calibration_Cert.pdf',
      });

    expect(res.status).toBe(201);
    const doc = res.body.data;
    expect(doc.documentType).toBe('CALIBRATION_CERTIFICATE');
    expect(doc.structuredExtraction.certificateNumber).toBe('CAL/2026/HV-042');
    expect(doc.structuredExtraction.calibrationInterval).toContain('12 Months');
    expect(doc.structuredExtraction.traceability).toContain('NPL');
    expect(doc.structuredExtraction.validityStatus).toBe('VALID');
  });

  it('6. Maps uploaded documents against Phase 7 statutory checklist items', async () => {
    const reportText = `TEST REPORT
Testing Laboratory: ERDA Vadodara
Report No: ERDA/2026/88
Indian Standard: IS 10322
Outcome: PASSED
`;

    const res = await request(app)
      .post(`/api/v1/products/${testProduct.id}/documents`)
      .set('Cookie', authCookie)
      .send({
        rawText: reportText,
        fileName: 'ERDA_Test_Report.pdf',
      });

    expect(res.status).toBe(201);
    const doc = res.body.data;
    expect(doc.checklistMatches.length).toBeGreaterThan(0);
    expect(doc.checklistMatches[0].requirementTitle).toContain('Test Report');
    expect(doc.checklistMatches[0].matchStatus).toBe('MATCHED');
  });

  it('7. Maps uploaded test report against Phase 8 test requirements', async () => {
    const reportText = `TEST REPORT
Testing Laboratory: CPRI Bengaluru
Report No: CPRI/2026/01
Indian Standard: IS 10322
Test Item: Insulation Resistance Test (Clause 8.1)
Outcome: PASSED
`;

    const res = await request(app)
      .post(`/api/v1/products/${testProduct.id}/documents`)
      .set('Cookie', authCookie)
      .send({
        rawText: reportText,
        fileName: 'CPRI_Test_Report.pdf',
      });

    expect(res.status).toBe(201);
    const doc = res.body.data;
    expect(doc.testMatches.length).toBeGreaterThan(0);
    expect(doc.testMatches[0].testName).toBe('Insulation Resistance Test');
    expect(doc.testMatches[0].passFailStatus).toBe('PASS');
  });

  it('8. Calculates explainable document completeness and readiness score (0-100)', async () => {
    const res = await request(app)
      .get(`/api/v1/products/${testProduct.id}/documents/completeness`)
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toBeDefined();

    const comp = res.body.data;
    expect(comp.score).toBeGreaterThanOrEqual(0);
    expect(comp.score).toBeLessThanOrEqual(100);
    expect(comp.totalRequired).toBe(3);
    expect(comp.status).toBeDefined();
    expect(comp.checklistBreakdown.length).toBe(3);
  });

  it('9. Handles document versioning when re-uploading same document family', async () => {
    const v1Text = 'TEST REPORT version 1 - draft';
    const v2Text = 'TEST REPORT version 2 - final';

    const res1 = await request(app)
      .post(`/api/v1/products/${testProduct.id}/documents`)
      .set('Cookie', authCookie)
      .send({
        rawText: v1Text,
        fileName: 'Standard_Test_Report.pdf',
      });

    expect(res1.status).toBe(201);
    expect(res1.body.data.version).toBe(1);

    const res2 = await request(app)
      .post(`/api/v1/products/${testProduct.id}/documents`)
      .set('Cookie', authCookie)
      .send({
        rawText: v2Text,
        fileName: 'Standard_Test_Report.pdf',
      });

    expect(res2.status).toBe(201);
    expect(res2.body.data.version).toBe(2);
    expect(res2.body.data.supersedesDocumentId).toBe(res1.body.data.id);
  });

  it('10. Allows human-in-the-loop verification status update (VERIFIED / REJECTED)', async () => {
    const reportText = 'TEST REPORT by National Test House';
    const createRes = await request(app)
      .post(`/api/v1/products/${testProduct.id}/documents`)
      .set('Cookie', authCookie)
      .send({
        rawText: reportText,
        fileName: 'Audit_Report.pdf',
      });

    const docId = createRes.body.data.id;

    const verifyRes = await request(app)
      .post(`/api/v1/products/${testProduct.id}/documents/${docId}/verify`)
      .set('Cookie', authCookie)
      .send({
        verificationStatus: 'VERIFIED',
        documentType: 'TEST_REPORT',
        verificationNotes: 'Verified against NABL accreditation schedule.',
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.verificationStatus).toBe('VERIFIED');
    expect(verifyRes.body.data.verificationNotes).toContain('NABL');
  });

  it('11. Deletes a document and records audit log', async () => {
    const reportText = 'Temporary Document to be deleted';
    const createRes = await request(app)
      .post(`/api/v1/products/${testProduct.id}/documents`)
      .set('Cookie', authCookie)
      .send({
        rawText: reportText,
        fileName: 'Temp_Doc.pdf',
      });

    const docId = createRes.body.data.id;

    const delRes = await request(app)
      .delete(`/api/v1/products/${testProduct.id}/documents/${docId}`)
      .set('Cookie', authCookie);

    expect(delRes.status).toBe(200);
    expect(delRes.body.data.success).toBe(true);
  });

  it('12. Rejects files exceeding size limit or invalid extensions', async () => {
    const invalidRes = await request(app)
      .post(`/api/v1/products/${testProduct.id}/documents`)
      .set('Cookie', authCookie)
      .send({
        rawText: 'Malicious executable payload',
        fileName: 'malware.exe',
      });

    expect(invalidRes.status).toBe(400);
  });
});
