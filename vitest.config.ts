import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    // Stub VITE_API_URL for tests so import.meta.env doesn't break
    'import.meta.env.VITE_API_URL': JSON.stringify(undefined),
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'handlers/**/*.test.ts'],
  },
});
