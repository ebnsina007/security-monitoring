// Avicenna Security PWA Service Worker
const CACHE_NAME = "avicenna-sec-cache-v2";
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json",
  "/favicon.ico"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // برای فراخوانی‌های API اجازه عبور آنلاین می‌دهیم
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ offline: true, message: "ارتباط آفلاین است" }),
          { headers: { "Content-Type": "application/json" } }
        );
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).catch(() => {
          return caches.match("/");
        })
      );
    })
  );
});
