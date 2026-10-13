const CACHE_NAME = 'daily-deck-v9';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './calculator.js',
  './metabolic.js',
  './compound.js',
  './rent_vs_buy.js',
  './today.js',
  './app.js',
  './manifest.json',
  './manifest.json?v=8',
  './cat_walk_spritesheet.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => console.warn('Cache error:', err));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Always fetch live data from the network for APIs, proxies, and manifest
  if (
    event.request.url.includes('/api/') ||
    event.request.url.includes('allorigins') ||
    event.request.url.includes('manifest.json') ||
    event.request.url.includes('api.') ||
    event.request.url.includes('finance.yahoo') ||
    event.request.url.includes('nasa.gov')
  ) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
    );
  }
});
