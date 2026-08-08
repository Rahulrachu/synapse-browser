import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      target: 'node20',
      lib: {
        entry: 'src/main/background.ts',
        formats: ['cjs'],
      },
      rollupOptions: {
        input: 'src/main/background.ts',
        external: ['electron'],
        output: { format: 'cjs' },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      target: 'node20',
      lib: {
        entry: 'src/main/preload.ts',
        formats: ['cjs'],
      },
      rollupOptions: {
        input: 'src/main/preload.ts',
        output: { format: 'cjs' },
      },
    },
  },
  renderer: {
    build: { target: 'chrome120' },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    plugins: [react()],
  },
});
