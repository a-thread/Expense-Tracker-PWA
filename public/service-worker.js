const CACHE_NAME = "static-cache-v1";
const DATA_CACHE_NAME = "data-cache-v1";

const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/index.js',
    '/manifest.webmanifest',
    '/styles.css',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// install
self.addEventListener("install", function (evt) {
    // pre cache all static assets
    evt.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    // activating once installed
    self.skipWaiting();
});

// activate
self.addEventListener("activate", function (evt) {
    evt.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log("Removing old cache data", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

// fetch
self.addEventListener('fetch', function (evt) {
    const { url } = evt.request;
    if (url.includes("/transaction")) {
        evt.respondWith(
            caches.open(DATA_CACHE_NAME).then((cache) => {
                return fetch(evt.request)
                    .then((response) => {
                        // if the response is good, clone it and store it in the cache
                        if (response.status === 200) {
                            cache.put(evt.request, response.clone());
                        }

                        return response;
                    })
                    // if network request fails, try to get it from the cache
                    .catch((err) => {
                        return cache.match(evt.request);
                    });
            }).catch((err) => console.log(err))
        );
    } else {
        // respond from static cache, request is not for /api/
        evt.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(evt.request).then((response) => {
                    return response || fetch(evt.request);
                });
            })
        );
    }
});