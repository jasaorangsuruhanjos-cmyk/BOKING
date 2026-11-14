
// JOS Mitra Service Worker v5

const CACHE_NAME = "jos-mitra-app-v4";
const CACHE_PREFIX = "jos-mitra-app-";
const APP_SCOPE = self.registration.scope;

// Install
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

// Activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith(CACHE_PREFIX) &&
              key !== CACHE_NAME
          )
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Cache: network first
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);

  if (
    requestUrl.origin !== self.location.origin ||
    !requestUrl.href.startsWith(APP_SCOPE)
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(event.request, copy)
          );
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          return new Response("Koneksi internet tidak tersedia.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          });
        })
      )
  );
});

// Push notification
self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {
      body: event.data ? event.data.text() : "Ada informasi baru dari JOS."
    };
  }

  const title = data.title || "JOS Mitra";
  const options = {
    body: data.body || "Ada pesanan baru tersedia.",
    icon: new URL("jos-mitra-192.png", APP_SCOPE).href,
    badge: new URL("jos-mitra-192.png", APP_SCOPE).href,
    data: {
      url: data.url || "./"
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Saat notifikasi diklik
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    (async () => {
      let targetUrl;

      try {
        targetUrl = new URL(
          event.notification.data?.url || "./",
          APP_SCOPE
        );

        if (
          targetUrl.origin !== self.location.origin ||
          !targetUrl.href.startsWith(APP_SCOPE)
        ) {
          targetUrl = new URL("./", APP_SCOPE);
        }
      } catch {
        targetUrl = new URL("./", APP_SCOPE);
      }

      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true
      });

      for (const client of windows) {
        if (client.url.startsWith(APP_SCOPE)) {
          await client.navigate(targetUrl.href);
          return client.focus();
        }
      }

      return self.clients.openWindow(targetUrl.href);
    })()
  );
});
