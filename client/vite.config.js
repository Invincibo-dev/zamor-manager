import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Le manifest est géré manuellement dans public/manifest.json
      manifest: false,
      // injectManifest : on fournit src/sw.js et vite-plugin-pwa injecte
      // uniquement la précache manifest (self.__WB_MANIFEST).
      // Cela permet d'ajouter les handlers push en plus du caching workbox.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "../server/build",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — chargé en premier, mis en cache longtemps
          vendor: ['react', 'react-dom'],
          // Router — séparé pour permettre le tree-shaking
          router: ['react-router-dom'],
          // Recharts est lourd (~400 kB) — chunk séparé chargé seulement sur les pages charts
          charts: ['recharts'],
        },
      },
    },
  },
})
