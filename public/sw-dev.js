/*
 * Development-only service worker.
 * In `next dev` the build is updated continuously, so we intentionally
 * do NOT cache anything. It exists so the registration code path
 * works in both dev and production.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Passthrough: never intercept requests in development.
});