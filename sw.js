/* Bibi Quizz — service worker.
 *
 * RÉSEAU D'ABORD pour le code (HTML/CSS/JS), cache en secours hors-ligne.
 * Leçon de Bibi Love : en cache-first, un navigateur ayant ouvert l'app une fois
 * garde l'ancien code pour toujours et aucun correctif ne l'atteint.
 * Polices et images : cache d'abord (contenu immuable).
 * On ne touche qu'aux GET de notre origine : intercepter le SDK Firebase lui ferait
 * recevoir index.html à la place d'un module (« MIME type text/html »).
 */
const VERSION = 'v3';
const CACHE   = 'bibi-quizz-' + VERSION;

const SHELL = [
  './', './index.html', './css/style.css',
  './js/discovery.js', './js/entry.js', './js/app.js', './js/host.js', './js/player.js', './js/store.js', './js/game.js',
  './js/util.js', './js/firebase.js', './js/config.js', './js/plan.js', './js/live.js',
  './js/data/questions.js', './js/data/extension.js',
  './manifest.webmanifest', './icons/icon.svg',
  './vendor/fontawesome/fa.css', './vendor/fontawesome/fa-solid-subset.woff2'
];
const IMMUABLE = /\.(woff2|woff|ttf|png|svg|jpg|jpeg|webp)$/i;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => null))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('bibi-quizz-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (IMMUABLE.test(url.pathname)) {
    e.respondWith(caches.match(e.request).then(hit => hit || fetchAndCache(e.request)));
    return;
  }
  e.respondWith(fetchAndCache(e.request).catch(() =>
    caches.match(e.request).then(hit =>
      hit || (e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
function fetchAndCache(request) {
  return fetch(request).then(res => {
    if (res && res.ok) { const clone = res.clone(); caches.open(CACHE).then(c => c.put(request, clone)); }
    return res;
  });
}
