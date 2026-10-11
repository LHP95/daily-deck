const CACHE_NAME = 'lorens-stuff-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './calculator.js',
  './metabolic.js',
  './compound.js',
  './today.js',
  './app.js',
  './manifest.json',
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
  // Network first with fallback to cache for dynamic / API requests, cache first for app shell
  if (event.request.url.includes('api.') || event.request.url.includes('query1.finance') || event.request.url.includes('nasa.gov')) {
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
