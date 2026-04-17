const CACHE_NAME = 'intermaster-v2';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './intermaster-icon.svg'
];

// INSTALL
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ACTIVATE
self.addEventListener('fetch', event => {

  // 👉 NAVIGATION (page principale) = TOUJOURS DERNIÈRE VERSION
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch('./index.html')
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 👉 AUTRES FICHIERS = stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then(cached => {

      const fetchPromise = fetch(event.request).then(networkResponse => {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );

});
