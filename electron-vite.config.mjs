import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      target: 'node20',
      lib: { entry: resolve('src/main/background.ts'), formats: ['cjs'] },
      rollupOptions: { input: resolve('src/main/background.ts'), external: ['electron'], output: { format: 'cjs' } }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      target: 'node20',
      lib: { entry: resolve('src/main/preload.ts'), formats: ['cjs'] },
      rollupOptions: { input: resolve('src/main/preload.ts'), output: { format: 'cjs' } }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src')
      }
    },
    plugins: [react()],
    build: {
      target: 'chrome120',
      rollupOptions: { input: resolve('src/renderer/index.html') }
    }
  }
});
