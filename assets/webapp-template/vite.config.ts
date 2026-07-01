/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Static, dependency-light single-page app. `base: './'` makes the production
// build work from any static host or a file path (exportable static site).
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
