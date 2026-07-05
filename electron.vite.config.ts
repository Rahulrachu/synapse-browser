import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: path.resolve(__dirname, 'src/main/background.ts'),
      },
      rollupOptions: {
        output: {
          format: 'es',
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: path.resolve(__dirname, 'src/main/preload.ts'),
      },
      rollupOptions: {
        output: {
          format: 'es',
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
      rollupOptions: {
        input: path.resolve(__dirname, 'index.html'),
      },
    },
  },
});
