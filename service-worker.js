
/* JOS PWA Service Worker — Pelanggan */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET" || request.mode !== "navigate") {
    return;
  }

  const requestUrl = new URL(request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (
    requestUrl.pathname !== "/" &&
    requestUrl.pathname !== "/index.html"
  ) {
    return;
  }

  event.respondWith((async () => {
    const maintenanceUrl = new URL(
      "./maintenance.html",
      self.location.href
    );

    try {
      const response = await fetch(request);

      if (response.ok) return response;

      if (response.status === 404 || response.status >= 500) {
        try {
          const maintenanceResponse = await fetch(
            maintenanceUrl,
            { cache: "no-store" }
          );

          if (maintenanceResponse.ok) return maintenanceResponse;
        } catch (_) {}
      }

      return response;
    } catch (_) {
      try {
        const maintenanceResponse = await fetch(
          maintenanceUrl,
          { cache: "no-store" }
        );

        if (maintenanceResponse.ok) return maintenanceResponse;
      } catch (_) {}

      return new Response(
        "JOS sedang tidak dapat diakses. Periksa koneksi internet.",
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
