import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// IMPORTANT: We run Playwright (e2e) only via dedicated scripts / CI job.
// Vitest's default pattern (**/*.{test,spec}.*) was picking up e2e/*.spec.ts
// which caused: "Playwright Test did not expect test() to be called here" in the pre-push hook.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'lcov'],
      reportsDirectory: 'coverage',
    },
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: [
      'e2e/**', // prevent Playwright specs from being run by Vitest
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'build/**',
    ],
  },
});
