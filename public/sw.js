// Service worker: keeps the app usable offline (crisis tools must open without a connection).
// Network first, so a new deploy shows up right away when online; cache as the fallback.
const CACHE = 'dbt-app-v8';
const SHELL = [
  '/',
  '/index.html',
  '/css/app.css',
  '/js/app.js',
  '/js/dom.js',
  '/js/store.js',
  '/js/content.js',
  '/js/crisis.js',
  '/js/pages.js',
  '/js/forms.js',
  '/js/emotion.js',
  '/js/emotions.js',
  '/js/content-er.js',
  '/js/content-mf.js',
  '/js/phase3.js',
  '/js/opposite.js',
  '/js/talk.js',
  '/js/content-ie.js',
  '/js/content-gd.js',
  '/js/phase5.js',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        }
        // Server error (e.g. a brief Cloudflare 5xx): prefer the cached copy if we have one.
        return caches.match(req).then((hit) => hit || res);
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('/index.html')))
  );
});
