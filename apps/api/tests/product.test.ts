import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';

// ── Mock Environment ──────────────────────────────────────────────────────────
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test_db');
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('LOG_LEVEL', 'error');
vi.stubEnv('FRONTEND_URL', 'http://localhost:5173');
vi.stubEnv('JWT_SECRET', 'test-jwt-secret-must-be-at-least-32-characters-long!');

// ── In-Memory Database Store for Testing ─────────────────────────────────────
interface StoredProduct {
  id: string;
  userId: string;
  name: string;
  category: string;
  description: string | null;
  manufacturerType: string | null;
  intendedUse: string | null;
  targetMarket: string | null;
  countryOfManufacture: string | null;
  status: 'DRAFT' | 'INFORMATION_COLLECTION' | 'READY_FOR_ANALYSIS' | 'ACTIVE' | 'ARCHIVED';
  workflowStage: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date | null;
}

let mockProducts: StoredProduct[] = [];

vi.mock('../src/db/client.js', () => {
  return {
    checkDatabaseHealth: vi.fn().mockResolvedValue({ connected: true, latencyMs: 1 }),
    disconnectDatabase: vi.fn().mockResolvedValue(undefined),
    prisma: {
      product: {
        create: vi.fn().mockImplementation(async ({ data }: { data: any }) => {
          const newProduct: StoredProduct = {
            id: `prod-uuid-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            userId: data.userId,
            name: data.name,
            category: data.category,
            description: data.description || null,
            manufacturerType: data.manufacturerType || null,
            intendedUse: data.intendedUse || null,
            targetMarket: data.targetMarket || null,
            countryOfManufacture: data.countryOfManufacture || null,
            status: data.status || 'DRAFT',
            workflowStage: data.workflowStage || 'DRAFT',
            isActive: data.isActive !== undefined ? data.isActive : true,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastActivityAt: data.lastActivityAt || new Date(),
          };
          mockProducts.push(newProduct);
          return newProduct;
        }),
        findMany: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          return mockProducts.filter((p) => {
            if (p.userId !== where.userId) return false;
            if (where.isActive !== undefined && p.isActive !== where.isActive) return false;
            if (where.status?.not && p.status === where.status.not) return false;
            return true;
          });
        }),
        findFirst: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          return (
            mockProducts.find((p) => {
              if (where.id && p.id !== where.id) return false;
              if (where.userId && p.userId !== where.userId) return false;
              if (where.isActive !== undefined && p.isActive !== where.isActive) return false;
              return true;
            }) || null
          );
        }),
        update: vi.fn().mockImplementation(async ({ where, data }: { where: { id: string }; data: any }) => {
          const product = mockProducts.find((p) => p.id === where.id);
          if (product) {
            Object.assign(product, data, { updatedAt: new Date() });
            return product;
          }
          throw new Error('Product not found');
        }),
        count: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          return mockProducts.filter((p) => {
            if (p.userId !== where.userId) return false;
            if (where.isActive !== undefined && p.isActive !== where.isActive) return false;
            if (where.status?.not && p.status === where.status.not) return false;
            if (where.status && typeof where.status === 'string' && p.status !== where.status) return false;
            return true;
          }).length;
        }),
      },
    },
  };
});

describe('Phase 3 — Product API & Security (IDOR) Tests', () => {
  let app: any;

  // Test Users
  const userA = {
    id: 'user-aaaa-1111-2222-3333-444444444444',
    email: 'userA@enterprise.in',
    role: 'USER',
    name: 'User A',
  };

  const userB = {
    id: 'user-bbbb-1111-2222-3333-444444444444',
    email: 'userB@enterprise.in',
    role: 'USER',
    name: 'User B',
  };

  let tokenUserA: string;
  let tokenUserB: string;

  beforeAll(async () => {
    const sessionModule = await import('../src/services/session.service.js');
    const appModule = await import('../src/app.js');
    app = appModule.app;
    tokenUserA = sessionModule.createAuthToken(userA);
    tokenUserB = sessionModule.createAuthToken(userB);
  });

  beforeEach(() => {
    // Reset database with sample products for both users
    mockProducts = [
      {
        id: 'prod-a-001',
        userId: userA.id,
        name: 'Industrial Water Pump (Type A)',
        category: 'Industrial Equipment',
        description: 'Heavy duty centrifugal water pump',
        manufacturerType: 'Domestic Large Enterprise',
        intendedUse: 'Industrial water circulation',
        targetMarket: 'Domestic Market (India Only)',
        countryOfManufacture: 'India',
        status: 'DRAFT',
        workflowStage: 'DRAFT',
        isActive: true,
        createdAt: new Date('2026-09-01'),
        updatedAt: new Date('2026-09-01'),
        lastActivityAt: new Date('2026-09-01'),
      },
      {
        id: 'prod-b-001',
        userId: userB.id,
        name: 'LED Street Lighting Fixture',
        category: 'Electrical Equipment & Luminaires',
        description: 'High power street light luminaire',
        manufacturerType: 'Domestic MSME',
        intendedUse: 'Municipal outdoor roadway lighting',
        targetMarket: 'Government e-Marketplace (GeM)',
        countryOfManufacture: 'India',
        status: 'ACTIVE',
        workflowStage: 'INFORMATION_COLLECTION',
        isActive: true,
        createdAt: new Date('2026-09-02'),
        updatedAt: new Date('2026-09-02'),
        lastActivityAt: new Date('2026-09-02'),
      },
    ];
  });

  // ── 1. Create Product ───────────────────────────────────────────────────────
  describe('POST /api/v1/products', () => {
    it('allows an authenticated user to create a product (201)', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          name: 'Commercial Solar Inverter',
          category: 'Electronics & IT Goods',
          description: 'Grid-tied 3-phase solar inverter 50kW',
          manufacturerType: 'Domestic Large Enterprise',
          intendedUse: 'Rooftop solar power conversion',
          targetMarket: 'Domestic Market (India Only)',
          countryOfManufacture: 'India',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.id).toBeDefined();
      expect(response.body.data.product.name).toBe('Commercial Solar Inverter');
      expect(response.body.data.product.category).toBe('Electronics & IT Goods');
      expect(response.body.data.product.userId).toBe(userA.id);
      expect(response.body.data.product.status).toBe('DRAFT');
    });

    it('rejects unauthenticated requests with 401', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .send({
          name: 'Unauthenticated Product',
          category: 'Electronics',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects invalid product payload missing required name or category (400)', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          description: 'Missing name and category',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ── 2. List Products ────────────────────────────────────────────────────────
  describe('GET /api/v1/products', () => {
    it('returns only products owned by User A', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const products = response.body.data.products;
      expect(products.length).toBe(1);
      expect(products[0].id).toBe('prod-a-001');
      expect(products[0].userId).toBe(userA.id);
    });

    it('returns only products owned by User B', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${tokenUserB}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const products = response.body.data.products;
      expect(products.length).toBe(1);
      expect(products[0].id).toBe('prod-b-001');
      expect(products[0].userId).toBe(userB.id);
    });
  });

  // ── 3. Get Product By ID & IDOR Protection ──────────────────────────────────
  describe('GET /api/v1/products/:id', () => {
    it('allows User A to get their own product (200)', async () => {
      const response = await request(app)
        .get('/api/v1/products/prod-a-001')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.id).toBe('prod-a-001');
      expect(response.body.data.product.name).toBe('Industrial Water Pump (Type A)');
    });

    it('IDOR SECURITY: Prevents User A from reading User B product (404)', async () => {
      const response = await request(app)
        .get('/api/v1/products/prod-b-001')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  // ── 4. Update Product & IDOR Protection ─────────────────────────────────────
  describe('PATCH /api/v1/products/:id', () => {
    it('allows User A to update their own product (200)', async () => {
      const response = await request(app)
        .patch('/api/v1/products/prod-a-001')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          name: 'Updated Industrial Water Pump (Type A+)',
          status: 'INFORMATION_COLLECTION',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe('Updated Industrial Water Pump (Type A+)');
      expect(response.body.data.product.status).toBe('INFORMATION_COLLECTION');
    });

    it('IDOR SECURITY: Prevents User A from updating User B product (404)', async () => {
      const response = await request(app)
        .patch('/api/v1/products/prod-b-001')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          name: 'Hacked Product Name by User A',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  // ── 5. Archive Product & IDOR Protection ────────────────────────────────────
  describe('DELETE /api/v1/products/:id', () => {
    it('allows User A to archive their own product (200)', async () => {
      const response = await request(app)
        .delete('/api/v1/products/prod-a-001')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.status).toBe('ARCHIVED');

      // Subsequent default list should not include archived product
      const listRes = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200);

      expect(listRes.body.data.products.length).toBe(0);
    });

    it('IDOR SECURITY: Prevents User A from archiving User B product (404)', async () => {
      const response = await request(app)
        .delete('/api/v1/products/prod-b-001')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  // ── 6. Product Statistics ───────────────────────────────────────────────────
  describe('GET /api/v1/products/stats', () => {
    it('returns accurate product statistics for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/products/stats')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.total).toBe(1);
      expect(response.body.data.stats.draft).toBe(1);
    });
  });
});
