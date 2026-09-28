import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';

// ── Mock Environment ──────────────────────────────────────────────────────────
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test_db');
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('LOG_LEVEL', 'error');
vi.stubEnv('FRONTEND_URL', 'http://localhost:5173');
vi.stubEnv('JWT_SECRET', 'test-jwt-secret-must-be-at-least-32-characters-long!');

// ── In-Memory Database Stores ────────────────────────────────────────────────
let mockProducts: any[] = [];
let mockConversations: any[] = [];
let mockMessages: any[] = [];
let mockAuditLogs: any[] = [];

vi.mock('../src/db/client.js', () => {
  return {
    checkDatabaseHealth: vi.fn().mockResolvedValue({ connected: true, latencyMs: 1 }),
    disconnectDatabase: vi.fn().mockResolvedValue(undefined),
    prisma: {
      product: {
        findMany: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          return mockProducts.filter((p) => {
            if (where.userId && p.userId !== where.userId) return false;
            if (where.isActive !== undefined && p.isActive !== where.isActive) return false;
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
      },
      standard: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'std-2082',
            isNumber: 'IS 2082',
            canonicalNumber: 'IS 2082 : 2018',
            title: 'Stationary Storage Type Electric Water Heaters — Specification',
            scope: 'Specifies safety, performance, and testing requirements for electric storage water heaters.',
            status: 'CURRENT',
            sector: 'Electrical Appliances',
            department: 'Electrotechnical',
            createdAt: new Date(),
            updatedAt: new Date(),
            sourceDocument: {
              id: 'src-1',
              title: 'Bureau of Indian Standards',
              url: 'https://www.services.bis.gov.in',
              sourceType: 'BIS_OFFICIAL',
              authorityLevel: 'AUTHORITATIVE',
              status: 'VERIFIED',
              retrievedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        ]),
        findFirst: vi.fn().mockResolvedValue(null),
      },
      aiConversation: {
        findMany: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          return mockConversations
            .filter((c) => {
              if (where.productId && c.productId !== where.productId) return false;
              if (where.userId && c.userId !== where.userId) return false;
              return true;
            })
            .map((c) => ({
              ...c,
              messages: mockMessages
                .filter((m) => m.conversationId === c.id)
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .slice(0, 1),
            }));
        }),
        findFirst: vi.fn().mockImplementation(async ({ where, include }: { where: any; include?: any }) => {
          const conv = mockConversations.find((c) => {
            if (where.id && c.id !== where.id) return false;
            if (where.productId && c.productId !== where.productId) return false;
            if (where.userId && c.userId !== where.userId) return false;
            return true;
          });
          if (!conv) return null;

          const res: any = { ...conv };
          if (include?.product) {
            res.product = mockProducts.find((p) => p.id === conv.productId) || null;
          }
          if (include?.messages) {
            res.messages = mockMessages
              .filter((m) => m.conversationId === conv.id)
              .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
          }
          return res;
        }),
        create: vi.fn().mockImplementation(async ({ data }: { data: any }) => {
          const newConv = {
            id: `conv-uuid-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            productId: data.productId,
            userId: data.userId,
            title: data.title,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockConversations.push(newConv);
          return newConv;
        }),
        update: vi.fn().mockImplementation(async ({ where, data }: { where: any; data: any }) => {
          const conv = mockConversations.find((c) => c.id === where.id);
          if (conv) {
            Object.assign(conv, data, { updatedAt: new Date() });
            return conv;
          }
          throw new Error('Conversation not found');
        }),
      },
      aiMessage: {
        create: vi.fn().mockImplementation(async ({ data }: { data: any }) => {
          const newMsg = {
            id: `msg-uuid-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            conversationId: data.conversationId,
            role: data.role,
            content: data.content,
            metadata: data.metadata || null,
            createdAt: new Date(),
          };
          mockMessages.push(newMsg);
          return newMsg;
        }),
      },
      auditLog: {
        create: vi.fn().mockImplementation(async ({ data }: { data: any }) => {
          const log = {
            id: `log-uuid-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            userId: data.userId || null,
            productId: data.productId || null,
            action: data.action,
            entityType: data.entityType || null,
            entityId: data.entityId || null,
            metadata: data.metadata || null,
            ipAddress: data.ipAddress || null,
            userAgent: data.userAgent || null,
            createdAt: new Date(),
          };
          mockAuditLogs.push(log);
          return log;
        }),
        count: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          return mockAuditLogs.filter((l) => {
            if (where.productId && l.productId !== where.productId) return false;
            if (where.OR) {
              const matchesOr = where.OR.some((cond: any) => {
                if (cond.userId && l.userId === cond.userId) return true;
                if (cond.productId?.in && cond.productId.in.includes(l.productId)) return true;
                return false;
              });
              if (!matchesOr) return false;
            }
            return true;
          }).length;
        }),
        findMany: vi.fn().mockImplementation(async ({ where, skip = 0, take = 50 }: { where: any; skip?: number; take?: number }) => {
          const filtered = mockAuditLogs.filter((l) => {
            if (where.productId && l.productId !== where.productId) return false;
            if (where.OR) {
              const matchesOr = where.OR.some((cond: any) => {
                if (cond.userId && l.userId === cond.userId) return true;
                if (cond.productId?.in && cond.productId.in.includes(l.productId)) return true;
                return false;
              });
              if (!matchesOr) return false;
            }
            return true;
          });

          return filtered
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(skip, skip + take)
            .map((l) => ({
              ...l,
              product: mockProducts.find((p) => p.id === l.productId) || null,
            }));
        }),
      },
    },
  };
});

describe('Phase 16 — AI Assistant & User Activity API Tests', () => {
  let app: any;

  const userA = {
    id: 'user-aaaa-1111-2222-3333-444444444444',
    email: 'usera@compliance.in',
    role: 'USER',
    name: 'User A',
  };

  const userB = {
    id: 'user-bbbb-1111-2222-3333-444444444444',
    email: 'userb@compliance.in',
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
    mockProducts = [
      {
        id: 'prod-a1',
        userId: userA.id,
        name: 'Electric Water Heater (Storage Type)',
        category: 'Electrical Appliances',
        intendedUse: 'Domestic hot water storage',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'prod-b1',
        userId: userB.id,
        name: 'Industrial Valve (High Pressure)',
        category: 'Mechanical Equipment',
        intendedUse: 'Industrial steam handling',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockConversations = [
      {
        id: 'conv-a1',
        productId: 'prod-a1',
        userId: userA.id,
        title: 'Heater IS 2082 Consultation',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockMessages = [
      {
        id: 'msg-a1',
        conversationId: 'conv-a1',
        role: 'USER',
        content: 'Which standard applies to electric storage water heaters?',
        createdAt: new Date(Date.now() - 60000),
      },
      {
        id: 'msg-a2',
        conversationId: 'conv-a1',
        role: 'ASSISTANT',
        content: 'IS 2082 applies to stationary storage electric water heaters.',
        metadata: {
          grounded: true,
          citations: [
            {
              citationIndex: 1,
              isNumber: 'IS 2082',
              sourceTitle: 'Bureau of Indian Standards',
              sourceUrl: 'https://www.services.bis.gov.in',
              authorityLevel: 'AUTHORITATIVE',
            },
          ],
        },
        createdAt: new Date(),
      },
    ];

    mockAuditLogs = [
      {
        id: 'audit-a1',
        userId: userA.id,
        productId: 'prod-a1',
        action: 'PRODUCT_CREATED',
        entityType: 'PRODUCT',
        entityId: 'prod-a1',
        metadata: { name: 'Electric Water Heater' },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        id: 'audit-a2',
        userId: userA.id,
        productId: 'prod-a1',
        action: 'DOCUMENT_UPLOADED',
        entityType: 'DOCUMENT',
        entityId: 'doc-1',
        metadata: { fileName: 'datasheet.pdf' },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: new Date(Date.now() - 1800000),
      },
      {
        id: 'audit-b1',
        userId: userB.id,
        productId: 'prod-b1',
        action: 'PRODUCT_CREATED',
        entityType: 'PRODUCT',
        entityId: 'prod-b1',
        metadata: { name: 'Industrial Valve' },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: new Date(),
      },
    ];
  });

  describe('1. AI Assistant Conversations Lifecycle', () => {
    it('should list all assistant conversations for an owned product', async () => {
      const res = await request(app)
        .get('/api/v1/products/prod-a1/assistant/conversations')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe('conv-a1');
      expect(res.body.data[0].title).toBe('Heater IS 2082 Consultation');
      expect(res.body.data[0].lastMessage).toBeDefined();
    });

    it('should prevent User B from listing conversations of User A product (IDOR prevention)', async () => {
      const res = await request(app)
        .get('/api/v1/products/prod-a1/assistant/conversations')
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should create a new conversation for an owned product', async () => {
      const res = await request(app)
        .post('/api/v1/products/prod-a1/assistant/conversations')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ title: 'Safety Testing Query' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Safety Testing Query');
      expect(res.body.data.productId).toBe('prod-a1');
      expect(mockConversations.length).toBe(2);
    });

    it('should get conversation details with message history', async () => {
      const res = await request(app)
        .get('/api/v1/products/prod-a1/assistant/conversations/conv-a1')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('conv-a1');
      expect(res.body.data.messages.length).toBe(2);
      expect(res.body.data.messages[0].role).toBe('USER');
      expect(res.body.data.messages[1].role).toBe('ASSISTANT');
    });
  });

  describe('2. Assistant Query & Grounded Response', () => {
    it('should send user message, retrieve RAG context, and return grounded response with citations', async () => {
      const res = await request(app)
        .post('/api/v1/products/prod-a1/assistant/conversations/conv-a1/messages')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ content: 'What are the mandatory testing clauses for water heaters under IS 2082?' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.conversationId).toBe('conv-a1');
      expect(res.body.data.message).toBeDefined();
      expect(res.body.data.message.role).toBe('ASSISTANT');
      expect(res.body.data.message.content).toContain('Electric Water Heater');
      expect(typeof res.body.data.grounded).toBe('boolean');
      expect(Array.isArray(res.body.data.citations)).toBe(true);
    });

    it('should reject empty message content', async () => {
      const res = await request(app)
        .post('/api/v1/products/prod-a1/assistant/conversations/conv-a1/messages')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ content: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should prevent sending messages to a conversation belonging to another user', async () => {
      const res = await request(app)
        .post('/api/v1/products/prod-a1/assistant/conversations/conv-a1/messages')
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({ content: 'Hello' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. User Activity Feed & Isolation', () => {
    it('should return paginated activity feed for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/activity')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.activities)).toBe(true);
      // User A should only see their own activities (audit-a1, audit-a2 + any new logged events)
      const userBLog = res.body.data.activities.find((a: any) => a.id === 'audit-b1');
      expect(userBLog).toBeUndefined();
    });

    it('should return activity feed scoped to a specific product', async () => {
      const res = await request(app)
        .get('/api/v1/products/prod-a1/activity')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.activities.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.activities.every((a: any) => a.productId === 'prod-a1')).toBe(true);
    });

    it('should block User B from viewing product activity of User A', async () => {
      const res = await request(app)
        .get('/api/v1/products/prod-a1/activity')
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should filter activity feed by category', async () => {
      const res = await request(app)
        .get('/api/v1/activity?category=DOCUMENT')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.activities.every((a: any) => a.category === 'DOCUMENT')).toBe(true);
    });
  });
});
