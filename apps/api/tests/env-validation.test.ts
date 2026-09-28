import { describe, it, expect } from 'vitest';
import { validateEnv, INSECURE_DEV_JWT_SECRETS } from '../src/config/env.js';

describe('Production Environment Validation', () => {
  const baseValidDevEnv = {
    NODE_ENV: 'development',
    PORT: '5000',
    DATABASE_URL: 'postgresql://postgres:password@localhost:5432/bis_compliance?schema=public',
    FRONTEND_URL: 'http://localhost:5173',
    API_BASE_URL: 'http://localhost:5000/api/v1',
    JWT_SECRET: INSECURE_DEV_JWT_SECRETS[0],
    STORAGE_PROVIDER: 'local',
    AI_PROVIDER: 'mock',
    TRANSLATION_PROVIDER: 'mock',
  };

  it('should validate cleanly in development mode with mock providers', () => {
    const res = validateEnv(baseValidDevEnv);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.NODE_ENV).toBe('development');
      expect(res.data.STORAGE_PROVIDER).toBe('local');
      expect(res.data.AI_PROVIDER).toBe('mock');
    }
  });

  describe('Production Mode Security Rules', () => {
    const baseValidProdEnv = {
      NODE_ENV: 'production',
      PORT: '5000',
      DATABASE_URL: 'postgresql://user:strongpass@prod-db.internal:5432/bis_prod?sslmode=require',
      FRONTEND_URL: 'https://bis.example.com',
      API_BASE_URL: 'https://api.bis.example.com/api/v1',
      JWT_SECRET: 'production_random_secret_with_more_than_thirty_two_characters_minimum',
      STORAGE_PROVIDER: 'local',
      AI_PROVIDER: 'mock',
      TRANSLATION_PROVIDER: 'mock',
    };

    it('should pass in production mode with valid secure configuration', () => {
      const res = validateEnv(baseValidProdEnv);
      expect(res.success).toBe(true);
    });

    it('should reject missing JWT_SECRET in production mode', () => {
      const { JWT_SECRET, ...envWithoutJwt } = baseValidProdEnv;
      const res = validateEnv(envWithoutJwt);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues.some((i) => i.path.includes('JWT_SECRET'))).toBe(true);
      }
    });

    it('should reject insecure development JWT_SECRET in production mode', () => {
      for (const insecureKey of INSECURE_DEV_JWT_SECRETS) {
        const res = validateEnv({
          ...baseValidProdEnv,
          JWT_SECRET: insecureKey,
        });
        expect(res.success).toBe(false);
        if (!res.success) {
          const jwtIssue = res.error.issues.find((i) => i.path.includes('JWT_SECRET'));
          expect(jwtIssue?.message).toContain('Insecure default development JWT_SECRET');
        }
      }
    });

    it('should require S3 credentials and bucket when STORAGE_PROVIDER is s3 in production', () => {
      const res = validateEnv({
        ...baseValidProdEnv,
        STORAGE_PROVIDER: 's3',
        // Omit STORAGE_BUCKET, STORAGE_ACCESS_KEY, etc.
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        const paths = res.error.issues.map((i) => i.path.join('.'));
        expect(paths).toContain('STORAGE_BUCKET');
        expect(paths).toContain('STORAGE_ACCESS_KEY');
        expect(paths).toContain('STORAGE_SECRET_KEY');
        expect(paths).toContain('STORAGE_REGION');
      }
    });

    it('should pass when STORAGE_PROVIDER is s3 with full configuration in production', () => {
      const res = validateEnv({
        ...baseValidProdEnv,
        STORAGE_PROVIDER: 's3',
        STORAGE_BUCKET: 'bis-production-docs',
        STORAGE_ACCESS_KEY: 'AKIA_PROD_KEY',
        STORAGE_SECRET_KEY: 'secret_prod_key',
        STORAGE_REGION: 'ap-south-1',
      });
      expect(res.success).toBe(true);
    });

    it('should require OpenAI API key when AI_PROVIDER is openai in production', () => {
      const res = validateEnv({
        ...baseValidProdEnv,
        AI_PROVIDER: 'openai',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues.some((i) => i.path.includes('OPENAI_API_KEY'))).toBe(true);
      }
    });

    it('should require Gemini API key when AI_PROVIDER is gemini in production', () => {
      const res = validateEnv({
        ...baseValidProdEnv,
        AI_PROVIDER: 'gemini',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues.some((i) => i.path.includes('GEMINI_API_KEY'))).toBe(true);
      }
    });

    it('should require OpenAI API key when TRANSLATION_PROVIDER is openai in production', () => {
      const res = validateEnv({
        ...baseValidProdEnv,
        TRANSLATION_PROVIDER: 'openai',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues.some((i) => i.path.includes('OPENAI_API_KEY'))).toBe(true);
      }
    });
  });
});
