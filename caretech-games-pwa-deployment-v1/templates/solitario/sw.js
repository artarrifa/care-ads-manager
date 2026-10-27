/**
 * CareTech Games - Solitario Care Service Worker (PWA Offline First)
 * Scope: /games/solitario/
 * Version: 1.4.3
 */

const CACHE_NAME = 'caretech-solitario-v1.4.3';
const SCOPE_PATH = '/games/solitario/';

// Core assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/games/solitario/',
  '/games/solitario/index.html',
  '/games/solitario/care-ui.css',
  '/games/solitario/solitaire.css',
  '/games/solitario/care-platform.js',
  '/games/solitario/care-platform.config.json',
  '/games/solitario/solitaire.js',
  '/games/solitario/register-pwa.js',
  '/games/solitario/manifest.webmanifest',
  '/games/solitario/offline.html',
  '/games/solitario/icons/icon-192.svg',
  '/games/solitario/icons/icon-512.svg'
];

// Install Event: Precaching core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW-Solitario] Precaching warning (some files deferred):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up old versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key.startsWith('caretech-solitario-') && key !== CACHE_NAME) {
            console.log('[SW-Solitario] Eliminando caché antigua:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Cache First with Network Fallback, strictly scoped
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // 1. Never intercept outside scope (/games/solitario/)
  if (!requestUrl.pathname.startsWith(SCOPE_PATH)) {
    return;
  }

  // 2. Exclude advertisement API, registration & telemetry endpoints (handled by CarePlatform via ETag + IndexedDB)
  if (
    requestUrl.pathname.includes('/wp-json/careads') ||
    requestUrl.pathname.includes('/api/v1/') ||
    requestUrl.pathname.includes('api.php')
  ) {
    return;
  }

  // 3. Only intercept GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in background for HTML assets (stale-while-revalidate)
        if (event.request.headers.get('accept')?.includes('text/html')) {
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          }).catch(() => {});
        }
        return cachedResponse;
      }

      // Network fetch with caching
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // Cache valid responses inside /games/solitario/
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // If offline and request is for an HTML page, return offline.html
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/games/solitario/offline.html');
          }
        });
    })
  );
});
