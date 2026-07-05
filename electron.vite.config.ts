import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist/main',
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, 'src/main/background.ts'),
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist/preload',
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, 'src/main/preload.ts'),
        },
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/renderer/components'),
        '@hooks': path.resolve(__dirname, './src/renderer/hooks'),
        '@pages': path.resolve(__dirname, './src/renderer/pages'),
        '@store': path.resolve(__dirname, './src/renderer/store'),
        '@utils': path.resolve(__dirname, './src/renderer/utils'),
      },
    },
    plugins: [react()],
    build: {
      outDir: 'dist/renderer',
    },
  },
});
