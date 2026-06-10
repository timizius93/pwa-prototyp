// Service Worker — Mess-Sprint-Spike (Offline-Fähigkeit / iOS-7-Tage-Test).
//
// Strategie:
//   - Seiten (Navigationen + RSC-Payloads): Netz zuerst, Cache als Offline-Fallback.
//     So bleibt der Live-Draft-Charakter des Piloten erhalten — gecacht wird nur
//     der zuletzt gesehene Stand.
//   - Statische Next-Assets (/_next/static, content-hashed) + /ads/ + Icons:
//     Cache zuerst (ändern sich pro Build nie unter derselben URL).
//   - Sanity-Bilder (cdn.sanity.io): Cache zuerst. Bild-Requests aus <img> sind
//     no-cors (opaque) — wir fetchen stattdessen mit CORS neu (Sanity-CDN erlaubt
//     das), damit die Cache-Einträge sauber sind und nicht gegen die Quota
//     aufgebläht werden (Browser padden opaque Responses massiv).
//
// Die Cache-Namen teilt sich der SW mit components/OfflineSaver.tsx —
// bei Änderungen BEIDE Dateien anfassen.

const VERSION = 'v1'
const PAGES = `pages-${VERSION}`
const ASSETS = `assets-${VERSION}`
const IMAGES = `images-${VERSION}`
const KNOWN_CACHES = [PAGES, ASSETS, IMAGES]

self.addEventListener('install', (event) => {
  // App-Shell-Minimum: der Kiosk als Einstieg + Fallback.
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.add('/'))
      .catch(() => {}) // Install nie an einem fehlgeschlagenen Precache scheitern lassen
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !KNOWN_CACHES.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

// Netz mit Timeout — sonst hängt „Offline mit 1 Balken Edge" minutenlang,
// statt auf den Cache zu fallen.
function fetchWithTimeout(request, ms) {
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
    return fetch(request, {signal: AbortSignal.timeout(ms)})
  }
  return fetch(request)
}

async function cacheFirst(cacheName, request, corsRefetch) {
  const cache = await caches.open(cacheName)
  const hit = await cache.match(request.url, {ignoreVary: true})
  if (hit) return hit

  // Sanity-Bilder: mit CORS neu anfragen statt der opaque no-cors-Response
  // (sauber cachebar + messbar). Klappt nur, wenn der Origin in der
  // Sanity-CORS-Allowlist steht — sonst opaque als Fallback cachen.
  let response
  if (corsRefetch) {
    try {
      response = await fetch(request.url, {mode: 'cors'})
    } catch (err) {
      response = await fetch(request)
    }
  } else {
    response = await fetch(request)
  }
  if (response.ok || response.type === 'opaque') cache.put(request.url, response.clone()).catch(() => {})
  return response
}

async function networkFirst(cacheName, request, fallbackUrl) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetchWithTimeout(request, 8000)
    if (response.ok) cache.put(request.url, response.clone()).catch(() => {})
    return response
  } catch (err) {
    // ignoreVary: das HTML wurde vom OfflineSaver ohne RSC-Header gefetcht,
    // die Navigation fragt mit anderen Headern an — der URL-Match reicht uns.
    const hit = await cache.match(request.url, {ignoreVary: true})
    if (hit) return hit
    if (fallbackUrl) {
      const fallback = await cache.match(fallbackUrl, {ignoreVary: true})
      if (fallback) return fallback
    }
    throw err
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Sanity-Bilder
  if (url.hostname === 'cdn.sanity.io') {
    event.respondWith(cacheFirst(IMAGES, request, true).catch(() => fetch(request)))
    return
  }

  if (url.origin !== self.location.origin) return

  // Statische Assets (content-hashed bzw. unveränderlich)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/ads/') ||
    url.pathname.startsWith('/icon') ||
    url.pathname === '/apple-icon.png' ||
    url.pathname === '/manifest.webmanifest'
  ) {
    event.respondWith(cacheFirst(ASSETS, request, false).catch(() => fetch(request)))
    return
  }

  // Seiten-Navigationen + Next-Router-Payloads (?_rsc=…)
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(PAGES, request, '/'))
    return
  }
  if (url.searchParams.has('_rsc')) {
    // Offline schlägt das fehl → Next macht eine harte Navigation → die landet
    // oben im navigate-Zweig und wird aus dem Cache bedient.
    event.respondWith(networkFirst(PAGES, request, null).catch(() => Response.error()))
  }
})
