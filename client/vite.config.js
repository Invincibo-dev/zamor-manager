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
        // Précache tous les assets du build
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // SPA fallback : toutes les navigations retournent index.html
        navigateFallback: 'index.html',
        // Exclure les routes API du fallback
        navigateFallbackDenylist: [/^\/api\//],
        // Stratégie réseau-d'abord pour le HTML (évite l'affichage de vieilles versions)
        runtimeCaching: [
          {
            urlPattern: /^\/api\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  build: {
    outDir: "../server/build",
    emptyOutDir: true,
  },
})
