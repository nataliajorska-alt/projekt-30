const CACHE_NAME = 'p30-v12-archiwum';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([
      OFFLINE_URL,
      '/manifest.json',
    ]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Powiadomienia — harmonogram przez postMessage ────────────────
// Klient wysyła: { type: 'SCHEDULE_REMINDERS', prefs, labels }

let _scheduledTimers = [];

self.addEventListener('message', (event) => {
  if (!event.data) return;

  // ── Standardowe przypomnienia ────────────────────────────────────
  if (event.data.type === 'SCHEDULE_REMINDERS') {
    const { prefs, labels } = event.data;

    _scheduledTimers.forEach((id) => clearTimeout(id));
    _scheduledTimers = [];

    if (!prefs) return;

    const types = ['morning', 'evening', 'quest'];
    const now = new Date();

    for (const type of types) {
      const cfg = prefs[type];
      if (!cfg || !cfg.enabled) continue;

      const target = new Date();
      target.setHours(cfg.hour, cfg.minute, 0, 0);
      const msUntil = target.getTime() - now.getTime();

      if (msUntil > 0) {
        const label = labels?.[type];
        const timerId = setTimeout(() => {
          self.registration.showNotification(label?.title ?? 'Projekt 30', {
            body: label?.body ?? 'Czas na działanie.',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: `projekt30-${type}`,
            renotify: false,
          });
        }, msUntil);
        _scheduledTimers.push(timerId);
      }
    }
    return;
  }

  // ── Safe Hours — ostrzeżenia prewencyjne ─────────────────────────
  if (event.data.type === 'SCHEDULE_SAFE_HOURS') {
    const { windows } = event.data;
    if (!windows || !windows.length) return;

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    for (const w of windows) {
      const targetMinutes = w.hourStart * 60 - 30;   // 30 min przed oknem
      const msUntil = (targetMinutes - nowMinutes) * 60 * 1000;

      if (msUntil > 0) {
        const timerId = setTimeout(() => {
          self.registration.showNotification('🕯️ Safe Hours', {
            body: 'Za pół godziny zaczyna się Twoja trudna pora. Masz plan?',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: `projekt30-safehours-${w.hourStart}`,
            renotify: true,
          });
        }, msUntil);
        _scheduledTimers.push(timerId);
      }
    }
    return;
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow('/');
    })
  );
});

// ── Fetch (cache strategy, bez zmian) ───────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, Firebase, and API requests
  if (request.method !== 'GET') return;
  if (url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firestore.googleapis.com') ||
      url.pathname.startsWith('/api/')) return;

  // Navigation requests: network-first, fallback to offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Static assets: cache-first
  if (url.pathname.startsWith('/_next/static/') ||
      url.pathname.match(/\.(png|jpg|jpeg|svg|ico|woff2?)$/) ||
      url.hostname === 'fonts.googleapis.com' ||
      url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Everything else: network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
