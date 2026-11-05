// public/events-sw.js
// Minimal, honest service worker for the faculty Campus Events PWA:
// - caches the app shell so the installed app opens even with no signal
// - serves a cached copy of the faculty home-feed API when offline, so the
//   assigned-events list is still visible (data may be stale; the UI's own
//   online/offline banner tells the user that)
// - does NOT fake offline mutations: POST/PUT/DELETE requests (draft saves,
//   evidence uploads, submissions) are left to the network and to the
//   client-side localStorage queue in EventReportForm.tsx, which retries
//   them on the browser's 'online' event. True Background Sync API support
//   is inconsistent across iOS/Android browsers, so this app does not rely
//   on it — the explicit retry-on-reconnect queue is the documented,
//   cross-platform substitute.
const CACHE_NAME = 'campus-events-shell-v1';
const APP_SHELL = ['/', '/events-manifest.webmanifest'];
const API_CACHE_PATTERNS = [/\/api\/events\/faculty\/home$/, /\/api\/events\/faculty\/[^/]+$/];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // never intercept mutating requests

  const isApiReadToCache = API_CACHE_PATTERNS.some((re) => re.test(request.url));

  if (isApiReadToCache) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/').then((r) => r || Response.error()))
    );
  }
});
