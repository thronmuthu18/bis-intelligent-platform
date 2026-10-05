import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // Resolve @bis/shared from TypeScript source so tests work in CI
      // without a pre-build step (packages/shared/dist/ is gitignored).
      // This mirrors the tsconfig.json `paths` alias used during compilation.
      '@bis/shared': resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    env: {
      AI_PROVIDER: 'mock',
      TRANSLATION_PROVIDER: 'mock',
    },
    include: ['tests/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
