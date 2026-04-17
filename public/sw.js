// RentNestle Service Worker
// Provides offline support and caches static assets

const CACHE_NAME = 'rentnesttle-v1'
const STATIC_ASSETS = [
  '/',
  '/search',
  '/auth/login',
  '/manifest.json',
]

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate: remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch strategy:
// - API calls → Network first, no cache
// - Static assets → Cache first, fallback to network
// - Images → Cache first (saves data for mobile users)
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Never cache API calls or Supabase
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(fetch(request))
    return
  }

  // Cache-first for images (property photos)
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return response
        })
      })
    )
    return
  }

  // Network-first for HTML pages (always fresh)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    )
    return
  }

  // Cache-first for everything else (JS, CSS)
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  )
})

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-inquiry') {
    event.waitUntil(syncPendingInquiries())
  }
})

async function syncPendingInquiries() {
  // TODO: retrieve pending inquiries from IndexedDB and POST them
  console.log('[SW] Syncing pending inquiries...')
}
