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
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
