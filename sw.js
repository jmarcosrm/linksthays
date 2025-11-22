const CORE_CACHE = 'core-v1';
const IMG_CACHE = 'img-v1';
const CORE_ASSETS = ['/', '/index.html', '/styles.css', '/script.js'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CORE_CACHE).then((c) => c.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => ![CORE_CACHE, IMG_CACHE].includes(k)).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js') || url.pathname === '/') {
      e.respondWith(caches.open(CORE_CACHE).then((c) => c.match(req).then((hit) => {
        const fetcher = fetch(req).then((res) => { c.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || fetcher;
      })));
      return;
    }
  }
  if (/i\.im\.ge|fonts\.gstatic\.com|fonts\.googleapis\.com/.test(url.host)) {
    e.respondWith(caches.open(IMG_CACHE).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => { c.put(req, res.clone()); return res; }))));
    return;
  }
});