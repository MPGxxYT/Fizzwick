// Fizzwick's service worker. The build fills in VERSION and PRECACHE (see
// vite.config.ts) and writes this file to the site root as /sw.js.
//
// Install: cache everything the app needs, so it works offline after one
// visit. Pages (including Riff links) try the network first, so a launch
// after a deploy gets the new version, and fall back to the cached app when
// offline. Everything else comes from the cache first: the bundle's file
// names change with their contents, so a cached copy is never stale.
const VERSION = '__VERSION__'
const PRECACHE = __PRECACHE__
const CACHE = `fizzwick-${VERSION}`
const APP = '/index.html'
// How long a page load waits for the network before using the cached app.
const NETWORK_WAIT_MS = 3000
// Servers often send Vary: Origin, which would stop a cached file from
// matching a request that carries a different Origin header. The files here
// are the same either way.
const MATCH = { ignoreVary: true }

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

// The new version takes over at once and the old caches go.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return
  event.respondWith(request.mode === 'navigate' ? page(request) : file(request))
})

async function page(request) {
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error('slow network')), NETWORK_WAIT_MS)),
    ])
    if (response.ok) {
      // Every page is the app, so this keeps the cached app current.
      const cache = await caches.open(CACHE)
      await cache.put(APP, response.clone())
      return response
    }
  } catch {
    // Offline or slow: the cached app below.
  }
  return (await caches.match(APP, MATCH)) ?? fetch(request)
}

async function file(request) {
  const cached = await caches.match(request, MATCH)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(CACHE)
    await cache.put(request, response.clone())
  }
  return response
}
