
"use strict";

/* Service Worker khusus aplikasi RUSH HOUR */
const CACHE_NAME = "rush-hour-separate-v1";
const APP_PATH = "/rushhour/";
const APP_URL = new URL(APP_PATH, self.location.origin).href;

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    try {
      const response = await fetch(APP_URL, {
        cache: "reload"
      });

      if (response.ok) {
        await cache.put(APP_URL, response.clone());
      }
    } catch (error) {
      console.warn("Cache RUSH HOUR:", error);
    }

    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key =>
          key.startsWith("rush-hour-separate-") &&
          key !== CACHE_NAME
        )
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET" ||
      request.mode !== "navigate") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin ||
      !url.pathname.startsWith(APP_PATH)) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request);

      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }

      return response;
    } catch (error) {
      const cache = await caches.open(CACHE_NAME);
      const saved = await cache.match(request);

      if (saved) return saved;

      return new Response(
        "RUSH HOUR sedang offline. Periksa koneksi internet.",
        {
          status: 503,
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          }
        }
      );
    }
  })());
});
