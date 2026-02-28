var CACHE_NAME = 'civicverify-v2';
var OFFLINE_URL = '/offline.html';
var PRECACHE_URLS = ['/', '/offline.html', '/icons/icon-192x192.png', '/icons/icon-512x512.png'];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.filter(function(n) { return n !== CACHE_NAME; }).map(function(n) { return caches.delete(n); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  var url = event.request.url;
  if (url.includes('supabase') || url.includes('/api/') || url.includes('auth')) return;
  event.respondWith(
    fetch(event.request).then(function(response) {
      if (response.ok) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
      }
      return response;
    }).catch(function() {
      return caches.match(event.request).then(function(cached) {
        if (cached) return cached;
        if (event.request.mode === 'navigate') return caches.match(OFFLINE_URL);
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

self.addEventListener('push', function(event) {
  var data = { title: 'CivicVerify', body: 'You have a new notification', icon: '/civicverifyicon.png' };
  if (event.data) { try { data = event.data.json(); } catch (e) { data.body = event.data.text(); } }
  event.waitUntil(
    self.registration.showNotification(data.title || 'CivicVerify', {
      body: data.body || '',
      icon: data.icon || '/civicverifyicon.png',
      badge: '/civicverifyicon.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || data.link || '/citizen' },
      tag: data.tag || 'civicverify-notification',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/citizen';
  if (url.startsWith('/')) url = self.location.origin + url;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (var i = 0; i < windowClients.length; i++) {
        if (windowClients[i].url.includes('civicverify') && 'focus' in windowClients[i]) {
          windowClients[i].navigate(url);
          return windowClients[i].focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
