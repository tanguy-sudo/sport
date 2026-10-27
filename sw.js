// Généré par "npm run build" (scripts/build-sw.js) : ne pas éditer entre les marqueurs.
// @generated-start
const VERSION = 'j80-be9ae13c';
const ASSETS = [
  "./",
  "charges.html",
  "css/style.css",
  "data/content.json",
  "data/sessions.json",
  "editeur.html",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "index.html",
  "js/charges.js",
  "js/content.js",
  "js/data.js",
  "js/editeur.js",
  "js/home.js",
  "js/layout.js",
  "js/live-core.js",
  "js/live.js",
  "js/loads-core.js",
  "js/pwa.js",
  "js/seance.js",
  "js/seances.js",
  "js/store.js",
  "js/suivi.js",
  "js/theme.js",
  "manifest.webmanifest",
  "nutrition.html",
  "recuperation.html",
  "seance.html",
  "seances.html",
  "suivi.html"
];
// @generated-end
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS))); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))));
});
self.addEventListener('message', (e) => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

// Stale-while-revalidate : réponse immédiate depuis le cache, puis rafraîchissement en arrière-plan
// (la version suivante de la page est à jour). Les paramètres de requête (?s=a) sont ignorés pour le cache.
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  const key = url.origin + url.pathname;
  e.respondWith(caches.open(VERSION).then(async (cache) => {
    const hit = await cache.match(req, { ignoreSearch: true });
    const refresh = fetch(req).then((res) => { if (res && res.ok) cache.put(key, res.clone()); return res; });
    if (hit) { e.waitUntil(refresh.catch(() => {})); return hit; }
    return refresh.catch(() => (req.mode === 'navigate' ? cache.match('index.html') : Response.error()));
  }));
});