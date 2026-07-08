// Minimal service worker: mainly exists to satisfy installability checks
// in browsers that require one (some Chrome/Edge versions won't offer
// "Install" without a registered service worker, even with a valid
// manifest). It does a simple network-first pass-through for now — no
// offline caching yet, that's a separate feature to add later if wanted.

const CACHE_NAME = "openread-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
