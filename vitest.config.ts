import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@core$/, replacement: fileURLToPath(new URL('./src/core/index.ts', import.meta.url)) },
      { find: /^@core\//, replacement: fileURLToPath(new URL('./src/core/', import.meta.url)) },
    ],
  },
  test: {
    include: ['tests/**/*.test.ts'],
    globalSetup: ['./tests/integration/cli-setup.ts'],
    testTimeout: 15000,
    typecheck: {
      enabled: true,
      include: ['tests/type/**/*.test-d.ts'],
    },
  },
});
