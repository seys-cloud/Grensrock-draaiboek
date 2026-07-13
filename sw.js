/* Grensrock Draaiboek - network-first met timeout: nieuwste versie als er netwerk is,
   snelle cache-fallback op traag/kapot festivalnetwerk */
const CACHE = 'grensrock-draaiboek-v5';
const ASSETS = ['./','./index.html','./editor.html','./mobiel.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./plattegrond.jpg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(()=>self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
function fetchMetTimeout(req, ms){
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('timeout')), ms);
    fetch(req).then(r => { clearTimeout(t); res(r); }, err => { clearTimeout(t); rej(err); });
  });
}
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetchMetTimeout(e.request, 5000).then(res => {
      /* enkel geslaagde (of opaque cross-origin) antwoorden cachen — geen 404's e.d. */
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    })
    .catch(() => caches.match(e.request).then(hit => hit || (e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
