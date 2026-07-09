import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
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
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
});
