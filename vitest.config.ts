import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx,js}'],
      exclude: ['src/**/*.d.ts', 'src/**/index.ts', 'src/core/types.ts'],
      reporter: ['text', 'json-summary'],
    },
  },
});
