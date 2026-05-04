const CACHE_NAME = 'mondocteur-v1';
const OFFLINE_URL = '/offline';

// Ressources à mettre en cache immédiatement à l'installation
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/logo.png',
  '/pro/dashboard',
  '/pro/patients',
  '/pro/appointments',
  '/pro/ai',
  '/pro/profile',
  '/doctors',
  '/pharmacies',
  '/laboratories',
];

// ── Installation : précache des ressources ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS.map(url => new Request(url, { cache: 'reload' })));
    }).catch(() => {
      // Ignorer les erreurs de précache (certaines URLs peuvent nécessiter auth)
    })
  );
  self.skipWaiting();
});

// ── Activation : nettoyer les vieux caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch : stratégie intelligente selon le type de ressource ──
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-HTTP et les extensions Chrome
  if (!request.url.startsWith('http')) return;

  // API calls → Network First (essayer le réseau, sinon cache ou erreur)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithQueue(request));
    return;
  }

  // Ressources statiques (_next, images, fonts) → Cache First
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/uploads/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf)$/)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Pages → Network First avec fallback cache puis offline
  event.respondWith(networkFirstWithOfflineFallback(request));
});

// Network First — pour les appels API
async function networkFirstWithQueue(request) {
  try {
    const response = await fetch(request.clone());
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Mettre en file d'attente si c'est un POST (données à synchroniser)
    if (request.method === 'POST') {
      await queueRequest(request);
      return new Response(
        JSON.stringify({ offline: true, message: 'Données enregistrées localement. Synchronisation en attente.' }),
        { status: 202, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(JSON.stringify({ error: 'Hors ligne' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Cache First — pour les ressources statiques
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Ressource indisponible hors ligne', { status: 503 });
  }
}

// Network First avec fallback page offline
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offlinePage = await caches.match(OFFLINE_URL);
    return offlinePage || new Response('Hors ligne', { status: 503 });
  }
}

// ── File d'attente pour synchronisation des données POST ──
const QUEUE_KEY = 'mondocteur-sync-queue';

async function queueRequest(request) {
  const body = await request.clone().text().catch(() => '');
  const entry = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body,
    timestamp: Date.now(),
  };

  // Stocker dans IndexedDB via postMessage au client
  const clients = await self.clients.matchAll();
  clients.forEach(client => client.postMessage({ type: 'QUEUE_REQUEST', entry }));
}

// ── Background Sync : envoi des données en attente quand connexion revient ──
self.addEventListener('sync', event => {
  if (event.tag === 'mondocteur-sync') {
    event.waitUntil(syncQueuedRequests());
  }
});

async function syncQueuedRequests() {
  const clients = await self.clients.matchAll();
  clients.forEach(client => client.postMessage({ type: 'SYNC_QUEUE' }));
}

// ── Push notifications (optionnel pour les rappels RDV) ──
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  const title = data.title || 'Mondocteur';
  const options = {
    body: data.body || 'Vous avez une nouvelle notification',
    icon: '/logo.png',
    badge: '/logo.png',
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
