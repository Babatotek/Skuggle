/// <reference types="node" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { ClientRequest, IncomingMessage } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type ProxyOptions } from 'vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const emailProxy: ProxyOptions = {
  target: 'http://127.0.0.1:8000',
  changeOrigin: true,
  configure: (proxy) => {
    proxy.on('proxyReq', (proxyReq: ClientRequest, req: IncomingMessage) => {
      const host = req.headers.host;
      if (host) {
        proxyReq.setHeader('X-Forwarded-Host', host);
        proxyReq.setHeader('X-Forwarded-Proto', 'http');
      }
    });
  },
};

function resolveViteBuildId(command: 'build' | 'serve'): string {
  const existing = process.env.VITE_BUILD_ID?.trim();
  if (existing) {
    return existing;
  }

  // HTML env replacement requires VITE_BUILD_ID; deploy scripts set the real release id.
  return command === 'serve' ? 'dev' : `local-${Date.now()}`;
}

export default defineConfig(({ command }) => {
  process.env.VITE_BUILD_ID = resolveViteBuildId(command);

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(dirname, '.'),
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'motion/react'],
      exclude: ['@google/genai'],
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? { ignored: ['**'] } : {},
      proxy: {
        '/api': 'http://127.0.0.1:8000',
        '/sanctum': 'http://127.0.0.1:8000',
        '/health': 'http://127.0.0.1:8000',
        '/ready': 'http://127.0.0.1:8000',
        '/live': 'http://127.0.0.1:8000',
        '/startup': 'http://127.0.0.1:8000',
        '/version': 'http://127.0.0.1:8000',
        '/email': emailProxy,
      },
    },
    build: {
      target: 'es2022',
      cssCodeSplit: true,
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: (id: string) => {
            if (id.includes('node_modules')) {
              if (id.includes('motion') || id.includes('framer-motion')) {
                return 'motion-vendor';
              }
              if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) {
                return 'charts-vendor';
              }
              if (id.includes('lucide-react')) {
                return 'icons-vendor';
              }
              if (id.includes('react-router')) {
                return 'router-vendor';
              }
              if (
                /node_modules[/\\](react|react-dom|scheduler)[/\\]/.test(id)
                || id.includes('react-dom')
              ) {
                return 'react-vendor';
              }
              if (id.includes('@google/genai') || id.includes('canvas-confetti')) {
                return 'utils-vendor';
              }
              return 'vendor';
            }
            if (id.includes('/shell/')) {
              return 'app-shell';
            }
            if (id.includes('/features/')) {
              if (id.includes('/features/public/')) {
                return 'app-public';
              }
              if (id.includes('/features/teacher/')) {
                return 'app-teacher';
              }
              if (id.includes('/features/finance/') || id.includes('/features/results/')) {
                return 'app-admin';
              }
              return 'app-features';
            }
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },
    },
  };
});
