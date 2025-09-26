// sw.js

const CACHE_NAME = 'notanaliz-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.css',
  '/index.js',
  '/manifest.json',
  // İkonları da önbelleğe ekleyin (gerçek yollarını doğrulayın)
  // '/icons/icon-192.png',
  // '/icons/icon-512.png'
];

// Yükleme (Install) olayı: Çekirdek dosyaları önbelleğe alır.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Etkinleştirme (Activate) olayı: Eski önbellekleri temizler.
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Getirme (Fetch) olayı: Önbellekten yanıt verir veya ağa yönlendirir.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Önbellekte varsa, oradan döndür.
        if (response) {
          return response;
        }
        // Önbellekte yoksa, ağdan getirmeye çalış.
        return fetch(event.request);
      }
    )
  );
});
