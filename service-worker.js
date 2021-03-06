var cacheName = 'currencyConverter-v1';
var apiCacheName = 'currencyConverter-api-v1';

var filesToCache = [
  '/',
  'manifest.json',
  'css/app.css',
  'css/materialize.min.css',
  'js/app.js',
  'js/jquery-3.2.1.min.js',
  'js/materialize.min.js',
  'js/app.js',
  'fonts/roboto/Roboto-Regular.woff',
  'fonts/roboto/Roboto-Regular.woff2',
  'fonts/roboto/Roboto-Bold.woff',
  'https://fonts.googleapis.com/icon?family=Material+Icons'
];

self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName && key !== apiCacheName) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  console.log('[ServiceWorker] Fetch', e.request.url);
  var dataUrl = 'https://free.currencyconverterapi.com/api/v5/';
  if (e.request.url.indexOf(dataUrl) > -1) {
	e.respondWith(
      caches.open(apiCacheName).then(function(cache) {
        return fetch(e.request).then(function(response){
          cache.put(e.request.url, response.clone());
          return response;
        });
      })
    );
 }else {
	e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
 }
});

self.addEventListener('message', function (e) {
  if (e.data.action == 'skipWaiting') {
      self.skipWaiting();
  }
});
