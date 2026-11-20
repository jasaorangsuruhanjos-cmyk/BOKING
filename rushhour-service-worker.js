
const CACHE_NAME = "rush-hour-pwa-domain-v2";
const APP_PATH = "/RUSH_HOUR_PELANGGAN.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.add(APP_PATH)
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  const url = new URL(event.request.url);

  if (url.pathname !== APP_PATH) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(APP_PATH, copy)
          );
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(APP_PATH);
        if (cached) return cached;

        return new Response(
          "RUSH HOUR sedang offline. Silakan periksa koneksi internet Anda.",
          {
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            }
          }
        );
      })
  );
});
