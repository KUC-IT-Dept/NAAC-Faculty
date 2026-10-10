import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// Run from the project root:  npx vitest run --config tests/online-courses/vitest.config.ts
export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, '../..'),
  test: {
    environment: 'jsdom',
    include: ['tests/online-courses/**/*.test.tsx'],
    globals: true,
  },
});
