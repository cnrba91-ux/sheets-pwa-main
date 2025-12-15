const CACHE_VERSION = 'v2';
const STATIC_CACHE = `sheets-pwa-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `sheets-pwa-dynamic-${CACHE_VERSION}`;

// Static assets to cache on install
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting()) // Activate immediately
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Take control immediately
    );
});

// Fetch event - smart caching strategy
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip caching for Google APIs and external requests
    if (!url.origin.includes(self.location.origin) &&
        (url.hostname.includes('googleapis.com') ||
            url.hostname.includes('google.com') ||
            url.hostname.includes('accounts.google.com'))) {
        event.respondWith(fetch(request));
        return;
    }

    // Network-first strategy for HTML files (ensures fresh content)
    if (request.headers.get('accept').includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Clone and cache the response
                    const responseClone = response.clone();
                    caches.open(DYNAMIC_CACHE).then(cache => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(request);
                })
        );
        return;
    }

    // Cache-first strategy for static assets (CSS, JS, images, fonts)
    if (request.url.match(/\.(css|js|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot)$/)) {
        event.respondWith(
            caches.match(request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return fetch(request).then(response => {
                        // Cache the new asset
                        const responseClone = response.clone();
                        caches.open(STATIC_CACHE).then(cache => {
                            cache.put(request, responseClone);
                        });
                        return response;
                    });
                })
        );
        return;
    }

    // Network-first for everything else (API calls, etc.)
    event.respondWith(
        fetch(request)
            .catch(() => caches.match(request))
    );
});
