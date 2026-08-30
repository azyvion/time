const CACHE_NAME = 'time-azv-v2';
const ASSETS = [
  './',
  './index.html',
  './login.html',
  './manifest.json',
  './logo.jpg',
  './logo-192.png',
  './logo-512.png'
];

// ── Instalar: pre-cachear todos los assets ──
self.addEventListener('install', event => {
  self.skipWaiting(); // Activa el SW inmediatamente sin esperar
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// ── Activar: limpiar cachés viejos y tomar control ──
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Eliminar cachés obsoletos
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      ),
      // Tomar control de todas las páginas inmediatamente
      self.clients.claim()
    ])
  );
});

// ── Fetch: Network First → Cache Fallback ──
self.addEventListener('fetch', event => {
  // Solo interceptar peticiones GET del mismo origen
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  // No interceptar peticiones a APIs externas (Google Apps Script)
  if (!url.origin.includes(self.location.hostname) && !url.hostname.includes('github')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la respuesta es válida, actualizar la caché
        if (response && response.status === 200 && response.type !== 'opaque') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
