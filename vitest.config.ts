import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    // Stub PUBLIC_API_URL for tests so import.meta.env doesn't break
    'import.meta.env.PUBLIC_API_URL': JSON.stringify(undefined),
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'handlers/**/*.test.ts'],
  },
});
