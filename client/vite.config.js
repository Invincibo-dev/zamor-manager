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
      workbox: {
        // Prefix for precache entries — change this value to force-invalidate all
        // old caches on next deploy (e.g. 'zamor-pwa-v2')
        cacheId: 'zamor-pwa',

        // Remove stale precache entries left by previous SW versions
        cleanupOutdatedCaches: true,

        // New SW skips the waiting phase and activates immediately,
        // without requiring all open tabs to be closed first.
        skipWaiting: true,

        // New SW claims all existing clients immediately after activation,
        // so pages already open are served by the updated SW right away.
        clientsClaim: true,

        // Precache the entire build output; Vite adds content hashes to
        // JS/CSS filenames so stale entries are detected and replaced automatically.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // Offline-only SPA fallback: serves the precached index.html when a
        // navigation request cannot be handled by any runtime cache rule below
        // (e.g. cold-start while offline). Excluded from /api/* routes.
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],

        runtimeCaching: [
          // ── API calls ────────────────────────────────────────────────────────
          // Never cache — always fetch live data from the server.
          {
            urlPattern: /^\/api\/.*/i,
            handler: 'NetworkOnly',
          },

          // ── HTML navigation ──────────────────────────────────────────────────
          // NetworkFirst: always try the network so users get the latest deployed
          // version of index.html. Falls back to the cached copy after 3 s if the
          // network is unavailable or too slow.
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'zamor-pages',
              networkTimeoutSeconds: 3,
            },
          },

          // ── Hashed JS / CSS bundles ──────────────────────────────────────────
          // CacheFirst: Vite embeds a content hash in each filename (e.g.
          // vendor-B-xnweam.js). A changed file gets a new URL, so the cached
          // copy is always valid for its lifetime. 30-day TTL, max 60 entries.
          {
            urlPattern: /\/assets\/.*\.(js|css)(\?.*)?$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'zamor-assets',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },

          // ── Fonts and images ─────────────────────────────────────────────────
          // CacheFirst: these change rarely; 90-day TTL is safe.
          {
            urlPattern: /\.(woff2?|ttf|png|jpe?g|svg|ico|webp)(\?.*)?$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'zamor-static',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 90 * 24 * 60 * 60, // 90 days
              },
            },
          },
        ],
      },
    }),
  ],
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
