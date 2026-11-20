
/* JOS Mitra PWA — domain jasaorangsuruhan.my.id */
const CACHE_NAME = "jos-mitra-pwa-domain-v2";
const APP_PATH = "/mitra/index.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        await cache.add(APP_PATH);
      } catch (error) {
        console.warn("Cache awal JOS Mitra dilewati:", error);
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith("jos-mitra-pwa-") &&
              key !== CACHE_NAME
          )
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (
    request.method !== "GET" ||
    request.mode !== "navigate"
  ) return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith("/mitra/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(request, copy)
          );
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        const app = await caches.match(APP_PATH);
        if (app) return app;

        return new Response(
          "JOS Mitra sedang offline. Periksa koneksi internet lalu coba lagi.",
          {
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            }
          }
        );
      })
  );
});
