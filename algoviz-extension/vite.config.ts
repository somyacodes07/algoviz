import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // important for webview relative paths
  publicDir: path.resolve(__dirname, '../public'),
  build: {
    outDir: 'webview-ui/dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        app: path.resolve(__dirname, 'webview/index.html'),
      },
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      }
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '..'),
    }
  },
  worker: {
    format: 'es',
    // In VS Code webviews, external workers often fail due to strict origin checks.
    // Inlining the worker as a blob or base64 usually resolves this.
  },
  optimizeDeps: {
    exclude: ['web-tree-sitter'],
  }
});
