process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.JWT_SECRET = 'test-jwt-secret-must-be-at-least-32-characters-long!';
process.env.TRANSLATION_PROVIDER = 'mock';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { TerminologyService } from '../src/services/i18n/terminology.service.js';

// ── In-Memory Database Store for i18n Tests ──────────────────────────────────
let mockUsers: any[] = [];
let mockUserPreferences: any[] = [];
let mockTranslationCache: any[] = [];
let mockStandards: any[] = [];

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
      userPreference: {
        findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
          return mockUserPreferences.find((p) => p.userId === where.userId) || null;
        }),
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          const newPref = {
            id: 'pref-uuid-' + Math.random().toString(36).substring(2, 9),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockUserPreferences.push(newPref);
          return newPref;
        }),
        upsert: vi.fn().mockImplementation(async ({ where, create, update }: any) => {
          const existingIndex = mockUserPreferences.findIndex((p) => p.userId === where.userId);
          if (existingIndex >= 0) {
            mockUserPreferences[existingIndex] = {
              ...mockUserPreferences[existingIndex],
              ...update,
              updatedAt: new Date(),
            };
            return mockUserPreferences[existingIndex];
          } else {
            const newPref = {
              id: 'pref-uuid-' + Math.random().toString(36).substring(2, 9),
              ...create,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            mockUserPreferences.push(newPref);
            return newPref;
          }
        }),
        deleteMany: vi.fn().mockImplementation(async () => {
          mockUserPreferences = [];
          return { count: 0 };
        }),
      },
      translationCache: {
        findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
          const compKey = where.sourceTextHash_targetLanguage;
          if (compKey) {
            return (
              mockTranslationCache.find(
                (c) =>
                  c.sourceTextHash === compKey.sourceTextHash &&
                  c.targetLanguage === compKey.targetLanguage
              ) || null
            );
          }
          return null;
        }),
        upsert: vi.fn().mockImplementation(async ({ where, create, update }: any) => {
          const compKey = where.sourceTextHash_targetLanguage;
          const existingIndex = mockTranslationCache.findIndex(
            (c) =>
              c.sourceTextHash === compKey.sourceTextHash &&
              c.targetLanguage === compKey.targetLanguage
          );
          if (existingIndex >= 0) {
            mockTranslationCache[existingIndex] = {
              ...mockTranslationCache[existingIndex],
              ...update,
              updatedAt: new Date(),
            };
            return mockTranslationCache[existingIndex];
          } else {
            const newEntry = {
              id: 'cache-uuid-' + Math.random().toString(36).substring(2, 9),
              ...create,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            mockTranslationCache.push(newEntry);
            return newEntry;
          }
        }),
        deleteMany: vi.fn().mockImplementation(async () => {
          mockTranslationCache = [];
          return { count: 0 };
        }),
      },
      standard: {
        findMany: vi.fn().mockImplementation(async ({ where, take }: any) => {
          let list = [...mockStandards];
          if (where?.OR) {
            const orConditions = where.OR;
            list = list.filter((s) => {
              return orConditions.some((cond: any) => {
                if (cond.isNumber && s.isNumber?.toLowerCase().includes(cond.isNumber.contains.toLowerCase())) return true;
                if (cond.canonicalNumber && s.canonicalNumber?.toLowerCase().includes(cond.canonicalNumber.contains.toLowerCase())) return true;
                if (cond.title && s.title?.toLowerCase().includes(cond.title.contains.toLowerCase())) return true;
                if (cond.scope && s.scope?.toLowerCase().includes(cond.scope.contains.toLowerCase())) return true;
                return false;
              });
            });
          }
          if (take) {
            list = list.slice(0, take);
          }
          return list;
        }),
      },
    },
  };
});

// Import app after mocks are in place
const { app } = await import('../src/app.js');

function generateAuthToken(payload: { id: string; email: string; name: string; role: string }) {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '1h',
    issuer: 'bis-intelligent-platform',
    audience: 'bis-users',
  });
}

describe('Phase 12 — Multilingual & Accessibility Intelligence API Test Suite', () => {
  let authToken: string;
  let testUserId: string;

  beforeEach(() => {
    mockUsers = [];
    mockUserPreferences = [];
    mockTranslationCache = [];
    mockStandards = [
      {
        id: 'std-1',
        isNumber: 'IS 10322 (Part 5/Sec 1):2014',
        canonicalNumber: 'IS 10322',
        title: 'Luminaires - Particular Requirements - Fixed General Purpose Luminaires',
        scope: 'Specifies safety requirements for luminaires and general lighting equipment.',
        status: 'CURRENT',
        isActive: true,
        publicationDate: new Date('2014-01-01'),
        sourceDocument: { url: 'https://www.standardsbis.in/IS10322' },
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
        isNumber: 'IS 4151:2020',
        canonicalNumber: 'IS 4151',
        title: 'Protective Helmets for Riders of Two Wheeled Motor Vehicles',
        scope: 'Covers protective helmets for riders against head injury during road accidents.',
        status: 'CURRENT',
        isActive: true,
        publicationDate: new Date('2020-01-01'),
        sourceDocument: { url: 'https://www.standardsbis.in/IS4151' },
        qcoMappings: [
          {
            qco: {
              id: 'qco-2',
              title: 'Helmets (Quality Control) Order',
              status: 'ACTIVE',
            },
          },
        ],
      },
    ];

    testUserId = 'user-uuid-12345';
    const testUser = {
      id: testUserId,
      email: 'consumer@example.com',
      name: 'Priya Sharma',
      role: 'USER',
      isActive: true,
    };
    mockUsers.push(testUser);

    authToken = generateAuthToken(testUser);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Language Catalog
  // ───────────────────────────────────────────────────────────────────────────
  it('1. GET /api/v1/i18n/languages returns supported languages (en, ta, hi)', async () => {
    const res = await request(app).get('/api/v1/i18n/languages');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.defaultLanguage).toBe('en');
    expect(res.body.data.languages).toBeInstanceOf(Array);
    expect(res.body.data.languages.length).toBeGreaterThanOrEqual(3);

    const codes = res.body.data.languages.map((l: any) => l.code);
    expect(codes).toContain('en');
    expect(codes).toContain('ta');
    expect(codes).toContain('hi');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Terminology Dictionary
  // ───────────────────────────────────────────────────────────────────────────
  it('2. GET /api/v1/i18n/terms returns all registered BIS terminology entries', async () => {
    const res = await request(app).get('/api/v1/i18n/terms');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.terms.length).toBeGreaterThanOrEqual(10);

    const keys = res.body.data.terms.map((t: any) => t.key);
    expect(keys).toContain('BIS');
    expect(keys).toContain('HUID');
    expect(keys).toContain('CML');
    expect(keys).toContain('QCO');
  });

  it('3. GET /api/v1/i18n/terms/:key returns single term and preserves canonical identifier', async () => {
    const res = await request(app).get('/api/v1/i18n/terms/HUID');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.term.key).toBe('HUID');
    expect(res.body.data.term.preserveCanonicalTerm).toBe(true);
    expect(res.body.data.term.ta).toContain('HUID');
    expect(res.body.data.term.hi).toContain('HUID');
  });

  it('4. GET /api/v1/i18n/terms/:key returns 404 for invalid key', async () => {
    const res = await request(app).get('/api/v1/i18n/terms/NON_EXISTENT_KEY_999');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Translation API & Term Preservation
  // ───────────────────────────────────────────────────────────────────────────
  it('5. POST /api/v1/i18n/translate translates to Tamil while preserving standard and licence numbers', async () => {
    const res = await request(app)
      .post('/api/v1/i18n/translate')
      .send({
        text: 'What this standard means for IS 10322 with licence CM/L-1234567 under QCO',
        targetLanguage: 'ta',
        sourceReference: 'IS 10322:2014 Clause 1',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.targetLanguage).toBe('ta');
    expect(res.body.data.translatedText).toBeTruthy();
    // Must preserve technical numbers
    expect(res.body.data.translatedText).toContain('IS 10322');
    expect(res.body.data.translatedText).toContain('CM/L-1234567');
    expect(res.body.data.preservedTerms).toContain('IS 10322');
    expect(res.body.data.preservedTerms).toContain('CM/L-1234567');
    expect(res.body.data.disclaimer).toContain('Platform-generated translation');
  });

  it('6. POST /api/v1/i18n/translate caches translation and marks subsequent request as cached', async () => {
    const payload = {
      text: 'Safety requirements for luminaires and general lighting equipment',
      targetLanguage: 'hi',
    };

    // First call (uncached)
    const res1 = await request(app).post('/api/v1/i18n/translate').send(payload);
    expect(res1.status).toBe(200);
    expect(res1.body.data.cached).toBe(false);

    // Second call (cached)
    const res2 = await request(app).post('/api/v1/i18n/translate').send(payload);
    expect(res2.status).toBe(200);
    expect(res2.body.data.cached).toBe(true);
    expect(res2.body.data.translatedText).toBe(res1.body.data.translatedText);
  });

  it('7. POST /api/v1/i18n/translate returns 400 for unsupported target language', async () => {
    const res = await request(app)
      .post('/api/v1/i18n/translate')
      .send({
        text: 'Hello World',
        targetLanguage: 'fr',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. User Preferences API
  // ───────────────────────────────────────────────────────────────────────────
  it('8. GET /api/v1/i18n/preferences requires authentication', async () => {
    const res = await request(app).get('/api/v1/i18n/preferences');
    expect(res.status).toBe(401);
  });

  it('9. GET /api/v1/i18n/preferences returns default preferences for authenticated user', async () => {
    const res = await request(app)
      .get('/api/v1/i18n/preferences')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.preference.language).toBe('en');
    expect(res.body.data.preference.reducedMotion).toBe(false);
  });

  it('10. PUT /api/v1/i18n/preferences updates user language and accessibility settings', async () => {
    const res = await request(app)
      .put('/api/v1/i18n/preferences')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        language: 'ta',
        theme: 'dark',
        reducedMotion: true,
        highContrast: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.preference.language).toBe('ta');
    expect(res.body.data.preference.theme).toBe('dark');
    expect(res.body.data.preference.reducedMotion).toBe(true);
    expect(res.body.data.preference.highContrast).toBe(true);

    // Verify persistence
    const check = await request(app)
      .get('/api/v1/i18n/preferences')
      .set('Authorization', `Bearer ${authToken}`);
    expect(check.body.data.preference.language).toBe('ta');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Multilingual Consumer Standards Search & Explanations
  // ───────────────────────────────────────────────────────────────────────────
  it('11. GET /api/v1/consumer/standards/search with language=ta returns Tamil explanation', async () => {
    const res = await request(app)
      .get('/api/v1/consumer/standards/search?q=Luminaires&language=ta');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.results.length).toBeGreaterThanOrEqual(1);

    const firstResult = res.body.data.results[0];
    expect(firstResult.consumerExplanation.whatThisMeans).toContain('இந்திய தரநிலை');
    expect(firstResult.consumerExplanation.whatThisMeans).toContain('IS 10322');
    expect(firstResult.consumerExplanation.officialSource).toContain('இந்திய தர நிர்ணய பணியகம் (BIS)');
  });

  it('12. GET /api/v1/consumer/standards/search with language=hi returns Hindi explanation', async () => {
    const res = await request(app)
      .get('/api/v1/consumer/standards/search?q=Luminaires&language=hi');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.results.length).toBeGreaterThanOrEqual(1);

    const firstResult = res.body.data.results[0];
    expect(firstResult.consumerExplanation.whatThisMeans).toContain('भारतीय मानक');
    expect(firstResult.consumerExplanation.officialSource).toContain('भारतीय मानक ब्यूरो (BIS)');
  });

  it('13. Multilingual query expansion: Tamil search for "தலைக்கவசம்" retrieves IS 4151', async () => {
    const res = await request(app)
      .get('/api/v1/consumer/standards/search')
      .query({ q: 'தலைக்கவசம்', language: 'ta' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.results.length).toBeGreaterThanOrEqual(1);

    const foundIsNumbers = res.body.data.results.map((r: any) => r.standardNumber);
    expect(foundIsNumbers.some((num: string) => num.includes('IS 4151'))).toBe(true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Terminology Extraction Logic
  // ───────────────────────────────────────────────────────────────────────────
  it('14. TerminologyService.extractPreservedTerms correctly detects standards, CM/L, and HUID', () => {
    const sampleText =
      'Verify IS 10322 (Part 5/Sec 1) under QCO with CM/L-7654321 and gold hallmark AZ1234 from AHC';
    const extracted = TerminologyService.extractPreservedTerms(sampleText);

    expect(extracted).toContain('IS 10322 (Part 5/Sec 1)');
    expect(extracted).toContain('CM/L-7654321');
    expect(extracted).toContain('AZ1234');
    expect(extracted).toContain('QCO');
    expect(extracted).toContain('AHC');
  });
});
