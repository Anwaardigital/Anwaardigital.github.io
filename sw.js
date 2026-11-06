/* Anwaar Digital Service Worker - PWA offline support
   v2: network-first for pages (never serve stale HTML), stale-while-
   revalidate for static assets. The old v1 worker was cache-first for
   EVERYTHING with no expiry, so returning visitors saw months-old pages
   forever. */
const CACHE_NAME = 'anwaar-digital-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/anwaar-icon-192.png',
  '/anwaar-icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Only handle GET requests; let POST/etc. go straight to the network.
  if (event.request.method !== 'GET') {
    return;
  }

  const isPage = event.request.mode === 'navigate' ||
    event.request.destination === 'document';

  if (isPage) {
    // NETWORK-FIRST for pages: always show the newest page.
    // Cache is only a fallback when the network fails (offline).
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, copy))
            .catch(() => {});
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // STALE-WHILE-REVALIDATE for static assets (CSS, JS, images, fonts):
  // serve the cached copy instantly, refresh it in the background,
  // so the site stays fast but never permanently stale.
  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, copy))
            .catch(() => {});
        }
        return response;
      }).catch(() => undefined);
      return cached || network;
    })
  );
});
