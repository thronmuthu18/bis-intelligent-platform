import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// ── Mock Environment ──────────────────────────────────────────────────────────
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test_db');
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('LOG_LEVEL', 'error');
vi.stubEnv('FRONTEND_URL', 'http://localhost:5173');
vi.stubEnv('JWT_SECRET', 'test-jwt-secret-must-be-at-least-32-characters-long!');

// ── In-Memory Database Store for Testing ─────────────────────────────────────
interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  organizationName: string | null;
  role: 'USER' | 'ADMIN' | 'DATA_MANAGER';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

let mockUsers: StoredUser[] = [];

vi.mock('../src/db/client.js', () => {
  return {
    checkDatabaseHealth: vi.fn().mockResolvedValue({ connected: true, latencyMs: 1 }),
    disconnectDatabase: vi.fn().mockResolvedValue(undefined),
    prisma: {
      user: {
        findUnique: vi.fn().mockImplementation(async ({ where }: { where: { email?: string; id?: string } }) => {
          if (where.email) {
            return mockUsers.find((u) => u.email === where.email) || null;
          }
          if (where.id) {
            return mockUsers.find((u) => u.id === where.id) || null;
          }
          return null;
        }),
        create: vi.fn().mockImplementation(async ({ data }: { data: any }) => {
          const newUser: StoredUser = {
            id: '11111111-2222-3333-4444-555555555555',
            name: data.name,
            email: data.email,
            passwordHash: data.passwordHash,
            organizationName: data.organizationName || null,
            role: data.role || 'USER',
            isActive: data.isActive !== undefined ? data.isActive : true,
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLoginAt: data.lastLoginAt || new Date(),
          };
          mockUsers.push(newUser);
          return newUser;
        }),
        update: vi.fn().mockImplementation(async ({ where, data }: { where: { id: string }; data: any }) => {
          const user = mockUsers.find((u) => u.id === where.id);
          if (user) {
            Object.assign(user, data, { updatedAt: new Date() });
            return user;
          }
          throw new Error('User not found');
        }),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
      },
    },
  };
});

describe('Phase 2 — Authentication API Tests', () => {
  let app: any;

  beforeAll(async () => {
    const module = await import('../src/app.js');
    app = module.app;
  });

  beforeEach(async () => {
    // Reset mock database before each test
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('CorrectPassword123', salt);

    mockUsers = [
      {
        id: '99999999-8888-7777-6666-555555555555',
        name: 'Existing Test User',
        email: 'existing@example.com',
        passwordHash,
        organizationName: 'Test Corp',
        role: 'USER',
        isActive: true,
        emailVerified: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        lastLoginAt: null,
      },
    ];
  });

  // ── Registration Tests ──────────────────────────────────────────────────────
  describe('POST /api/v1/auth/register', () => {
    it('registers a new user successfully and returns 201 with cookie and user profile', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'Jane.Doe@Enterprise.IN',
          password: 'SuperSecurePassword123',
          organizationName: 'Bharat Electronics Ltd',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBeDefined();
      expect(response.body.data.user.name).toBe('Jane Doe');
      expect(response.body.data.user.email).toBe('jane.doe@enterprise.in'); // normalized
      expect(response.body.data.user.role).toBe('USER');
      expect(response.body.data.user.organizationName).toBe('Bharat Electronics Ltd');
      expect(response.body.data.user.passwordHash).toBeUndefined(); // NEVER returned
      expect(response.body.data.user.password).toBeUndefined();

      // Verify Set-Cookie header contains HttpOnly bis_auth_token
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const authCookie = cookies.find((c: string) => c.includes('bis_auth_token'));
      expect(authCookie).toBeDefined();
      expect(authCookie).toContain('HttpOnly');
    });

    it('rejects registration with duplicate email (409 EMAIL_ALREADY_EXISTS)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Duplicate Guy',
          email: 'EXISTING@example.com', // casing variation
          password: 'Password12345',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
      expect(response.body.error.message).toContain('already exists');
    });

    it('rejects invalid email with 400 VALIDATION_ERROR', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Invalid Email',
          email: 'not-an-email',
          password: 'Password12345',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects password shorter than 8 characters with 400 VALIDATION_ERROR', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Short Password',
          email: 'valid@example.com',
          password: 'short',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects password without a number with 400 VALIDATION_ERROR', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'No Number',
          email: 'nonum@example.com',
          password: 'LettersOnlyPass',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects password without a letter with 400 VALIDATION_ERROR', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'No Letter',
          email: 'noletter@example.com',
          password: '12345678',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects password exceeding 128 characters with 400 VALIDATION_ERROR', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Long Password',
          email: 'longpass@example.com',
          password: 'A1' + 'x'.repeat(128), // 130 chars
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ── Login Tests ─────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/login', () => {
    it('authenticates valid credentials with 200 and sets HttpOnly cookie', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'EXISTING@Example.COM', // casing normalization check
          password: 'CorrectPassword123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe('99999999-8888-7777-6666-555555555555');
      expect(response.body.data.user.email).toBe('existing@example.com');
      expect(response.body.data.user.passwordHash).toBeUndefined();

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const authCookie = cookies.find((c: string) => c.includes('bis_auth_token'));
      expect(authCookie).toBeDefined();
      expect(authCookie).toContain('HttpOnly');
    });

    it('returns generic 401 INVALID_CREDENTIALS for wrong password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'existing@example.com',
          password: 'WrongPassword999',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(response.body.error.message).toBe('Invalid email or password.');
    });

    it('returns identical generic 401 INVALID_CREDENTIALS for unknown email (no enumeration leak)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'AnyPassword123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(response.body.error.message).toBe('Invalid email or password.');
    });
  });

  // ── Session (/me) Tests ─────────────────────────────────────────────────────
  describe('GET /api/v1/auth/me', () => {
    it('returns 401 Unauthorized when unauthenticated', async () => {
      const response = await request(app).get('/api/v1/auth/me').expect(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns user profile when authenticated with cookie', async () => {
      // 1. Login first to get cookie
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'existing@example.com',
          password: 'CorrectPassword123',
        })
        .expect(200);

      const cookieHeader = loginRes.headers['set-cookie'];

      // 2. Fetch /me using cookie
      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', cookieHeader)
        .expect(200);

      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.user.id).toBe('99999999-8888-7777-6666-555555555555');
      expect(meRes.body.data.user.name).toBe('Existing Test User');
      expect(meRes.body.data.user.email).toBe('existing@example.com');
      expect(meRes.body.data.user.passwordHash).toBeUndefined();
    });
  });

  // ── Logout Tests ────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/logout', () => {
    it('clears the authentication cookie on logout', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const authCookie = cookies.find((c: string) => c.includes('bis_auth_token'));
      expect(authCookie).toBeDefined();
      // Should have Max-Age=0 or expires in past
      expect(authCookie).toMatch(/Max-Age=0|expires=/i);
    });

    it('creates a USER_LOGOUT audit log when an authenticated user logs out', async () => {
      const dbClient = await import('../src/db/client.js');
      // Login first to get cookie
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'existing@example.com', password: 'CorrectPassword123' })
        .expect(200);

      const cookieHeader = loginRes.headers['set-cookie'];

      // Logout with cookie
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', cookieHeader)
        .expect(200);

      expect(dbClient.prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'USER_LOGOUT',
            userId: '99999999-8888-7777-6666-555555555555',
          }),
        })
      );
    });
  });
});
