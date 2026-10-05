import 'dotenv/config';
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
//  Known insecure default development secrets
// ─────────────────────────────────────────────────────────────────────────────
export const INSECURE_DEV_JWT_SECRETS = [
  'bis_platform_dev_jwt_secret_key_minimum_64_characters_security_token_sih26107_secure',
  'bis-platform-super-secret-jwt-key-2024-development-mode-min32chars',
];

// ─────────────────────────────────────────────────────────────────────────────
//  Environment Schema
//  Required variables will throw at startup if missing.
//  Optional phase-future variables default gracefully in dev/test.
// ─────────────────────────────────────────────────────────────────────────────

export const envSchema = z
  .object({
    // Application
    NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),

    // Database — required for any real functionality
    DATABASE_URL: z
      .string()
      .url({ message: 'DATABASE_URL must be a valid PostgreSQL connection string' })
      .default(process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/bis_compliance?schema=public'),

    // CORS & URLs
    FRONTEND_URL: z.string().url().default('http://localhost:5173'),
    API_BASE_URL: z.string().url().default('http://localhost:5000/api/v1'),

    // Auth
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').optional(),
    JWT_ACCESS_EXPIRY: z.string().default('15m'),
    JWT_REFRESH_EXPIRY: z.string().default('7d'),

    // AI & Embedding Provider
    AI_PROVIDER: z.string().default('mock'),
    AI_API_KEY: z.string().optional(),
    AI_MODEL: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),
    EMBEDDING_PROVIDER: z.string().optional(),
    EMBEDDING_MODEL: z.string().optional(),

    // Translation Provider
    TRANSLATION_PROVIDER: z.string().default('mock'),

    // BIS Consumer & Hallmarking Verification
    VERIFICATION_PROVIDER: z.enum(['mock', 'official']).default('mock'),
    BIS_VERIFICATION_PROVIDER: z.string().optional(),
    HALLMARKING_SOURCE_FRESHNESS_DAYS: z.coerce.number().int().positive().default(90),
    BIS_OFFICIAL_GATEWAY_URL: z.string().url().optional(),
    BIS_HUID_GATEWAY_URL: z.string().url().optional(),

    // File Storage
    STORAGE_PROVIDER: z.enum(['local', 's3', 'gcs']).default('local'),
    STORAGE_BUCKET: z.string().optional(),
    STORAGE_ACCESS_KEY: z.string().optional(),
    STORAGE_SECRET_KEY: z.string().optional(),
    STORAGE_REGION: z.string().optional(),
    STORAGE_ENDPOINT: z.string().optional(),
    STORAGE_FORCE_PATH_STYLE: z.coerce.boolean().default(false),
    STORAGE_LOCAL_PATH: z.string().default('./uploads'),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),

    // Logging
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  })
  .superRefine((data, ctx) => {
    // ── Production & Staging Strict Validations ───────────────────────────────
    const isProductionGrade = data.NODE_ENV === 'production' || data.NODE_ENV === 'staging';
    if (isProductionGrade) {
      // 1. JWT Secret requirement
      if (!data.JWT_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_SECRET'],
          message: 'JWT_SECRET is required in production and staging environments and must be at least 32 characters.',
        });
      } else if (INSECURE_DEV_JWT_SECRETS.includes(data.JWT_SECRET)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_SECRET'],
          message: 'Insecure default development JWT_SECRET cannot be used in production or staging.',
        });
      }

      // 2. S3 Storage Configuration validation
      if (data.STORAGE_PROVIDER === 's3') {
        if (!data.STORAGE_BUCKET || data.STORAGE_BUCKET.trim() === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['STORAGE_BUCKET'],
            message: 'STORAGE_BUCKET is required when STORAGE_PROVIDER is "s3".',
          });
        }
        if (!data.STORAGE_REGION || data.STORAGE_REGION.trim() === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['STORAGE_REGION'],
            message: 'STORAGE_REGION is required when STORAGE_PROVIDER is "s3".',
          });
        }

        // In AWS ECS / IAM task role production deployments, static credentials are not required
        // (credentials are resolved via the default provider chain).
        // If explicit/static credentials are provided, both key and secret must be supplied.
        const hasAccessKey = Boolean(data.STORAGE_ACCESS_KEY && data.STORAGE_ACCESS_KEY.trim() !== '');
        const hasSecretKey = Boolean(data.STORAGE_SECRET_KEY && data.STORAGE_SECRET_KEY.trim() !== '');

        if (hasAccessKey && !hasSecretKey) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['STORAGE_SECRET_KEY'],
            message: 'STORAGE_SECRET_KEY is required when STORAGE_ACCESS_KEY is provided.',
          });
        } else if (!hasAccessKey && hasSecretKey) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['STORAGE_ACCESS_KEY'],
            message: 'STORAGE_ACCESS_KEY is required when STORAGE_SECRET_KEY is provided.',
          });
        }
      }

      // 3. AI Provider Secret validation
      const effectiveAiProvider = (data.EMBEDDING_PROVIDER || data.AI_PROVIDER).toLowerCase();
      if (effectiveAiProvider === 'openai') {
        if (!data.OPENAI_API_KEY && !data.AI_API_KEY) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['OPENAI_API_KEY'],
            message: 'OPENAI_API_KEY or AI_API_KEY is required when AI/Embedding provider is "openai".',
          });
        }
      } else if (effectiveAiProvider === 'gemini' || effectiveAiProvider === 'google') {
        if (!data.GEMINI_API_KEY && !data.AI_API_KEY) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['GEMINI_API_KEY'],
            message: 'Gemini API key is required when AI_PROVIDER is "gemini". Set GEMINI_API_KEY or AI_API_KEY in environment.',
          });
        }
      }

      // 4. Translation Provider Secret validation
      const effectiveTranslationProvider = data.TRANSLATION_PROVIDER.toLowerCase();
      if (effectiveTranslationProvider === 'gemini' || effectiveTranslationProvider === 'google') {
        if (!data.GEMINI_API_KEY && !data.AI_API_KEY) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['GEMINI_API_KEY'],
            message: 'Gemini API key is required when TRANSLATION_PROVIDER is "gemini". Set GEMINI_API_KEY or AI_API_KEY in environment.',
          });
        }
      } else if (effectiveTranslationProvider === 'openai') {
        if (!data.OPENAI_API_KEY && !data.AI_API_KEY) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['OPENAI_API_KEY'],
            message: 'OPENAI_API_KEY or AI_API_KEY is required when TRANSLATION_PROVIDER is "openai".',
          });
        }
      }
    }
  });

export function validateEnv(rawEnv: Record<string, unknown> = process.env) {
  return envSchema.safeParse(rawEnv);
}

function loadEnv() {
  const result = validateEnv(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    if (process.env.NODE_ENV === 'test') {
      const fallback = envSchema.safeParse({
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/bis_compliance?schema=public',
      });
      if (fallback.success) return fallback.data;
      throw new Error('❌ Invalid environment configuration in test:\n' + issues);
    }

    console.error('❌ Invalid environment configuration:\n' + issues);
    console.error('\nPlease copy .env.example to .env and fill in the required values.');
    process.exit(1);
  }

  return result.data;
}

export const env = loadEnv();
export type Env = z.infer<typeof envSchema>;
