const CACHE_NAME = 'intermaster-v4';
const APP_PAGE = './1InterMaster.html';

const APP_SHELL = [
  APP_PAGE,
  './manifest.webmanifest',
  './intermaster-icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(APP_SHELL.map(url => cache.add(url).catch(() => null))))
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

function offlineResponse() {
  return new Response(
    '<!doctype html><html lang="fr"><meta charset="utf-8"><title>InterMaster</title><body><h1>InterMaster est hors ligne</h1><p>Rechargez la page quand la connexion revient.</p></body></html>',
    {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    }
  );
}

function cachedAppPage() {
  return caches.match(APP_PAGE).then(response => response || offlineResponse());
}

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET') {
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
                .then(cache => cache.put(APP_PAGE, copy))
                .catch(() => {})
            );
          }
          return response;
        })
        .catch(() => cachedAppPage())
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
        .catch(() => cached || new Response('', { status: 504 }));

      return cached || fetchPromise;
    })
  );
});
