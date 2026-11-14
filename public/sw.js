const CACHE_NAME = 'p30-v28-offline';
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

// ── Nawigacja offline ────────────────────────────────────────────
// Ile czekamy na sieć, gdy mamy już zapisaną wersję strony („niby jest zasięg,
// a nic nie idzie"). Bez zapisanej wersji czekamy do skutku.
const NAV_TIMEOUT_MS = 4000;

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

async function handleNavigate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch: true });
  try {
    const response = await (cached ? withTimeout(fetch(request), NAV_TIMEOUT_MS) : fetch(request));
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    if (cached) return cached;
    // Strona nieodwiedzona wcześniej: zamiast ekranu awaryjnego wróć na „Dziś",
    // jeśli jest zapisane (stamtąd działa reszta apki).
    const home = await cache.match('/');
    if (home && new URL(request.url).pathname !== '/') return Response.redirect('/', 302);
    return (await caches.match(OFFLINE_URL)) || Response.error();
  }
}

// ── Fetch ────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, Firebase, and API requests
  if (request.method !== 'GET') return;
  // Fonty Google (arkusz z fonts.googleapis.com) MUSZĄ przejść dalej do cache —
  // wcześniej łapało je ogólne „googleapis.com" i offline apka traciła kroje.
  const isFontHost = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!isFontHost && (
      url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('cloudinary.com') ||
      url.pathname.startsWith('/api/'))) return;

  // Nawigacja: najpierw sieć (świeża wersja apki), a bez zasięgu — ostatnia
  // zapisana wersja TEJ strony. Dane dnia są w pamięci urządzenia (Firestore),
  // więc apka otwiera się i pozwala odhaczać offline; zapisy doślą się same.
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigate(request));
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
          // Tylko udane odpowiedzi — zapisany 404/500 dla pliku JS psułby apkę
          // do następnej zmiany nazwy cache. (opaque = fonty z innej domeny)
          if (response.ok || response.type === 'opaque') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
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
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
