'use client'
import {useEffect, useRef, useState} from 'react'
import {imgUrl, imgSet} from '@/lib/image'

function img(src: any, w: number) {
  return imgUrl(src, w)
}

// Tester-„Slideshow": eine große, luftige Slide pro Ansicht (Foto + Bio nebeneinander),
// Blättern per Pfeil, Dots oder Touch-Wisch (scroll-snap).
export function TesterCarousel({block}: {block: any}) {
  const testers = (block.testers || []).filter((t: any) => t?.name)
  const trackRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number | null>(null)
  const [active, setActive] = useState(0)

  if (!testers.length) return null
  const last = testers.length - 1

  // Weiches, kontrolliertes Einrasten (eigene Animation statt native scroll-snap, die hart
  // zuschnappt). easeOutCubic über ~380 ms — fürs Drag-Ende UND die Pfeile/Dots.
  function animateTo(targetLeft: number) {
    const track = trackRef.current
    if (!track) return
    if (animRef.current) cancelAnimationFrame(animRef.current)
    const start = track.scrollLeft
    const dist = targetLeft - start
    if (Math.abs(dist) < 1) {
      track.scrollLeft = targetLeft
      return
    }
    const dur = 380
    const ease = (p: number) => 1 - Math.pow(1 - p, 3)
    let t0: number | null = null
    function frame(now: number) {
      if (t0 === null) t0 = now
      const p = Math.min(1, (now - t0) / dur)
      track!.scrollLeft = start + dist * ease(p)
      animRef.current = p < 1 ? requestAnimationFrame(frame) : null
    }
    animRef.current = requestAnimationFrame(frame)
  }

  function go(i: number) {
    const track = trackRef.current
    if (!track) return
    const clamped = Math.max(0, Math.min(last, i))
    const slide = track.children[clamped] as HTMLElement | undefined
    if (slide) animateTo(slide.offsetLeft - track.offsetLeft)
  }

  function onScroll() {
    const track = trackRef.current
    if (!track) return
    const center = track.scrollLeft + track.clientWidth / 2
    let best = 0
    let bestDist = Infinity
    Array.from(track.children).forEach((c, i) => {
      const el = c as HTMLElement
      const mid = el.offsetLeft - track.offsetLeft + el.clientWidth / 2
      const d = Math.abs(mid - center)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    })
    setActive(best)
  }

  // Eigener Touch-Wisch: weil das umgebende Artikel-Carousel auf dem Panel `touch-action: pan-y`
  // setzt (blockiert natives Horizontal-Scrollen), steuern wir das Blättern hier selbst per JS.
  // Der ArticleCarousel lässt Gesten auf [data-hscroll] in Ruhe (s. dort), also keine Kollision.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let startX = 0
    let startY = 0
    let startScroll = 0
    let axis: null | 'x' | 'y' = null
    let dragging = false

    function ts(e: TouchEvent) {
      if (e.touches.length !== 1) return
      if (animRef.current) cancelAnimationFrame(animRef.current) // laufendes Einrasten stoppen
      dragging = true
      axis = null
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      startScroll = track!.scrollLeft
    }
    function tm(e: TouchEvent) {
      if (!dragging) return
      const dx = e.touches[0].clientX - startX
      const dy = e.touches[0].clientY - startY
      if (axis === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      }
      if (axis !== 'x') return // vertikal → Artikel scrollt weiter
      e.preventDefault()
      track!.scrollLeft = startScroll - dx
    }
    function te() {
      if (!dragging) return
      dragging = false
      if (axis === 'x') {
        // Flick-freundlich einrasten: schon ein kurzer, klarer Wisch blättert eine Slide weiter
        // (nicht erst ab halber Slide-Breite). startIndex über offsetLeft → gap-sicher.
        const w = track!.clientWidth || 1
        const kids = Array.from(track!.children) as HTMLElement[]
        const nearest = (pos: number) =>
          kids.reduce(
            (best, el, i) =>
              Math.abs(el.offsetLeft - track!.offsetLeft - pos) <
              Math.abs(kids[best].offsetLeft - track!.offsetLeft - pos)
                ? i
                : best,
            0,
          )
        const startIndex = nearest(startScroll)
        const delta = track!.scrollLeft - startScroll
        let target = startIndex
        if (Math.abs(delta) > Math.max(40, w * 0.15)) target = startIndex + (delta > 0 ? 1 : -1)
        target = Math.max(0, Math.min(kids.length - 1, target))
        if (kids[target]) animateTo(kids[target].offsetLeft - track!.offsetLeft)
      }
      axis = null
    }

    track.addEventListener('touchstart', ts, {passive: true})
    track.addEventListener('touchmove', tm, {passive: false})
    track.addEventListener('touchend', te, {passive: true})
    track.addEventListener('touchcancel', te, {passive: true})
    return () => {
      track.removeEventListener('touchstart', ts)
      track.removeEventListener('touchmove', tm)
      track.removeEventListener('touchend', te)
      track.removeEventListener('touchcancel', te)
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [testers.length])

  return (
    <section className="testers">
      {block.title && <h2 className="testers-title">{block.title}</h2>}
      <div className="testers-stage">
        <button
          className="testers-nav prev"
          onClick={() => go(active - 1)}
          disabled={active === 0}
          aria-label="Vorheriger Tester"
        >
          ‹
        </button>
        <div className="testers-track" ref={trackRef} onScroll={onScroll} data-hscroll>
          {testers.map((t: any) => (
            <figure className="tester-slide" key={t._id}>
              {t.portrait?.asset && (
                <img {...imgSet(t.portrait, '(max-width: 720px) 100vw, 420px', 1440)} alt={t.name} loading="lazy" />
              )}
              <figcaption>
                {t.role && <div className="tester-role">{t.role}</div>}
                <div className="tester-name">{t.name}</div>
                {t.bio && <p className="tester-bio">{t.bio}</p>}
              </figcaption>
            </figure>
          ))}
        </div>
        <button
          className="testers-nav next"
          onClick={() => go(active + 1)}
          disabled={active === last}
          aria-label="Nächster Tester"
        >
          ›
        </button>
      </div>
      <div className="testers-dots">
        {testers.map((t: any, i: number) => (
          <button
            key={t._id}
            className={i === active ? 'on' : undefined}
            onClick={() => go(i)}
            aria-label={`Tester ${i + 1} von ${testers.length}`}
            aria-current={i === active}
          />
        ))}
      </div>
    </section>
  )
}
