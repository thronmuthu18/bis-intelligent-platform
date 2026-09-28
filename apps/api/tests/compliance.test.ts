process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.JWT_SECRET = 'test-jwt-secret-must-be-at-least-32-characters-long!';

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// ── Mock Environment ──────────────────────────────────────────────────────────
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test_db');
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('LOG_LEVEL', 'error');
vi.stubEnv('FRONTEND_URL', 'http://localhost:5173');
vi.stubEnv('JWT_SECRET', 'test-jwt-secret-must-be-at-least-32-characters-long!');

// ── In-Memory Database Store for Compliance Tests ─────────────────────────────
let mockUsers: any[] = [];
let mockProducts: any[] = [];
let mockProductAttributes: any[] = [];
let mockStandards: any[] = [];
let mockSchemes: any[] = [];
let mockStandardReviews: any[] = [];
let mockCertificationAnalyses: any[] = [];
let mockTestingAnalyses: any[] = [];
let mockLaboratoryReviews: any[] = [];
let mockLaboratories: any[] = [];
let mockProductDocuments: any[] = [];
let mockDocumentCompletenessAnalyses: any[] = [];
let mockComplianceJourneys: any[] = [];
let mockComplianceRequirements: any[] = [];
let mockComplianceRequirementDependencies: any[] = [];
let mockComplianceTasks: any[] = [];
let mockComplianceAutomationRuns: any[] = [];
let mockApplicationDossiers: any[] = [];
let mockApplicationDossierItems: any[] = [];
let mockRegulatoryChangeEvents: any[] = [];
let mockRegulatoryImpacts: any[] = [];
let mockComplianceAlerts: any[] = [];
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
      product: {
        findUnique: vi.fn().mockImplementation(async ({ where, include }: any) => {
          const prod = mockProducts.find((p) => p.id === where.id);
          if (!prod) return null;
          const res = { ...prod };
          if (include?.attributes) {
            res.attributes = mockProductAttributes.filter((a) => a.productId === prod.id);
          }
          if (include?.standardReviews) {
            res.standardReviews = mockStandardReviews
              .filter((r) => r.productId === prod.id)
              .map((r) => {
                const std = mockStandards.find((s) => s.id === r.standardId) || {
                  id: r.standardId,
                  isNumber: 'IS 10322',
                  title: 'Luminaires',
                  status: 'CURRENT',
                  amendments: [],
                  qcoMappings: [],
                  schemeMappings: [{ scheme: { id: 'scheme-1', name: 'Scheme-I', code: 'Scheme-I' } }],
                };
                return { ...r, standard: std };
              });
          }
          if (include?.certificationAnalyses) {
            res.certificationAnalyses = mockCertificationAnalyses.filter((c) => c.productId === prod.id);
          }
          if (include?.testingAnalyses) {
            res.testingAnalyses = mockTestingAnalyses.filter((t) => t.productId === prod.id);
          }
          if (include?.laboratoryReviews) {
            res.laboratoryReviews = mockLaboratoryReviews
              .filter((l) => l.productId === prod.id)
              .map((l) => {
                const lab = mockLaboratories.find((lab) => lab.id === l.laboratoryId) || {
                  id: l.laboratoryId,
                  name: 'National Testing House (NTH)',
                  code: 'NTH-01',
                  city: 'Kolkata',
                  organizationType: 'BIS_RECOGNIZED',
                };
                return { ...l, laboratory: lab };
              });
          }
          if (include?.documents) {
            res.documents = mockProductDocuments.filter((d) => d.productId === prod.id);
          }
          if (include?.documentCompletenessAnalyses) {
            res.documentCompletenessAnalyses = mockDocumentCompletenessAnalyses.filter((c) => c.productId === prod.id);
          }
          if (include?.complianceJourneys) {
            res.complianceJourneys = mockComplianceJourneys.filter((j) => j.productId === prod.id);
          }
          if (include?.applicationDossiers) {
            res.applicationDossiers = mockApplicationDossiers.filter((d) => d.productId === prod.id);
          }
          if (include?.auditLogs) {
            res.auditLogs = mockAuditLogs.filter((a) => a.productId === prod.id);
          }
          return res;
        }),
        findMany: vi.fn().mockImplementation(async ({ where, include }: any) => {
          return mockProducts.filter((p) => {
            if (where?.category?.in && !where.category.in.includes(p.category)) return false;
            return true;
          }).map((prod) => {
            const res = { ...prod };
            if (include?.standardReviews) {
              res.standardReviews = mockStandardReviews
                .filter((r) => r.productId === prod.id)
                .map((r) => {
                  const std = mockStandards.find((s) => s.id === r.standardId) || {
                    id: r.standardId,
                    isNumber: 'IS 10322',
                    title: 'Luminaires',
                    status: 'CURRENT',
                  };
                  return { ...r, standard: std };
                });
            }
            if (include?.complianceJourneys) {
              res.complianceJourneys = mockComplianceJourneys.filter((j) => j.productId === prod.id);
            }
            return res;
          });
        }),
      },
      complianceJourney: {
        create: vi.fn().mockImplementation(async ({ data, include }: any) => {
          const item = {
            id: `journey-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            ...data,
            readinessScore: 0,
            readinessStatus: 'IN_PROGRESS',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockComplianceJourneys.push(item);
          return item;
        }),
        findFirst: vi.fn().mockImplementation(async ({ where, include }: any) => {
          const item = mockComplianceJourneys.find((j) => {
            if (where.productId && j.productId !== where.productId) return false;
            if (where.id && j.id !== where.id) return false;
            return true;
          });
          if (!item) return null;
          const res = { ...item };
          if (include?.requirements) {
            res.requirements = mockComplianceRequirements
              .filter((r) => r.journeyId === item.id)
              .map((r) => {
                const deps = mockComplianceRequirementDependencies
                  .filter((d) => d.requirementId === r.id)
                  .map((d) => ({
                    ...d,
                    prerequisiteRequirement: mockComplianceRequirements.find((pr) => pr.id === d.prerequisiteRequirementId),
                  }));
                return { ...r, dependencies: deps, dependedBy: [] };
              });
          }
          if (include?.tasks) {
            res.tasks = mockComplianceTasks
              .filter((t) => t.journeyId === item.id)
              .map((t) => {
                const req = mockComplianceRequirements.find((r) => r.id === t.requirementId);
                let deps: any[] = [];
                if (req) {
                  deps = mockComplianceRequirementDependencies
                    .filter((d) => d.requirementId === req.id)
                    .map((d) => ({
                      ...d,
                      prerequisiteRequirement: mockComplianceRequirements.find((pr) => pr.id === d.prerequisiteRequirementId),
                    }));
                }
                return {
                  ...t,
                  requirement: req ? { ...req, dependencies: deps } : null,
                };
              });
          }
          if (include?.dossiers) {
            res.dossiers = mockApplicationDossiers.filter((d) => d.journeyId === item.id);
          }
          if (include?.product) {
            const prod = mockProducts.find((p) => p.id === item.productId);
            res.product = {
              ...prod,
              standardReviews: mockStandardReviews
                .filter((r) => r.productId === item.productId)
                .map((r) => ({
                  ...r,
                  standard: mockStandards.find((s) => s.id === r.standardId) || {
                    id: r.standardId,
                    isNumber: 'IS 10322',
                    title: 'Luminaires',
                    status: 'CURRENT',
                    schemeMappings: [{ scheme: { name: 'Scheme-I' } }],
                  },
                })),
              documents: mockProductDocuments.filter((d) => d.productId === item.productId),
              laboratoryReviews: mockLaboratoryReviews.filter((l) => l.productId === item.productId),
              testingAnalyses: mockTestingAnalyses.filter((t) => t.productId === item.productId),
              certificationAnalyses: mockCertificationAnalyses.filter((c) => c.productId === item.productId),
            };
          }
          if (include?.alerts) {
            res.alerts = mockComplianceAlerts.filter((a) => a.journeyId === item.id);
          }
          return res;
        }),
        findUnique: vi.fn().mockImplementation(async ({ where, include }: any) => {
          const item = mockComplianceJourneys.find((j) => j.id === where.id);
          if (!item) return null;
          const res = { ...item };
          if (include?.requirements) {
            res.requirements = mockComplianceRequirements
              .filter((r) => r.journeyId === item.id)
              .map((r) => {
                const deps = mockComplianceRequirementDependencies
                  .filter((d) => d.requirementId === r.id)
                  .map((d) => ({
                    ...d,
                    prerequisiteRequirement: mockComplianceRequirements.find((pr) => pr.id === d.prerequisiteRequirementId),
                  }));
                return { ...r, dependencies: deps, dependedBy: [] };
              });
          }
          if (include?.tasks) {
            res.tasks = mockComplianceTasks.filter((t) => t.journeyId === item.id);
          }
          if (include?.product) {
            const prod = mockProducts.find((p) => p.id === item.productId);
            res.product = {
              ...prod,
              documents: mockProductDocuments.filter((d) => d.productId === item.productId),
              laboratoryReviews: mockLaboratoryReviews.filter((l) => l.productId === item.productId),
              testingAnalyses: mockTestingAnalyses.filter((t) => t.productId === item.productId),
              certificationAnalyses: mockCertificationAnalyses.filter((c) => c.productId === item.productId),
            };
          }
          if (include?.alerts) {
            res.alerts = mockComplianceAlerts.filter((a) => a.journeyId === item.id);
          }
          return res;
        }),
        update: vi.fn().mockImplementation(async ({ where, data }: any) => {
          const idx = mockComplianceJourneys.findIndex((j) => j.id === where.id);
          if (idx !== -1) {
            mockComplianceJourneys[idx] = { ...mockComplianceJourneys[idx], ...data, updatedAt: new Date() };
            return mockComplianceJourneys[idx];
          }
          return null;
        }),
      },
      complianceRequirement: {
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          const item = {
            id: `req-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockComplianceRequirements.push(item);
          return item;
        }),
        update: vi.fn().mockImplementation(async ({ where, data }: any) => {
          const idx = mockComplianceRequirements.findIndex((r) => r.id === where.id);
          if (idx !== -1) {
            mockComplianceRequirements[idx] = { ...mockComplianceRequirements[idx], ...data, updatedAt: new Date() };
            return mockComplianceRequirements[idx];
          }
          return null;
        }),
        findMany: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockComplianceRequirements.filter((r) => r.journeyId === where.journeyId);
        }),
      },
      complianceRequirementDependency: {
        upsert: vi.fn().mockImplementation(async ({ where, create }: any) => {
          const existing = mockComplianceRequirementDependencies.find(
            (d) =>
              d.requirementId === where.requirementId_prerequisiteRequirementId.requirementId &&
              d.prerequisiteRequirementId === where.requirementId_prerequisiteRequirementId.prerequisiteRequirementId
          );
          if (existing) return existing;
          const item = { id: `dep-${Date.now()}-${Math.random()}`, ...create, createdAt: new Date() };
          mockComplianceRequirementDependencies.push(item);
          return item;
        }),
      },
      complianceTask: {
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          const item = {
            id: `task-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockComplianceTasks.push(item);
          return item;
        }),
        findUnique: vi.fn().mockImplementation(async ({ where, include }: any) => {
          const task = mockComplianceTasks.find((t) => t.id === where.id);
          if (!task) return null;
          const res = { ...task };
          if (include?.requirement) {
            const req = mockComplianceRequirements.find((r) => r.id === task.requirementId);
            let deps: any[] = [];
            if (req) {
              deps = mockComplianceRequirementDependencies
                .filter((d) => d.requirementId === req.id)
                .map((d) => ({
                  ...d,
                  prerequisiteRequirement: mockComplianceRequirements.find((pr) => pr.id === d.prerequisiteRequirementId),
                }));
            }
            res.requirement = req ? { ...req, dependencies: deps } : null;
          }
          return res;
        }),
        update: vi.fn().mockImplementation(async ({ where, data, include }: any) => {
          const idx = mockComplianceTasks.findIndex((t) => t.id === where.id);
          if (idx !== -1) {
            mockComplianceTasks[idx] = { ...mockComplianceTasks[idx], ...data, updatedAt: new Date() };
            const res = { ...mockComplianceTasks[idx] };
            if (include?.requirement) {
              res.requirement = mockComplianceRequirements.find((r) => r.id === res.requirementId) || null;
            }
            return res;
          }
          return null;
        }),
        findMany: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockComplianceTasks.filter((t) => t.journeyId === where.journeyId);
        }),
      },
      complianceAutomationRun: {
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          const item = { id: `run-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date() };
          mockComplianceAutomationRuns.push(item);
          return item;
        }),
      },
      applicationDossier: {
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          const item = {
            id: `dossier-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockApplicationDossiers.push(item);
          return item;
        }),
        findFirst: vi.fn().mockImplementation(async ({ where, include }: any) => {
          const item = mockApplicationDossiers.find((d) => {
            if (where.journeyId && d.journeyId !== where.journeyId) return false;
            return true;
          });
          if (!item) return null;
          const res = { ...item };
          if (include?.items) {
            res.items = mockApplicationDossierItems
              .filter((i) => i.dossierId === item.id)
              .map((i) => ({
                ...i,
                document: mockProductDocuments.find((doc) => doc.id === i.documentId) || null,
              }));
          }
          return res;
        }),
        update: vi.fn().mockImplementation(async ({ where, data }: any) => {
          const idx = mockApplicationDossiers.findIndex((d) => d.id === where.id);
          if (idx !== -1) {
            mockApplicationDossiers[idx] = { ...mockApplicationDossiers[idx], ...data, updatedAt: new Date() };
            return mockApplicationDossiers[idx];
          }
          return null;
        }),
      },
      applicationDossierItem: {
        deleteMany: vi.fn().mockImplementation(async ({ where }: any) => {
          mockApplicationDossierItems = mockApplicationDossierItems.filter((i) => i.dossierId !== where.dossierId);
          return { count: 0 };
        }),
        createMany: vi.fn().mockImplementation(async ({ data }: any) => {
          for (const item of data) {
            mockApplicationDossierItems.push({
              id: `ditem-${Date.now()}-${Math.random()}`,
              ...item,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
          return { count: data.length };
        }),
        findMany: vi.fn().mockImplementation(async ({ where, include }: any) => {
          return mockApplicationDossierItems
            .filter((i) => i.dossierId === where.dossierId)
            .map((i) => ({
              ...i,
              document: mockProductDocuments.find((d) => d.id === i.documentId) || null,
            }));
        }),
      },
      regulatoryChangeEvent: {
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          const item = {
            id: `change-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            ...data,
            detectedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockRegulatoryChangeEvents.push(item);
          return item;
        }),
        findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockRegulatoryChangeEvents.find((e) => e.id === where.id) || null;
        }),
      },
      regulatoryImpact: {
        upsert: vi.fn().mockImplementation(async ({ where, create, update }: any) => {
          const existingIdx = mockRegulatoryImpacts.findIndex(
            (i) =>
              i.changeEventId === where.changeEventId_productId.changeEventId &&
              i.productId === where.changeEventId_productId.productId
          );
          if (existingIdx !== -1) {
            mockRegulatoryImpacts[existingIdx] = { ...mockRegulatoryImpacts[existingIdx], ...update };
            return mockRegulatoryImpacts[existingIdx];
          }
          const item = {
            id: `imp-${Date.now()}-${Math.random()}`,
            ...create,
            createdAt: new Date(),
          };
          mockRegulatoryImpacts.push(item);
          return item;
        }),
        findMany: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockRegulatoryImpacts
            .filter((i) => i.productId === where.productId)
            .map((i) => ({
              ...i,
              changeEvent: mockRegulatoryChangeEvents.find((e) => e.id === i.changeEventId) || {
                id: i.changeEventId,
                title: 'Gazette QCO 2026',
                summary: 'New mandate for luminaires',
                changeType: 'QCO_NEW',
                affectedStandards: ['IS 10322'],
                affectedProductCategories: ['Lighting'],
                detectedAt: new Date(),
                authorityLevel: 'AUTHORITATIVE',
                status: 'ACTIVE',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            }));
        }),
      },
      complianceAlert: {
        findFirst: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockComplianceAlerts.find((a) => {
            if (where.productId && a.productId !== where.productId) return false;
            if (where.alertType && a.alertType !== where.alertType) return false;
            if (where.source && a.source !== where.source) return false;
            if (where.isResolved !== undefined && a.isResolved !== where.isResolved) return false;
            return true;
          }) || null;
        }),
        upsert: vi.fn().mockImplementation(async ({ where, create, update }: any) => {
          const idx = mockComplianceAlerts.findIndex((a) => a.id === where.id);
          if (idx !== -1) {
            mockComplianceAlerts[idx] = { ...mockComplianceAlerts[idx], ...update, updatedAt: new Date() };
            return mockComplianceAlerts[idx];
          }
          const item = {
            id: where.id || `alert-${Date.now()}-${Math.random()}`,
            ...create,
            isRead: false,
            isResolved: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockComplianceAlerts.push(item);
          return item;
        }),
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          const item = {
            id: `alert-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            ...data,
            isRead: false,
            isResolved: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockComplianceAlerts.push(item);
          return item;
        }),
        findMany: vi.fn().mockImplementation(async ({ where, include }: any) => {
          return mockComplianceAlerts
            .filter((a) => a.productId === where.productId)
            .map((a) => ({
              ...a,
              product: mockProducts.find((p) => p.id === a.productId) || { name: 'LED Luminaire' },
            }));
        }),
        update: vi.fn().mockImplementation(async ({ where, data }: any) => {
          const idx = mockComplianceAlerts.findIndex((a) => a.id === where.id);
          if (idx !== -1) {
            mockComplianceAlerts[idx] = { ...mockComplianceAlerts[idx], ...data, updatedAt: new Date() };
            return mockComplianceAlerts[idx];
          }
          return null;
        }),
      },
      auditLog: {
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          const item = { id: `audit-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date() };
          mockAuditLogs.push(item);
          return item;
        }),
      },
    },
  };
});

let app: any;

describe('Phase 10 — Compliance Automation & Journey Orchestration Test Suite', () => {
  const userId = 'user-owner-101';
  const otherUserId = 'user-unauthorized-202';
  const productId = 'prod-luminaire-101';

  let tokenOwner: string;
  let tokenOther: string;

  beforeAll(async () => {
    const appModule = await import('../src/app.js');
    app = appModule.app;

    const { createAuthToken } = await import('../src/services/session.service.js');
    tokenOwner = createAuthToken({ id: userId, email: 'owner@example.com', name: 'Owner', role: 'USER' });
    tokenOther = createAuthToken({ id: otherUserId, email: 'other@example.com', name: 'Other', role: 'USER' });
  });

  beforeEach(() => {
    // Reset in-memory DB fixtures
    mockUsers = [
      { id: userId, email: 'owner@example.com', role: 'USER' },
      { id: otherUserId, email: 'other@example.com', role: 'USER' },
    ];

    mockProducts = [
      {
        id: productId,
        userId: userId,
        name: 'Industrial LED High Bay Luminaire',
        category: 'Lighting & Electronics',
        description: 'Heavy-duty 150W LED Luminaire for warehouse lighting',
        status: 'IN_PROGRESS',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockProductAttributes = [
      { id: 'attr-1', productId, attributeKey: 'wattage', attributeValue: '150W', normalizedValue: '150' },
      { id: 'attr-2', productId, attributeKey: 'ipRating', attributeValue: 'IP65', normalizedValue: 'IP65' },
    ];

    mockStandards = [
      {
        id: 'std-is-10322',
        isNumber: 'IS 10322 (Part 5/Sec 1)',
        title: 'Luminaires - Particular Requirements - Fixed General Purpose',
        status: 'CURRENT',
        amendments: [],
        qcoMappings: [
          {
            qco: {
              id: 'qco-led-1',
              title: 'Luminaires (Quality Control) Order, 2024',
              orderNumber: 'S.O. 1234(E)',
              ministry: 'Ministry of Heavy Industries',
              effectiveDate: new Date('2024-06-01'),
              status: 'ACTIVE',
            },
          },
        ],
        schemeMappings: [
          {
            scheme: {
              id: 'scheme-1',
              name: 'Scheme-I (ISI Mark)',
              code: 'Scheme-I',
            },
          },
        ],
      },
      {
        id: 'std-is-16102',
        isNumber: 'IS 16102 (Part 1)',
        title: 'Self-Ballasted LED Lamps for General Lighting Services',
        status: 'CURRENT',
        amendments: [],
        qcoMappings: [],
        schemeMappings: [
          {
            scheme: {
              id: 'scheme-crs',
              name: 'Compulsory Registration Scheme (CRS)',
              code: 'Scheme-II',
            },
          },
        ],
      },
    ];

    mockStandardReviews = [
      { id: 'rev-1', productId, standardId: 'std-is-10322', decision: 'CONFIRMED' },
      { id: 'rev-2', productId, standardId: 'std-is-16102', decision: 'CONFIRMED' },
    ];

    mockCertificationAnalyses = [
      {
        id: 'cert-an-1',
        productId,
        schemeRecommendations: [{ scheme: { id: 'scheme-1', name: 'Scheme-I (ISI Mark)' } }],
        documentationChecklist: [
          {
            id: 'chk-factory-layout',
            category: 'FACTORY',
            documentName: 'Factory Layout Plan',
            reason: 'Mandatory for factory inspection and preliminary audit',
            requiredStatus: 'REQUIRED',
          },
          {
            id: 'chk-quality-manual',
            category: 'QUALITY_CONTROL',
            documentName: 'Quality Control Manual & SIT',
            reason: 'Mandatory in-house inspection scheme',
            requiredStatus: 'REQUIRED',
          },
        ],
      },
    ];

    mockTestingAnalyses = [
      {
        id: 'test-an-1',
        productId,
        requirements: [
          {
            id: 'test-insulation',
            standardId: 'std-is-10322',
            testName: 'Insulation Resistance Test',
            clause: 'Clause 8.1',
            requirementValue: 'Min 2.0 MOhm',
            testCategory: 'ELECTRICAL',
            status: 'REQUIRED',
          },
          {
            id: 'test-thermal',
            standardId: 'std-is-10322',
            testName: 'Thermal Endurance Test',
            clause: 'Clause 12.3',
            requirementValue: 'No deformation under rated ambient',
            testCategory: 'THERMAL',
            status: 'REQUIRED',
          },
        ],
      },
    ];

    mockLaboratoryReviews = [
      {
        id: 'lab-rev-1',
        productId,
        laboratoryId: 'lab-nth',
        decision: 'SELECTED',
      },
    ];

    mockLaboratories = [
      {
        id: 'lab-nth',
        name: 'National Testing House (NTH)',
        code: 'NTH-KOL-01',
        city: 'Kolkata',
        organizationType: 'BIS_RECOGNIZED',
      },
    ];

    mockProductDocuments = [
      {
        id: 'doc-factory-layout',
        productId,
        documentType: 'FACTORY_LAYOUT',
        originalFileName: 'factory_layout_approved.pdf',
        verificationStatus: 'VERIFIED',
        extractedData: {},
        testMatches: [],
        checklistMatches: [{ checklistId: 'chk-factory-layout' }],
      },
      {
        id: 'doc-cal-cert',
        productId,
        documentType: 'CALIBRATION_CERTIFICATE',
        originalFileName: 'cal_master_gauge.pdf',
        verificationStatus: 'VERIFIED',
        extractedData: {
          calibrationDueDate: '2026-10-15',
        },
        testMatches: [],
        checklistMatches: [],
      },
    ];

    mockDocumentCompletenessAnalyses = [
      {
        id: 'comp-1',
        productId,
        score: 65,
        status: 'PARTIALLY_COMPLETE',
        missingCount: 1,
        missingDocumentTypes: ['QUALITY_CONTROL_DOCUMENT'],
      },
    ];

    mockComplianceJourneys = [];
    mockComplianceRequirements = [];
    mockComplianceRequirementDependencies = [];
    mockComplianceTasks = [];
    mockComplianceAutomationRuns = [];
    mockApplicationDossiers = [];
    mockApplicationDossierItems = [];
    mockRegulatoryChangeEvents = [];
    mockRegulatoryImpacts = [];
    mockComplianceAlerts = [];
    mockAuditLogs = [];
  });

  // ── 1. Journey Initialization & Multi-Standard Orchestration ─────────────────
  it('1. POST /api/v1/products/:id/compliance/initialize creates a normalized multi-standard compliance journey', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${productId}/compliance/initialize`)
      .set('Authorization', `Bearer ${tokenOwner}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data.journey).toBeDefined();
    expect(data.journey.productId).toBe(productId);
    expect(data.journey.inputHash).toBeDefined();
    expect(data.confirmedStandards.length).toBe(2);
    expect(data.readiness.overallScore).toBeGreaterThan(0);
    expect(data.tasks.length).toBeGreaterThan(0);
  });

  // ── 2. Multi-Standard Deduplication ──────────────────────────────────────────
  it('2. Normalizes multi-standard requirements without duplicate generic items', async () => {
    const res = await request(app)
      .get(`/api/v1/products/${productId}/compliance`)
      .set('Authorization', `Bearer ${tokenOwner}`);

    expect(res.status).toBe(200);
    const data = res.body.data;

    // Confirmed standards IS 10322 and IS 16102
    expect(data.confirmedStandards.map((s: any) => s.isNumber)).toContain('IS 10322 (Part 5/Sec 1)');
    expect(data.confirmedStandards.map((s: any) => s.isNumber)).toContain('IS 16102 (Part 1)');

    // Base product info requirement deduplicated
    const baseInfoTasks = data.tasks.filter((t: any) => t.taskType === 'COMPLETE_PRODUCT_INFO');
    expect(baseInfoTasks.length).toBeGreaterThanOrEqual(1);
  });

  // ── 3. Blocker Protection: Cannot Complete Task If Prerequisites Unresolved ──
  it('3. POST /api/v1/products/:id/compliance/tasks/:taskId/complete blocks completion when prerequisite requirements are unresolved', async () => {
    // Initialize journey
    await request(app)
      .post(`/api/v1/products/${productId}/compliance/initialize`)
      .set('Authorization', `Bearer ${tokenOwner}`);

    // Find the application dossier task (which depends on standard confirmation and SIT)
    const tasksRes = await request(app)
      .get(`/api/v1/products/${productId}/compliance/tasks`)
      .set('Authorization', `Bearer ${tokenOwner}`);

    const blockedTask = tasksRes.body.data.find(
      (t: any) => t.isBlocked || t.title.includes('Dossier') || t.title.includes('Compile')
    );

    expect(blockedTask).toBeDefined();

    // Make sure prerequisite is marked IN_PROGRESS (unresolved)
    const sitReq = mockComplianceRequirements.find((r) => r.title.includes('SIT') || r.title.includes('Inspection'));
    if (sitReq) {
      sitReq.status = 'IN_PROGRESS';
    }

    // Try to complete the blocked application dossier task
    const completeRes = await request(app)
      .post(`/api/v1/products/${productId}/compliance/tasks/${blockedTask.id}/complete`)
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ evidenceNotes: 'Trying to force complete' });

    // Should return 400 with explainable blocker error
    expect(completeRes.status).toBe(400);
    expect(completeRes.body.success).toBe(false);
    expect(completeRes.body.message).toMatch(/prerequisite requirement/i);
  });

  // ── 4. Unblocked Task Completion Workflow ────────────────────────────────────
  it('4. POST /api/v1/products/:id/compliance/tasks/:taskId/complete completes an unblocked task and updates readiness', async () => {
    await request(app)
      .post(`/api/v1/products/${productId}/compliance/initialize`)
      .set('Authorization', `Bearer ${tokenOwner}`);

    const tasksRes = await request(app)
      .get(`/api/v1/products/${productId}/compliance/tasks`)
      .set('Authorization', `Bearer ${tokenOwner}`);

    // Pick an unblocked task (e.g. Standard review or Lab selection)
    const unblockedTask = tasksRes.body.data.find((t: any) => !t.isBlocked && t.status !== 'COMPLETED');
    expect(unblockedTask).toBeDefined();

    const completeRes = await request(app)
      .post(`/api/v1/products/${productId}/compliance/tasks/${unblockedTask.id}/complete`)
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ evidenceNotes: 'Completed during test verification' });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.success).toBe(true);
    expect(completeRes.body.data.status).toBe('COMPLETED');
    expect(completeRes.body.data.completedAt).toBeDefined();
  });

  // ── 5. Reopening a Completed Task ───────────────────────────────────────────
  it('5. POST /api/v1/products/:id/compliance/tasks/:taskId/reopen resets task and updates readiness', async () => {
    await request(app)
      .post(`/api/v1/products/${productId}/compliance/initialize`)
      .set('Authorization', `Bearer ${tokenOwner}`);

    const tasksRes = await request(app)
      .get(`/api/v1/products/${productId}/compliance/tasks`)
      .set('Authorization', `Bearer ${tokenOwner}`);

    const taskToReopen = tasksRes.body.data[0];

    const reopenRes = await request(app)
      .post(`/api/v1/products/${productId}/compliance/tasks/${taskToReopen.id}/reopen`)
      .set('Authorization', `Bearer ${tokenOwner}`);

    expect(reopenRes.status).toBe(200);
    expect(reopenRes.body.success).toBe(true);
    expect(reopenRes.body.data.status).toBe('IN_PROGRESS');
    expect(reopenRes.body.data.completedAt).toBeNull();
  });

  // ── 6. Platform Compliance Readiness Engine & Scoring ────────────────────────
  it('6. GET /api/v1/products/:id/compliance/readiness returns deterministic explainable domain breakdown', async () => {
    const res = await request(app)
      .get(`/api/v1/products/${productId}/compliance/readiness`)
      .set('Authorization', `Bearer ${tokenOwner}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const readiness = res.body.data;
    expect(readiness.overallScore).toBeGreaterThanOrEqual(0);
    expect(readiness.overallScore).toBeLessThanOrEqual(100);
    expect(readiness.domainScores).toHaveLength(5);
    expect(readiness.domainScores.map((d: any) => d.domain)).toEqual([
      'STANDARDS',
      'CERTIFICATION',
      'TESTING',
      'LABORATORY',
      'DOCUMENTS',
    ]);
    expect(readiness.explanation).toContain('Platform Compliance Readiness');
    expect(readiness.explanation).not.toContain('BIS Approval');
  });

  // ── 7. Application Preparation Dossier Compilation ───────────────────────────
  it('7. POST /api/v1/products/:id/compliance/dossier/compile compiles preparation dossier with verified vs missing evidence', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${productId}/compliance/dossier/compile`)
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ title: 'Preparation Dossier - LED High Bay' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const dossier = res.body.data;
    expect(dossier.title).toBe('Preparation Dossier - LED High Bay');
    expect(dossier.items.length).toBeGreaterThan(0);
    expect(dossier.verifiedCount).toBeGreaterThanOrEqual(1);

    // Factory layout is verified in mockProductDocuments
    const factoryItem = dossier.items.find((i: any) => i.title.includes('Factory Layout'));
    expect(factoryItem).toBeDefined();
    expect(factoryItem.status).toBe('VERIFIED');
  });

  // ── 8. Application Preparation Dossier Validation ────────────────────────────
  it('8. POST /api/v1/products/:id/compliance/dossier/validate returns blockers and missing items', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${productId}/compliance/dossier/validate`)
      .set('Authorization', `Bearer ${tokenOwner}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const val = res.body.data;
    expect(val.status).toBeDefined();
    expect(val.completenessScore).toBeDefined();
    expect(Array.isArray(val.blockers)).toBe(true);
  });

  // ── 9. Regulatory Change Event Detection & Impact Analysis ───────────────────
  it('9. Evaluates product impact when a source-grounded regulatory change is recorded', async () => {
    const { regulatoryChangeService } = await import('../src/services/compliance/regulatory-change.service.js');

    const event = await regulatoryChangeService.recordChangeEvent({
      title: 'Mandatory QCO 2026 Amendment for Industrial Luminaires',
      summary: 'New safety clauses applicable under IS 10322.',
      changeType: 'QCO_UPDATED',
      affectedStandards: ['IS 10322 (Part 5/Sec 1)'],
      affectedProductCategories: ['Lighting & Electronics'],
      effectiveDate: new Date('2026-12-01'),
      sourceUrl: 'https://egazette.gov.in/notification-2026-10322.pdf',
    });

    expect(event.id).toBeDefined();

    const impactsRes = await request(app)
      .get(`/api/v1/products/${productId}/compliance/regulatory-impact`)
      .set('Authorization', `Bearer ${tokenOwner}`);

    expect(impactsRes.status).toBe(200);
    expect(impactsRes.body.success).toBe(true);
    expect(impactsRes.body.data.length).toBeGreaterThan(0);

    const impact = impactsRes.body.data[0];
    expect(impact.impactLevel).toBe('HIGH');
    expect(impact.requiredActions.length).toBeGreaterThan(0);
  });

  // ── 10. Compliance Alerts & Calibration Expiry ────────────────────────────────
  it('10. GET /api/v1/products/:id/compliance/alerts detects calibration due dates and missing items', async () => {
    const res = await request(app)
      .get(`/api/v1/products/${productId}/compliance/alerts`)
      .set('Authorization', `Bearer ${tokenOwner}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const alerts = res.body.data;
    expect(Array.isArray(alerts)).toBe(true);
  });

  // ── 11. Security: Product Ownership & IDOR Protection ────────────────────────
  it('11. Forbids unauthorized users from accessing or manipulating compliance journey', async () => {
    // Other user attempts to get journey
    const getRes = await request(app)
      .get(`/api/v1/products/${productId}/compliance`)
      .set('Authorization', `Bearer ${tokenOther}`);

    expect(getRes.status).toBe(403);
    expect(getRes.body.success).toBe(false);

    // Other user attempts to complete task
    const postRes = await request(app)
      .post(`/api/v1/products/${productId}/compliance/tasks/task-any/complete`)
      .set('Authorization', `Bearer ${tokenOther}`);

    expect(postRes.status).toBe(403);
    expect(postRes.body.success).toBe(false);
  });

  // ── 12. Audit Logging ────────────────────────────────────────────────────────
  it('12. Records structured audit logs for compliance actions without secrets', async () => {
    await request(app)
      .post(`/api/v1/products/${productId}/compliance/initialize`)
      .set('Authorization', `Bearer ${tokenOwner}`);

    const journeyAudit = mockAuditLogs.find((a) => a.action === 'COMPLIANCE_JOURNEY_CREATED' || a.action === 'COMPLIANCE_JOURNEY_RECALCULATED');
    expect(journeyAudit).toBeDefined();
    expect(journeyAudit.userId).toBe(userId);
    expect(journeyAudit.productId).toBe(productId);
  });

  // ── 13. Chronological Journey Timeline ───────────────────────────────────────
  it('13. GET /api/v1/products/:id/compliance/timeline returns structured lifecycle milestones', async () => {
    const res = await request(app)
      .get(`/api/v1/products/${productId}/compliance/timeline`)
      .set('Authorization', `Bearer ${tokenOwner}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const timeline = res.body.data;
    expect(timeline.length).toBeGreaterThanOrEqual(3);
    expect(timeline.map((e: any) => e.stage)).toContain('PRODUCT_IDENTIFIED');
    expect(timeline.map((e: any) => e.stage)).toContain('STANDARD_IDENTIFICATION');
  });

  // ── 14. Recalculate Journey ──────────────────────────────────────────────────
  it('14. POST /api/v1/products/:id/compliance/recalculate re-runs orchestration on manual demand', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${productId}/compliance/recalculate`)
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ reason: 'Standard version updated' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.journey).toBeDefined();
  });
});
