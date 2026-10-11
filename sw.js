// Incrémente VERSION à chaque mise à jour du site pour que les appareils récupèrent les nouveaux fichiers.
const VERSION = 'j80-v3';
const ASSETS = [
  "./",
  "index.html",
  "planning.html",
  "seances.html",
  "progression.html",
  "nutrition.html",
  "recuperation.html",
  "suivi.html",
  "jours.html",
  "charges.html",
  "seance-a.html",
  "seance-b.html",
  "seance-c.html",
  "seance-d.html",
  "js/live.js",
  "css/style.css",
  "js/theme.js",
  "js/pwa.js",
  "js/suivi.js",
  "js/store.js",
  "js/jours.js",
  "js/charges.js",
  "manifest.webmanifest",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png"
];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS))); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))));
});
self.addEventListener('message', (e) => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) =>
    hit || fetch(req).catch(() => (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
