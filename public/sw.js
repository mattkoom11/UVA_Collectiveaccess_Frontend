// Service Worker for UVA Fashion Archive PWA
const CACHE_NAME = 'uva-fashion-v2';
const RUNTIME_CACHE = 'uva-fashion-runtime-v2';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/collection',
  '/timeline',
  '/about',
  '/favicon.ico',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first, falling back to cache only when offline.
// (Previously cache-first: once a page/script was cached, it would be served
// forever even after a new deploy, since neither the fetch strategy nor a
// stale cache entry's own key ever forces revalidation. Content-hashed
// Next.js build assets are safe to cache-first since a change produces a new
// URL, but the app shell / HTML routes are not — network-first keeps those
// current while still working offline via the cache fallback.)
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip API requests
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Don't cache if not a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match('/offline');
        });
      })
  );
});
