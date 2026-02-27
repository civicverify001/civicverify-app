// CivicVerify Service Worker
var CACHE_NAME = 'civicverify-v1';
var OFFLINE_URL = '/offline.html';

// Files to cache on install
var PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install — precache essential files
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

// Activate — clean up old caches
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (name) { return name !== CACHE_NAME; })
          .map(function (name) { return caches.delete(name); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// Fetch — network-first with cache fallback
self.addEventListener('fetch', function (event) {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip API calls and Supabase requests
  var url = event.request.url;
  if (url.includes('supabase') || url.includes('/api/') || url.includes('auth')) return;

  event.respondWith(
    fetch(event.request).then(function (response) {
      // Cache successful responses
      if (response.ok) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, clone);
        });
      }
      return response;
    }).catch(function () {
      // Offline — try cache
      return caches.match(event.request).then(function (cached) {
        if (cached) return cached;
        // If navigating, show offline page
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Push notifications
self.addEventListener('push', function (event) {
  var data = event.data ? event.data.json() : {};
  var title = data.title || 'CivicVerify';
  var options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  if (event.action === 'dismiss') return;
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
// ============================================================
// ADD THIS to your existing service worker file (public/sw.js)
// Paste at the BOTTOM of your existing sw.js
// ============================================================

// Listen for push notifications
self.addEventListener('push', function(event) {
  var data = { title: 'CivicVerify', body: 'You have a new notification', icon: '/civicverifyicon.png' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  var options = {
    body: data.body || '',
    icon: data.icon || '/civicverifyicon.png',
    badge: '/civicverifyicon.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || data.link || '/citizen',
    },
    actions: data.actions || [],
    tag: data.tag || 'civicverify-notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'CivicVerify', options)
  );
});

// Handle notification click — open the app to the right page
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  var url = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : '/citizen';

  // If it's a relative URL, make it absolute
  if (url.startsWith('/')) {
    url = self.location.origin + url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      // Try to focus an existing tab
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url.includes('civicverify.org') && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open a new window if none found
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});