const CACHE_NAME = 'horario-saida-cache-v2';
const urlsToCache = [
  '/AppCalculoHoras/',
  '/AppCalculoHoras/index.html',
  '/AppCalculoHoras/styles.css',
  '/AppCalculoHoras/script.js',
  '/AppCalculoHoras/icon.png' // Adicionado para evitar erros de fetch
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.hostname.includes('firebaseio.com')) {
    console.log('Ignorando requisição ao Firebase:', requestUrl);
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return networkResponse;
        }).catch(() => {
          console.log('Erro de rede ao buscar:', event.request.url);
          return caches.match('/AppCalculoHoras/index.html'); // Fallback
        });
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  console.log('Mensagem recebida do cliente:', event.data);
  if (event.data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(event.data.title, {
      body: event.data.body,
      icon: event.data.icon || '/AppCalculoHoras/icon.png',
      vibrate: [200, 100, 200]
    })
      .then(() => console.log('Notificação exibida com sucesso'))
      .catch(err => console.error('Erro ao mostrar notificação:', err));
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow('/AppCalculoHoras/');
      }
    })
  );
});