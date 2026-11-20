
/* JOS Admin PWA — custom domain jasaorangsuruhan.my.id */
const CACHE_NAME = 'jos-admin-pwa-domain-v2';
const APP_PATH = '/admin/admin.html';
const APP_SCOPE = '/admin/';

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      await cache.add(APP_PATH);
    } catch (error) {
      console.warn('Cache awal JOS Admin dilewati:', error);
    }
  })());
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key =>
        key.startsWith('jos-admin-') &&
        key !== CACHE_NAME
      )
      .map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (
    url.origin !== self.location.origin ||
    !url.pathname.startsWith(APP_SCOPE)
  ) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response && response.ok && response.type === 'basic') {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await caches.match(request);
      if (cached) return cached;

      if (request.mode === 'navigate') {
        const app = await caches.match(APP_PATH);
        if (app) return app;
      }

      return new Response(
        'JOS Admin sedang offline. Periksa koneksi internet lalu coba lagi.',
        {
          status: 503,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8'
          }
        }
      );
    }
  })());
});
