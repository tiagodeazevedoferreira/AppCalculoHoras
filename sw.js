const CACHE_NAME = 'horario-saida-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto, adicionando recursos:', urlsToCache);
        return cache.addAll(urlsToCache).catch(err => {
          console.error('Erro ao adicionar recursos ao cache:', err);
        });
      })
  );
});

self.addEventListener('fetch', event => {
  // Ignorar requisições à API do GitHub
  if (event.request.url.includes('api.github.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request).catch(err => {
          console.error('Erro ao buscar recurso:', err);
        });
      })
  );
});