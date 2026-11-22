const CACHE = 'stableford-card-v1';
const ASSETS = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    // Pages: try the network first so updates arrive, fall back to the saved copy offline.
    e.respondWith(fetch(req).catch(() => caches.match('index.html')));
    return;
  }
  // Everything else: saved copy first, then network, and keep what the network returns.
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res && (res.status === 200 || res.type === 'opaque')) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }))
  );
});
