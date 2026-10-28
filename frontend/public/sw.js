// AgriMarket Progressive Web App Service Worker
// Version: 1.1.0 - Auth-Aware Cache Isolation

const STATIC_CACHE_NAME = 'agrimarket-static-v1';
const OFFLINE_URL = '/offline';

// Whitelisted public static assets for pre-caching
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/images/signup_landscape_hero.jpg',
];

// Routes that contain authenticated user data and MUST NEVER be cached
const PRIVATE_ROUTE_PREFIXES = [
  '/dashboard',
  '/onboarding',
  '/admin',
  '/orders',
  '/profile',
  '/messages',
  '/settings',
  '/worker',
  '/farmer',
  '/buyer',
];

// Public navigation routes that are safe to cache for offline access
const PUBLIC_CACHEABLE_NAV_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/verify-otp',
  '/forgot-password',
  '/reset-password',
  '/offline',
];

// Install Event: Pre-cache static shell & offline fallback
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Event: Auth-aware caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. STRICT SECURITY RULE: Never cache API endpoints, Auth handlers, or WebSockets
  if (
    url.pathname.startsWith('/api/') ||
    request.method !== 'GET' ||
    url.protocol.startsWith('ws') ||
    request.headers.get('upgrade') === 'websocket'
  ) {
    return; // Pass through to browser network layer
  }

  // 2. HTML Page Navigation Handling
  if (request.mode === 'navigate') {
    const isPrivate = PRIVATE_ROUTE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));

    if (isPrivate) {
      // SECURITY REQUIREMENT: Never cache private user dashboards or order data!
      // Always fetch directly from network; fall back to generic /offline page if disconnected.
      event.respondWith(
        fetch(request, { cache: 'no-store' }).catch(async () => {
          const offlineFallback = await caches.match(OFFLINE_URL);
          if (offlineFallback) return offlineFallback;
          return new Response('Network offline. Please reconnect to access your account.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          });
        })
      );
      return;
    }

    // Public navigation route (Home, Login, Signup, Offline)
    const isPublicCacheable = PUBLIC_CACHEABLE_NAV_ROUTES.some(
      (route) => url.pathname === route || url.pathname === route + '/'
    );

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200 && isPublicCacheable) {
            const clone = response.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;

          const offlineFallback = await caches.match(OFFLINE_URL);
          if (offlineFallback) return offlineFallback;

          return new Response('You are currently offline.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          });
        })
    );
    return;
  }

  // 3. Static Assets (Images, Styles, Scripts, Fonts): Stale-While-Revalidate
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/fonts/') ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style' ||
    request.destination === 'script'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
