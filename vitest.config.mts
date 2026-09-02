import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      // Le moteur de calcul est la raison d'être du produit : couverture exigée à 100 %.
      include: ['src/lib/tax/**', 'src/lib/finance/**', 'src/lib/money.ts'],
      thresholds: { lines: 100, functions: 100, branches: 95, statements: 100 },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
