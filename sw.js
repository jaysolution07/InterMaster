const CACHE_NAME = 'intermaster-v3';

const APP_SHELL = [
  './1InterMaster.html',
  './manifest.webmanifest',
  './intermaster-icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function canCache(request, response) {
  const url = new URL(request.url);

  return request.method === 'GET'
    && url.origin === self.location.origin
    && response
    && response.ok
    && response.type === 'basic';
}

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (canCache(request, response)) {
            const copy = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME)
                .then(cache => cache.put('./1InterMaster.html', copy))
                .catch(() => {})
            );
          }
          return response;
        })
        .catch(() => caches.match('./1InterMaster.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const fetchPromise = fetch(request)
        .then(response => {
          if (canCache(request, response)) {
            const copy = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME)
                .then(cache => cache.put(request, copy))
                .catch(() => {})
            );
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
