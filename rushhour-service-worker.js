
/* RUSH HOUR — Service Worker khusus aplikasi pelanggan */
"use strict";

const CACHE_NAME = "rush-hour-pwa-v1";
const APP_PATH = "/BOKING/RUSH_HOUR_PELANGGAN.html";
const APP_URL = new URL(APP_PATH, self.location.origin).href;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    try {
      const response = await fetch(APP_URL, { cache: "reload" });
      if (response.ok) {
        await cache.put(APP_URL, response.clone());
      }
    } catch (_) {}

    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();

    await Promise.all(
      names
        .filter(name =>
          name.startsWith("rush-hour-pwa-") &&
          name !== CACHE_NAME
        )
        .map(name => caches.delete(name))
    );

    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET" ||
      request.mode !== "navigate") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin ||
      url.pathname !== APP_PATH) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request);

      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(APP_URL, response.clone());
      }

      return response;
    } catch (_) {
      const cache = await caches.open(CACHE_NAME);
      const saved = await cache.match(APP_URL);

      if (saved) return saved;

      return new Response(
        "<h2>RUSH HOUR sedang offline</h2><p>Periksa koneksi internet dan coba kembali.</p>",
        {
          status: 503,
          headers: {
            "Content-Type": "text/html; charset=utf-8"
          }
        }
      );
    }
  })());
});
