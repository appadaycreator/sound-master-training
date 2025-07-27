const CACHE_NAME = 'sound-master-v1.0.0';

// Determine base path for caching
const isGitHubPages = self.location.hostname === 'appadaycreator.github.io';
const basePath = isGitHubPages ? '/sound-master-training' : '';

const urlsToCache = [
  `${basePath}/`,
  `${basePath}/index.html`,
  `${basePath}/lp.html`,
  `${basePath}/how-to-use.html`,
  `${basePath}/terms.html`,
  `${basePath}/privacy.html`,
  `${basePath}/contact.html`,
  `${basePath}/function.html`,
  `${basePath}/assets/css/style.css`,
  `${basePath}/assets/css/responsive.css`,
  `${basePath}/assets/css/theme.css`,
  `${basePath}/assets/js/app.js`,
  `${basePath}/assets/js/audio-engine.js`,
  `${basePath}/assets/js/training.js`,
  `${basePath}/assets/js/game.js`,
  `${basePath}/assets/js/statistics.js`,
  `${basePath}/assets/js/settings.js`,
  `${basePath}/assets/js/i18n.js`,
  `${basePath}/assets/js/storage.js`,
  `${basePath}/assets/images/favicon.svg`,
  `${basePath}/assets/images/ogp.jpg`,
  `${basePath}/modules/basic-training.html`,
  `${basePath}/modules/chord-training.html`,
  `${basePath}/modules/rhythm-training.html`,
  `${basePath}/modules/memory-training.html`,
  `${basePath}/modules/achievements.html`
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Cache failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Serving from cache:', event.request.url);
          return response;
        }
        
        console.log('Service Worker: Fetching from network:', event.request.url);
        return fetch(event.request).then(fetchResponse => {
          // Check if we received a valid response
          if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
            return fetchResponse;
          }

          // Clone the response as it can only be consumed once
          const responseToCache = fetchResponse.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return fetchResponse;
        });
      })
      .catch(error => {
        console.error('Service Worker: Fetch failed:', error);
        // You can return a fallback page here
        if (event.request.destination === 'document') {
          return caches.match(`${basePath}/index.html`);
        }
      })
  );
});

// Handle background sync (optional)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    // Handle background synchronization
  }
});

// Handle push notifications (optional)
self.addEventListener('push', event => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from サウンドマスター',
    icon: '/assets/images/favicon.svg',
    badge: '/assets/images/favicon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'アプリを開く',
        icon: '/assets/images/favicon.svg'
      },
      {
        action: 'close',
        title: '閉じる'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('サウンドマスター', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('Service Worker: Script loaded successfully'); 