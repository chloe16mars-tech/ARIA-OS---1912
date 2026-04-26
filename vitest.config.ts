import { defineConfig } from 'vitest/config';

/**
 * Vitest config for backend / pure-Node tests only. Angular component
 * tests run through `ng test` which uses its own builder.
 */
export default defineConfig({
  test: {
    include: ['src/server/**/*.spec.ts'],
    environment: 'node',
    reporters: 'default',
  },
});
