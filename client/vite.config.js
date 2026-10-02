import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const API_TARGET = process.env.VITE_DEV_API_TARGET || 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // Same-origin in development too: the browser talks to Vite, Vite forwards
    // /api and /media to Express. Cookies and the CSRF origin check just work.
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: false },
      '/media': { target: API_TARGET, changeOrigin: false },
    },
  },
  preview: { port: 4173 },
  build: {
    sourcemap: false,
    target: 'baseline-widely-available',
    assetsInlineLimit: 2048,
  },
});
