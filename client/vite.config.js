import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Font loading note: Outfit + Inter + JetBrains Mono are loaded via Google Fonts
// in index.html using <link rel="preconnect"> + <link rel="stylesheet">.
// This is an external, runtime load — not bundled locally.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy /api requests to Express server during development.
    // Avoids CORS issues when running client (5173) + server (5000) separately.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    // Warn if a chunk exceeds 500 kB
    chunkSizeWarningLimit: 500,
  },
})
