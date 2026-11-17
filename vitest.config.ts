import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@core$/, replacement: fileURLToPath(new URL('./src/index.ts', import.meta.url)) },
      { find: /^@core\//, replacement: fileURLToPath(new URL('./src/', import.meta.url)) },
    ],
  },
  test: {
    include: ['tests/**/*.test.ts'],
    typecheck: {
      enabled: true,
      include: ['tests/type/**/*.test-d.ts'],
    },
  },
});
