const CACHE_NAME = 'sheets-pwa-shell-v1';

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            cache.addAll([
                self.registration.scope,
                `${self.registration.scope}index.html`,
                `${self.registration.scope}manifest.json`
            ])
        )
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
