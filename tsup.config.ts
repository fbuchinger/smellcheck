import { defineConfig } from 'tsup';

export default defineConfig([
  // Library build
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    outDir: 'dist',
  },
  // CLI build
  {
    entry: { 'cli/index': 'src/cli/index.ts' },
    format: ['esm'],
    banner: { js: '#!/usr/bin/env node' },
    sourcemap: true,
    outDir: 'dist',
  },
]);
