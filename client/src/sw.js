import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { clientsClaim } from "workbox-core";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst, NetworkOnly } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

// ── Core ──────────────────────────────────────────────────────────────────────
cleanupOutdatedCaches();
clientsClaim();
self.skipWaiting();

// Injecté automatiquement par vite-plugin-pwa au build
precacheAndRoute(self.__WB_MANIFEST);

// ── Caching rules (identiques à l'ancienne config generateSW) ────────────────

// API — jamais en cache
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkOnly()
);

// Navigation SPA — NetworkFirst avec fallback 3s
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: "zamor-pages",
      networkTimeoutSeconds: 3,
    })
  )
);

// JS/CSS hashés — CacheFirst (le hash garantit la fraîcheur)
registerRoute(
  ({ url }) => /\/assets\/.*\.(js|css)(\?.*)?$/.test(url.pathname),
  new CacheFirst({
    cacheName: "zamor-assets",
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

// Images, polices — CacheFirst 90j
registerRoute(
  ({ url }) => /\.(woff2?|ttf|png|jpe?g|svg|ico|webp)(\?.*)?$/.test(url.pathname),
  new CacheFirst({
    cacheName: "zamor-static",
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 90 * 24 * 60 * 60 }),
    ],
  })
);

// ── Push notifications ────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "Zamor Manager", body: event.data.text() };
  }

  const title = data.title || "Zamor Manager";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "zamor-notif",
    renotify: true,
    data: { url: data.url || "/phones" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if ("focus" in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
