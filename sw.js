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
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// FETCH (🔥 FIX 404 PWA)
self.addEventListener('fetch', event => {

  // 👉 IMPORTANT : gérer ouverture app (évite 404 GitHub)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html')
        .then(res => res || fetch('./index.html'))
    );
    return;
  }

  // 👉 cache classique
  event.respondWith(
    caches.match(event.request)
      .then(res => res || fetch(event.request))
  );

});
