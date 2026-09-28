import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

// Mock environment before imports
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test_db');
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('LOG_LEVEL', 'error');
vi.stubEnv('FRONTEND_URL', 'http://localhost:5173');

// Mock Prisma client to avoid real database calls in tests
vi.mock('../src/db/client.js', () => ({
  checkDatabaseHealth: vi.fn().mockResolvedValue({ connected: true, latencyMs: 1 }),
  disconnectDatabase: vi.fn().mockResolvedValue(undefined),
  prisma: {},
}));

describe('GET /api/v1/health', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let app: any;

  beforeAll(async () => {
    const module = await import('../src/app.js');
    app = module.app;
  });

  afterAll(async () => {
    vi.restoreAllMocks();
  });

  it('should return 200 with success true and status healthy', async () => {
    const response = await request(app).get('/api/v1/health').expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('healthy');
    expect(response.body.data.service).toBe('bis-intelligent-platform-api');
    expect(response.body.data.database.connected).toBe(true);
  });

  it('should return a timestamp in the response', async () => {
    const response = await request(app).get('/api/v1/health').expect(200);
    expect(response.body.data.timestamp).toBeDefined();
    expect(new Date(response.body.data.timestamp).getTime()).toBeGreaterThan(0);
  });

  it('should return 200 for liveness probe (/api/v1/health/live)', async () => {
    const response = await request(app).get('/api/v1/health/live').expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('healthy');
    expect(response.body.data.check).toBe('liveness');
  });

  it('should return 200 for readiness probe (/api/v1/health/ready) when database is connected', async () => {
    const response = await request(app).get('/api/v1/health/ready').expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ready');
    expect(response.body.data.check).toBe('readiness');
    expect(response.body.data.database.status).toBe('connected');
  });

  it('should return 503 for readiness probe when database is disconnected', async () => {
    const dbClient = await import('../src/db/client.js');
    vi.mocked(dbClient.checkDatabaseHealth).mockResolvedValueOnce({
      connected: false,
      error: 'Connection terminated',
    });

    const response = await request(app).get('/api/v1/health/ready').expect(503);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('DATABASE_UNAVAILABLE');
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/api/v1/unknown-route').expect(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
