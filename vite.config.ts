import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      worker: {
        format: 'es',
      },
      build: {
        rollupOptions: {
          input: {
            home: path.resolve(__dirname, 'index.html'),
            docs: path.resolve(__dirname, 'docs/index.html'),
            visualizer: path.resolve(__dirname, 'visualizer/index.html'),
            visualizerJavascript: path.resolve(__dirname, 'visualizer/javascript/index.html'),
            visualizerCpp: path.resolve(__dirname, 'visualizer/cpp/index.html'),
          },
        },
      },
      optimizeDeps: {
        exclude: ['web-tree-sitter'],
      }
    };
});
