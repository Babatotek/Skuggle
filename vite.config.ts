import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'motion/react'],
      exclude: ['@google/genai'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': 'http://127.0.0.1:8000',
        '/sanctum': 'http://127.0.0.1:8000',
        '/health': 'http://127.0.0.1:8000',
        '/ready': 'http://127.0.0.1:8000',
      },
    },
    build: {
      target: 'es2022',
      cssCodeSplit: true,
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Core vendor chunks - process in order to avoid circular dependencies
            if (id.includes('node_modules')) {
              // Motion before the broad "react" match — paths like motion/react
              // would otherwise land in react-vendor and create circular chunks.
              if (id.includes('motion') || id.includes('framer-motion')) {
                return 'motion-vendor';
              }
              // Charts library
              if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) {
                return 'charts-vendor';
              }
              // Icons
              if (id.includes('lucide-react')) {
                return 'icons-vendor';
              }
              // React core only (avoid matching every package with "react" in the path)
              if (
                /node_modules[/\\](react|react-dom|scheduler)[/\\]/.test(id)
                || id.includes('react-dom')
              ) {
                return 'react-vendor';
              }
              // AI and utilities
              if (id.includes('@google/genai') || id.includes('canvas-confetti')) {
                return 'utils-vendor';
              }
              // Everything else goes to vendor
              return 'vendor';
            }
            
            // Application code splitting by feature area
            // Keep dashboards and shared features together to avoid circular chunks
            // (dashboard imports feature widgets and vice versa).
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
              if (
                id.includes('/features/dashboard/')
                || id.includes('/features/academics/')
                || id.includes('/features/attendance/')
                || id.includes('/features/assessments/')
                || id.includes('/features/students/')
                || id.includes('/features/staff/')
                || id.includes('/features/cbt/')
                || id.includes('/features/communication/')
                || id.includes('/features/onboarding/')
                || id.includes('/features/subscription/')
                || id.includes('/features/branding/')
                || id.includes('/features/invitations/')
              ) {
                return 'app-features';
              }
              return 'app-features';
            }
          },
          // Optimize chunk naming for caching
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },
    },
  };
});
