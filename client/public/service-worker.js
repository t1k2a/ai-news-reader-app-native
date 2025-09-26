const STATIC_CACHE_NAME = "ai-news-static-v3";
const RUNTIME_CACHE_NAME = "ai-news-runtime-v3";
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  OFFLINE_URL,
  "/pwa-icons/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter(
            (cacheName) =>
              cacheName !== STATIC_CACHE_NAME && cacheName !== RUNTIME_CACHE_NAME
          )
          .map((cacheName) => caches.delete(cacheName))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstForPage(request));
    return;
  }

  const requestUrl = new URL(request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (PRECACHE_URLS.includes(requestUrl.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (
    requestUrl.pathname.startsWith("/assets/") ||
    request.destination === "script" ||
    request.destination === "style"
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (request.destination === "image" || request.destination === "font") {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFallingBackToCache(request));
});

async function networkFirstForPage(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(STATIC_CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (_error) {
    const cachedMatch = await caches.match(request);
    if (cachedMatch) {
      return cachedMatch;
    }
    const cachedOffline = await caches.match(OFFLINE_URL);
    if (cachedOffline) {
      return cachedOffline;
    }
    const cachedIndex = await caches.match("/index.html");
    if (cachedIndex) {
      return cachedIndex;
    }
    throw _error;
  }
}

function cacheFirst(request) {
  return caches.match(request).then((cached) => cached || fetch(request));
}

function networkFallingBackToCache(request) {
  return fetch(request).catch(() => caches.match(request));
}

function staleWhileRevalidate(request) {
  return caches.match(request).then((cached) => {
    const fetchPromise = fetch(request)
      .then((response) => {
        if (shouldCacheResponse(response)) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => undefined);

    if (cached) {
      void fetchPromise;
      return cached;
    }

    return fetchPromise.then(
      (response) => response || caches.match(request) || caches.match(OFFLINE_URL)
    );
  });
}

function shouldCacheResponse(response) {
  return (
    response &&
    response.status === 200 &&
    (response.type === "basic" || response.type === "cors")
  );
}
