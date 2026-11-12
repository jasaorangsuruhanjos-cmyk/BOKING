
/* JOS PWA Service Worker — Pelanggan */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Hanya tangani navigasi halaman
  if (request.method !== "GET" || request.mode !== "navigate") {
    return;
  }

  const requestUrl = new URL(request.url);

  // Jangan menangani permintaan lintas domain
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  // Hanya halaman utama Pelanggan
  // Admin dan Mitra tidak disentuh
  if (!requestUrl.pathname.endsWith("/index.html")) {
    return;
  }

  event.respondWith((async () => {
    const maintenanceUrl = new URL(
      "./maintenance.html",
      self.location.href
    );

    try {
      const response = await fetch(request);

      // Jika index.html normal
      if (response.ok) {
        return response;
      }

      // Jika 404 atau server error
      if (response.status === 404 || response.status >= 500) {
        try {
          const maintenanceResponse = await fetch(
            maintenanceUrl,
            { cache: "no-store" }
          );

          if (maintenanceResponse.ok) {
            return maintenanceResponse;
          }
        } catch (_) {
          // Gunakan respons error asli
        }
      }

      return response;

    } catch (_) {

      // Jika koneksi gagal, tampilkan maintenance
      try {
        const maintenanceResponse = await fetch(
          maintenanceUrl,
          { cache: "no-store" }
        );

        if (maintenanceResponse.ok) {
          return maintenanceResponse;
        }

      } catch (_) {
        // Jika halaman maintenance juga gagal
      }

      return new Response(
        `<!doctype html>
        <html lang="id">
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>JOS</title>
        <body style="font-family:Arial,sans-serif;padding:32px;text-align:center;color:#073b35">
        <h2>JOS sedang tidak dapat diakses</h2>
        <p>Periksa koneksi internet lalu coba kembali beberapa saat lagi.</p>
        </body>
        </html>`,
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
