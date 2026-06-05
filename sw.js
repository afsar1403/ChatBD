const CACHE_NAME = 'quran-hadith-cache-v3';

const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// INSTALL (Safe procedural extraction strategy)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('Caching modern app core files safely...');
      for (const asset of ASSETS) {
        try {
          await cache.add(asset);
        } catch (e) {
          console.log('Skipped optional core asset route:', asset);
        }
      }
    })
  );
  self.skipWaiting();
});

// ACTIVATE (Wipes old historical application versions instantly)
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

// FETCH INTERCEPTOR (Stale-While-Revalidate Strategy for Instant loads + background updates)
self.addEventListener('fetch', (event) => {
  // Ignore external tracking scripts/CDNs to prevent caching bloat
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached item immediately for lightning fast loads
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
        }
        return networkResponse;
      }).catch(() => {
        // Safe cross-route recovery layer
        return caches.match('./index.html');
      });

      return cachedResponse || fetchPromise;
    })
  );
});
