// network first so a new deploy always wins, the cache only keeps the app working offline
const CACHE = 'passionindicator-v1';
const CACHED_ORIGINS = [self.location.origin, 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || !CACHED_ORIGINS.includes(new URL(request.url).origin)) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok || response.type === 'opaque') {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then(hit => hit || (request.mode === 'navigate' ? caches.match('/') : Response.error())))
  );
});
