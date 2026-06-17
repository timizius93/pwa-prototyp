'use client'

import {useEffect, useState} from 'react'

// „Ausgabe offline speichern" — Mess-Sprint-Spike.
//
// Funktionsweise: Die Artikel-Seiten sind server-gerendert, d. h. ihr HTML
// enthält bereits alle finalen Bild-/Asset-URLs (img src/srcset, <source>,
// Skripte, Stylesheets). Wir holen also jede Seite der Ausgabe, parsen die
// URLs heraus und legen alles in dieselben Caches, aus denen der Service
// Worker (public/sw.js) offline bedient. Keine doppelte URL-Bau-Logik nötig.
//
// Nebeneffekt fürs Messen: Wir summieren die Bytes → „MB pro Ausgabe" ist
// eine der harten Zahlen für den Pitch. Speicherdatum wird angezeigt —
// hilfreich für den iOS-7-Tage-Test.
//
// Cache-Namen müssen mit public/sw.js übereinstimmen!
const PAGES = 'pages-v1'
const ASSETS = 'assets-v1'
const IMAGES = 'images-v1'
const LS_KEY = 'offline-saved-issue'

type SaveState =
  | {phase: 'idle'}
  | {phase: 'saving'; done: number; total: number}
  | {phase: 'done'; mb: number; dateLabel: string; skipped?: number}
  | {phase: 'error'; message: string}

function extractUrls(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const urls = new Set<string>()

  const add = (raw: string | null) => {
    if (!raw) return
    try {
      const u = new URL(raw, location.origin)
      if (u.protocol === 'http:' || u.protocol === 'https:') urls.add(u.href)
    } catch {}
  }
  // srcset → für den Offline-Cache GENAU EINE Auflösung pro Bild wählen (sonst landen alle
  // ~7 srcset-Stufen im Cache und der Save bläht auf ein Vielfaches auf). Wir nehmen die
  // Variante, deren Breite ~1200px am nächsten kommt — gerät-neutrale Mittelgröße.
  // (Die Online-Auslieferung wählt der Browser selbst per srcset; das ist davon getrennt.)
  const OFFLINE_TARGET_WIDTH = 1200
  const addBestFromSrcset = (raw: string | null) => {
    if (!raw) return
    let best: {url: string; w: number} | null = null
    for (const part of raw.split(',')) {
      const [url, descriptor] = part.trim().split(/\s+/)
      if (!url) continue
      const w = parseInt(descriptor || '0', 10) || 0
      if (!best || Math.abs(w - OFFLINE_TARGET_WIDTH) < Math.abs(best.w - OFFLINE_TARGET_WIDTH)) {
        best = {url, w}
      }
    }
    if (best) add(best.url)
  }

  doc.querySelectorAll('img').forEach((el) => {
    // Nur den src cachen (= die ~1200px-Fallbackgröße aus imgSet), NICHT das ganze srcset —
    // sonst lädt der Offline-Save alle Auflösungsstufen. Eine Größe pro Bild reicht offline.
    add(el.getAttribute('src'))
  })
  // <source> (Cover-Hochformat im <picture>) hat keinen src → eine Stufe aus dem srcset wählen.
  doc.querySelectorAll('source').forEach((el) => addBestFromSrcset(el.getAttribute('srcset')))
  doc.querySelectorAll('script[src]').forEach((el) => add(el.getAttribute('src')))
  doc.querySelectorAll('link[href]').forEach((el) => {
    const rel = el.getAttribute('rel') || ''
    if (/stylesheet|preload|prefetch|icon|manifest/.test(rel)) add(el.getAttribute('href'))
  })
  return [...urls]
}

// CSS kann weitere Assets referenzieren (z. B. die Specialized-Anzeige:
// hero.webp + Logo-SVG via background-image/mask).
function extractCssUrls(cssText: string, baseUrl: string): string[] {
  const urls = new Set<string>()
  for (const m of cssText.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
    try {
      const u = new URL(m[1], baseUrl)
      if (u.protocol === 'http:' || u.protocol === 'https:') urls.add(u.href)
    } catch {}
  }
  return [...urls]
}

async function runPool<T>(items: T[], worker: (item: T) => Promise<void>, concurrency: number) {
  const queue = [...items]
  await Promise.all(
    Array.from({length: Math.min(concurrency, queue.length)}, async () => {
      for (let item = queue.shift(); item !== undefined; item = queue.shift()) {
        await worker(item).catch(() => {}) // einzelne Fehlschläge brechen den Save nicht ab
      }
    }),
  )
}

function dateLabel(ts: number) {
  return new Intl.DateTimeFormat('de-DE', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'}).format(
    new Date(ts),
  )
}

export function OfflineSaver({slugs}: {slugs: string[]}) {
  const [state, setState] = useState<SaveState>({phase: 'idle'})
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    // Cache API gibt's nur im Secure Context (https/localhost) — über die
    // LAN-IP im Dev-Modus blenden wir den Button aus statt kaputt zu wirken.
    if (!('caches' in window)) {
      setSupported(false)
      return
    }
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null')
      if (saved?.ts) setState({phase: 'done', mb: saved.mb, dateLabel: dateLabel(saved.ts)})
    } catch {}
  }, [])

  if (!supported) return null

  const save = async () => {
    const pageUrls = ['/', ...slugs.map((s) => `/artikel/${s}`)]
    setState({phase: 'saving', done: 0, total: pageUrls.length})

    try {
      const pagesCache = await caches.open(PAGES)
      const assetsCache = await caches.open(ASSETS)
      const imagesCache = await caches.open(IMAGES)

      let bytes = 0
      let done = 0
      const assetUrls = new Set<string>()

      // 1) Alle Seiten der Ausgabe holen + cachen, URLs einsammeln
      for (const path of pageUrls) {
        const res = await fetch(path, {cache: 'no-store'})
        if (!res.ok) throw new Error(`Seite ${path} nicht ladbar (${res.status})`)
        const html = await res.clone().text()
        bytes += new Blob([html]).size
        await pagesCache.put(new URL(path, location.origin).href, res)
        extractUrls(html).forEach((u) => assetUrls.add(u))
        done++
        setState({phase: 'saving', done, total: pageUrls.length + assetUrls.size})
      }

      // 2) Stylesheets zuerst — sie können weitere Assets nachziehen
      const cssUrls = [...assetUrls].filter((u) => new URL(u).pathname.endsWith('.css'))
      for (const cssUrl of cssUrls) {
        try {
          const res = await fetch(cssUrl)
          if (!res.ok) continue
          const text = await res.clone().text()
          bytes += new Blob([text]).size
          await assetsCache.put(cssUrl, res)
          extractCssUrls(text, cssUrl).forEach((u) => assetUrls.add(u))
          assetUrls.delete(cssUrl)
          done++
        } catch {}
      }

      // 3) Restliche Assets + Bilder parallel (begrenzt) laden
      const rest = [...assetUrls].filter((u) => {
        const url = new URL(u)
        return url.hostname === 'cdn.sanity.io' || url.origin === location.origin
      })
      const total = done + rest.length
      setState({phase: 'saving', done, total})

      let skipped = 0
      await runPool(
        rest,
        async (u) => {
          const url = new URL(u)
          const isImage = url.hostname === 'cdn.sanity.io'
          const cache = isImage ? imagesCache : assetsCache
          try {
            if (!(await cache.match(u))) {
              let res: Response | null = null
              try {
                res = await fetch(u, {mode: isImage ? 'cors' : 'same-origin'})
              } catch {
                // CORS nicht freigegeben (Sanity-Allowlist) → opaque cachen.
                // Funktioniert offline für <img>, nur die Größe bleibt unbekannt.
                if (isImage) res = await fetch(u, {mode: 'no-cors'})
              }
              if (res && (res.ok || res.type === 'opaque')) {
                if (res.ok) {
                  bytes += Number(res.headers.get('content-length')) || (await res.clone().blob()).size
                }
                await cache.put(u, res)
              } else {
                skipped++
              }
            }
          } catch {
            skipped++
          }
          done++
          setState({phase: 'saving', done, total})
        },
        6,
      )

      const mb = Math.round((bytes / 1024 / 1024) * 10) / 10
      const ts = Date.now()
      localStorage.setItem(LS_KEY, JSON.stringify({ts, mb}))
      setState({phase: 'done', mb, dateLabel: dateLabel(ts), skipped})
    } catch (err: any) {
      setState({phase: 'error', message: err?.message || 'Speichern fehlgeschlagen'})
    }
  }

  return (
    <button
      type="button"
      className={`offline-save ${state.phase}`}
      onClick={state.phase === 'saving' ? undefined : save}
      disabled={state.phase === 'saving'}
    >
      {state.phase === 'idle' && <>↓ Ausgabe offline speichern</>}
      {state.phase === 'saving' && (
        <>
          Speichere … {state.done}/{state.total}
        </>
      )}
      {state.phase === 'done' && (
        <>
          ✓ Offline gespeichert · {state.mb} MB · {state.dateLabel}
          {state.skipped ? ` · ${state.skipped} Dateien übersprungen` : ''}
        </>
      )}
      {state.phase === 'error' && <>⚠ {state.message} — erneut versuchen</>}
    </button>
  )
}
