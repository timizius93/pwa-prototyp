'use client'

import {useEffect, useRef, useState} from 'react'

// Custom-Anzeige Specialized Turbo Levo 4 — Layout 1:1 zur echten Print-Anzeige
// aus E-MTB #042:
//   ┌─────────────────────────────────────────────┐
//   │ [SPECIALIZED]                  [TS-Badge]   │
//   │                                              │
//   │  TURBO LEVO 4                                │
//   │  Where Super                  ┌──────────┐  │
//   │  Meets Natural                │Jetzt kfn.│  │
//   └───────────────────────────────└──────────┘──┘
//
// Effekte:
//   - Maus-Parallax + Gyro auf Hero-Foto
//   - Hover am CTA: Outline → Lightning-Fill aus dem Hero-Bild
//   - Test-Sieger-Badge: periodischer Schimmer-Sweep
//
// iOS-Safari-Lehre (Bug-Session): der Hero bekommt durch das JS-`transform` einen
// eigenen GPU-Compositing-Layer. Geschwister-Elemente ohne eigenen Layer wurden von
// iOS HINTER den Hero gemalt (z-index ignoriert) → unsichtbar. Deshalb liegt der
// gesamte Vordergrund jetzt in `.splz__content` mit `transform: translateZ(0)`, was
// ihm einen eigenen Layer ÜBER dem Hero gibt. CSS in app/globals.css.

export default function SpecializedLevo4() {
  const rootRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const [debug, setDebug] = useState<string[] | null>(null)

  // Parallax-Hero
  useEffect(() => {
    const el = heroRef.current
    if (!el) return

    let rafId = 0
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0

    const apply = () => {
      currentX += (targetX - currentX) * 0.08
      currentY += (targetY - currentY) * 0.08
      el.style.transform = `scale(1.06) translate3d(${currentX}px, ${currentY}px, 0)`
      rafId = requestAnimationFrame(apply)
    }
    rafId = requestAnimationFrame(apply)

    const onMouse = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      targetX = ((e.clientX - cx) / rect.width) * -24
      targetY = ((e.clientY - cy) / rect.height) * -18
    }
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return
      targetX = Math.max(-30, Math.min(30, e.gamma * 0.6))
      targetY = Math.max(-20, Math.min(20, (e.beta - 30) * 0.4))
    }

    window.addEventListener('mousemove', onMouse)
    window.addEventListener('deviceorientation', onOrient)
    return () => {
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('deviceorientation', onOrient)
      cancelAnimationFrame(rafId)
    }
  }, [])

  // Debug-Readout: bei ?debug=1 liest er die Computed-Styles + Position der kritischen
  // Elemente und zeigt sie als Overlay direkt auf dem iPhone-Screen — Ground Truth ohne
  // Web-Inspector. Nach 600 ms (CSS sicher geladen) gemessen.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.location.search.includes('debug')) return
    const t = setTimeout(() => {
      const root = rootRef.current
      if (!root) return
      const targets = [
        ['logo', '.splz__logo'],
        ['model', '.splz__model'],
        ['slogan', '.splz__slogan'],
        ['cta', '.splz__cta'],
        ['content', '.splz__content'],
        ['hero', '.splz__hero'],
      ] as const
      const lines = targets.map(([name, sel]) => {
        const el = root.querySelector(sel) as HTMLElement | null
        if (!el) return `${name}: —`
        const cs = getComputedStyle(el)
        const r = el.getBoundingClientRect()
        return (
          `${name}: op=${cs.opacity} vis=${cs.visibility} ` +
          `z=${cs.zIndex} tf=${cs.transform === 'none' ? 'none' : 'yes'} ` +
          `top=${Math.round(r.top)} h=${Math.round(r.height)}`
        )
      })
      lines.push(`win=${window.innerWidth}x${window.innerHeight}`)
      setDebug(lines)
    }, 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="splz" ref={rootRef}>
      <div className="splz__hero" ref={heroRef} aria-hidden />
      <div className="splz__scrim" aria-hidden />

      {/* Gesamter Vordergrund in EINEM composited Layer (translateZ(0) in CSS) —
          liegt damit auf iOS zuverlässig ÜBER dem transformierten Hero. */}
      <div className="splz__content">
        {/* Header: Logo links, Badge rechts */}
        <div className="splz__header">
          {/* Logo als weiße Maske statt filter-invertiertem <img> (iOS-robust) */}
          <span className="splz__logo" role="img" aria-label="Specialized" />
          <div className="splz__badge-wrap">
            <img
              className="splz__badge"
              src="/ads/specialized-levo-4/badge.png"
              alt="E-MOUNTAINBIKE Magazin · Test Sieger 04/2025"
            />
            <span className="splz__badge-shimmer" aria-hidden />
          </div>
        </div>

        {/* Bottom: Modellname + Slogan links, CTA rechts */}
        <div className="splz__bottom">
          <div className="splz__copy">
            <div className="splz__model">TURBO LEVO 4</div>
            <h2 className="splz__slogan">
              Where Super<br />Meets Natural
            </h2>
          </div>
          <a
            href="https://www.specialized.com/at/de/c/bikes/electric-bikes/turbo-levo"
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="splz__cta"
          >
            Jetzt kaufen
          </a>
        </div>
      </div>

      {debug && (
        <pre className="splz__debug">{debug.join('\n')}</pre>
      )}
    </div>
  )
}
