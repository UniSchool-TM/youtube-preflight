const VERSION = "3";
const CACHE = `yp-cache-v${VERSION}`;
const STATIC_CACHE = `yp-static-v${VERSION}`;

// Base path is derived from this script's location, so the worker keeps
// working under a subpath deployment (e.g. /youtube-preflight/).
const BASE = self.location.pathname.replace(/\/sw\.js$/, "") || "";

const PRECACHE_ROUTES = [
  `${BASE}/`,
  `${BASE}/diagnose`,
  `${BASE}/compare`,
  `${BASE}/history`,
  `${BASE}/settings`,
  `${BASE}/about`,
];
const STATIC_ASSETS = [
  `${BASE}/manifest.webmanifest`,
  `${BASE}/icon-192.png`,
  `${BASE}/icon-512.png`,
  `${BASE}/icon-180.png`,
  `${BASE}/icon.svg?v=${VERSION}`,
  `${BASE}/favicon.ico?v=${VERSION}`,
  `${BASE}/og-image.png`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(PRECACHE_ROUTES).catch(() => {});
      const staticCache = await caches.open(STATIC_CACHE);
      await staticCache.addAll(STATIC_ASSETS).catch(() => {});
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== CACHE && k !== STATIC_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigation: network first, fall back to the cached app shell.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put(req, res.clone());
          return res;
        } catch {
          const cached = await caches.match(req, { ignoreSearch: true });
          if (cached) return cached;
          return (
            (await caches.match(`${BASE}/`, { ignoreSearch: true })) ||
            new Response("オフラインです。", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        }
      })()
    );
    return;
  }

  // Static hashed assets: cache first, then network + populate cache.
  if (url.pathname.includes("/_next/static/")) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        const res = await fetch(req);
        if (res.ok) {
          const cache = await caches.open(CACHE);
          cache.put(req, res.clone());
        }
        return res;
      })()
    );
    return;
  }

  // Other same-origin assets: static cache first, then network + cache.
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      const res = await fetch(req);
      if (res.ok && (res.type === "basic" || res.type === "default")) {
        const cache = await caches.open(STATIC_CACHE);
        cache.put(req, res.clone());
      }
      return res;
    })()
  );
});