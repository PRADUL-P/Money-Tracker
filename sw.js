const CACHE_NAME = 'ludarp-money-tracker-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));
});

self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=> Promise.all(keys.map(k=> k===CACHE_NAME?null:caches.delete(k)))));
});

self.addEventListener('fetch', e=>{
  if(e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(res=> res || fetch(e.request).catch(()=> caches.match('./'))));
});
