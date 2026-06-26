/* This service worker retires any previously registered service workers and
 * reloads all clients. */

// Activate immediately, without waiting for existing clients to close.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  // `waitUntil` keeps the worker alive until the cleanup promise settles,
  // otherwise the browser may terminate it before the work below completes.
  event.waitUntil((async () => {
    // Take control of existing clients.
    await self.clients.claim();

    // Delete Workbox caches.
    await Promise.all(
      (await caches.keys())
        .filter((key) => key.startsWith("workbox-"))
        .map((key) => caches.delete(key))
    );

    // Mark this registration for removal.
    await self.registration.unregister();

    // Reload existing clients.
    for (const client of await self.clients.matchAll()) {
      // Ignore navigation failures (e.g. a non-window or uncontrolled client)
      // so one failure doesn't reject the cleanup promise.
      client.navigate(client.url).catch(() => {});
    }
  })());
});
