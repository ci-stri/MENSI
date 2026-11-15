// Offline-Betrieb: Netz zuerst (damit Updates sofort ankommen), sonst aus dem Zwischenspeicher.
// Neue Dateien der App hier eintragen und VERSION erhöhen.
const VERSION = 'mensi-6';
const DATEIEN = [
  './',
  'index.html',
  'css/mensi.css',
  'js/app.js',
  'js/db.js',
  'js/logik.js',
  'js/kalender.js',
  'js/features/schmerz.js',
  'js/features/medikamente.js',
  'manifest.webmanifest',
  'icons/icon-180.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== VERSION).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const anfrage = e.request;
  if (anfrage.method !== 'GET' || new URL(anfrage.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(anfrage)
      .then((antwort) => {
        if (antwort.ok) {
          const kopie = antwort.clone();
          caches.open(VERSION).then((c) => c.put(anfrage, kopie));
        }
        return antwort;
      })
      .catch(() => caches.match(anfrage, { ignoreSearch: true }).then((treffer) => treffer || caches.match('index.html'))),
  );
});
