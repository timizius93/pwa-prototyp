'use client'

import {useEffect} from 'react'

// Registriert den Service Worker (public/sw.js) — nur im Production-Build.
// Im Dev-Modus bewusst NICHT: der Cache-First-Pfad für /_next/static würde mit
// Turbopack-Dev-Chunks kollidieren (bekannte Stale-Cache-Falle), und über die
// LAN-IP (http://192.168.…) registrieren Browser ohnehin keinen SW (kein
// Secure Context). Lokal testen: `npm run build && npm start` auf localhost.
export function ServiceWorkerSetup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])

  return null
}
