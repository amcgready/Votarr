// src/config/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: 'brotli',
      threshold: 1024
    }),
    visualizer({
      filename: 'bundle-analysis.html'
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': [
            'react',
            'react-dom',
            'react-router-dom',
            '@tanstack/react-query'
          ],
          'plex-api': ['./src/lib/PlexAPI'],
          'ui-components': ['./src/components/ui'],
          'session-logic': ['./src/features/sessions'],
          'vote-logic': ['./src/features/voting']
        }
      }
    },
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
    emptyOutDir: true,
    sourcemap: false,
    assetsInlineLimit: 4096
  },
  css: {
    modules: {
      localsConvention: 'camelCase'
    },
    preprocessorOptions: {
      scss: {
        additionalData: '@import "./src/styles/variables.scss";'
      }
    }
  }
});

// src/App.tsx
import React, { Suspense, lazy } from 'react';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Lazy-loaded components
const Session = lazy(() => import('./features/sessions/Session'));
const VotingInterface = lazy(() => import('./features/voting/VotingInterface'));
const MediaBrowser = lazy(() => import('./features/media/MediaBrowser'));
const UserProfile = lazy(() => import('./features/user/UserProfile'));

// Route configurations with dynamic imports
const routes = [
  {
    path: '/session/:id',
    component: Session
  },
  {
    path: '/vote/:sessionId',
    component: VotingInterface
  },
  {
    path: '/media',
    component: MediaBrowser
  },
  {
    path: '/profile',
    component: UserProfile
  }
].map(route => ({
  ...route,
  element: (
    <Suspense fallback={<LoadingSpinner />}>
      <route.component />
    </Suspense>
  )
}));

// Asset optimization
const imageLoader = ({ src, width, quality = 75 }) => {
  return `${src}?w=${width}&q=${quality}&format=webp`;
};
