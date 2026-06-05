const CACHE_NAME = 'quran-hadith-cache-v2';

const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// INSTALL
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('Caching app shell...');

      // SAFE caching (one by one instead of addAll)
      for (const asset of ASSETS) {
        try {
          await cache.add(asset);
        } catch (e) {
          console.log('Skip caching:', asset);
        }
      }
    })
  );

  self.skipWaiting();
});

// ACTIVATE
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

// FETCH (Cache first, fallback network)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((res) => {
          // optional dynamic cache
          return res;
        })
        .catch(() => {
          return caches.match('./index.html');
        });
    })
  );
});
