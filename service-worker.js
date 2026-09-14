'use strict';

const CACHE_NAME = 'djkreobass-v3';
const PRECACHE_URLS = [
  './',
  './index.html',
  './admin.html',
  './manifest.json',
  './admin-manifest.json',
  './assets/css/style.css',
  './assets/css/admin.css',
  './assets/js/script.js',
  './assets/js/firebase-config.js',
  './data/data.json',
  './assets/images/logo.png',
  './assets/images/hero.png',
  './assets/images/icons/icon-192.png',
  './assets/images/icons/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

/* Réseau en priorité (le site est en développement actif) : garantit que chaque
   visite affiche la dernière version déployée ; le cache ne sert que de secours
   hors-ligne, jamais de version obsolète pendant que le réseau fonctionne. */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
