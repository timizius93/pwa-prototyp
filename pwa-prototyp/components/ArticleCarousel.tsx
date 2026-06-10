'use client'

import {useEffect, useRef, useState, useCallback} from 'react'
import {ArticleView} from './ArticleView'
import {AdView} from './AdView'

// Lücke zwischen den Panels (wie der weiße Rand zwischen Fotos in der iPhone-Fotos-App)
const GAP = 24

// Interaktives Swipe-Carousel im Stil der iPhone-Fotos-App:
// Der Inhalt folgt dem Finger, der Nachbar lugt rein, beim Loslassen schnappt es weiter/zurück.
// Panels sind entweder Artikel (`_panelType: 'article'`) oder Anzeigen (`_panelType: 'ad'`).
export function ArticleCarousel({
  panels,
  startIndex,
}: {
  panels: any[]
  startIndex: number
}) {
  const articles = panels // alte Variable umgemappt — der gesamte Drag/Drop-Code unten ist neutral
  const [index, setIndex] = useState(startIndex)
  const [dragX, setDragX] = useState(0)
  const [animating, setAnimating] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null)

  // Drag-Zustand in einem Ref (ändert sich pro Touch-Frame, soll kein Re-Render auslösen)
  const drag = useRef({
    active: false,
    ignore: false,
    startX: 0,
    startY: 0,
    axis: null as null | 'x' | 'y',
    dx: 0,
    width: 0,
  })

  const goTo = useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(articles.length - 1, i))
      setAnimating(true)
      setIndex(clamped)
      setDragX(0)
      const slug = articles[clamped]?.slug
      if (slug) window.history.replaceState(window.history.state, '', `/artikel/${slug}`)
    },
    [articles],
  )

  useEffect(() => {
    const vp = viewportRef.current
    if (!vp) return

    function onStart(e: TouchEvent) {
      if (e.touches.length !== 1) return
      const t = e.touches[0]
      // Startet der Finger auf einem horizontal scrollbaren Element (z. B. der Tester-Slideshow),
      // gehört die Wisch-Geste IHM — wir mischen uns nicht ein (kein Artikel-Wechsel, kein
      // preventDefault → natives Scrollen des inneren Elements bleibt erhalten).
      const onHScroll = !!(e.target as Element)?.closest?.('[data-hscroll]')
      drag.current = {
        active: true,
        ignore: onHScroll,
        startX: t.clientX,
        startY: t.clientY,
        axis: null,
        dx: 0,
        width: vp.clientWidth || window.innerWidth,
      }
      setAnimating(false)
    }

    function onMove(e: TouchEvent) {
      const d = drag.current
      if (!d.active || d.ignore) return
      const t = e.touches[0]
      const dx = t.clientX - d.startX
      const dy = t.clientY - d.startY

      // Achse beim ersten klaren Move festlegen (Wischen vs. Scrollen)
      if (d.axis === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        d.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      }
      if (d.axis !== 'x') return // vertikales Scrollen dem Browser überlassen

      e.preventDefault() // horizontalen Wisch übernehmen wir
      // Widerstand an den Enden (gummiartig)
      let move = dx
      if ((index === 0 && dx > 0) || (index === articles.length - 1 && dx < 0)) move = dx * 0.35
      d.dx = move
      setDragX(move)
    }

    function onEnd() {
      const d = drag.current
      if (!d.active) return
      d.active = false
      if (d.ignore) {
        d.ignore = false
        return
      }
      if (d.axis !== 'x') return
      const threshold = (d.width || window.innerWidth) * 0.22
      setAnimating(true)
      if (d.dx <= -threshold && index < articles.length - 1) goTo(index + 1)
      else if (d.dx >= threshold && index > 0) goTo(index - 1)
      else setDragX(0) // zurückschnappen
      d.axis = null
      d.dx = 0
    }

    vp.addEventListener('touchstart', onStart, {passive: true})
    vp.addEventListener('touchmove', onMove, {passive: false})
    vp.addEventListener('touchend', onEnd, {passive: true})
    vp.addEventListener('touchcancel', onEnd, {passive: true})
    return () => {
      vp.removeEventListener('touchstart', onStart)
      vp.removeEventListener('touchmove', onMove)
      vp.removeEventListener('touchend', onEnd)
      vp.removeEventListener('touchcancel', onEnd)
    }
  }, [index, articles.length, goTo])

  return (
    <div className="carousel-viewport" ref={viewportRef}>
      <div
        className="carousel-track"
        style={{
          gap: `${GAP}px`,
          // ein Schritt = Panel-Breite (100vw) + Lücke
          transform: `translateX(calc(${-index} * (100vw + ${GAP}px) + ${dragX}px))`,
          transition: animating ? 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
        }}
        onTransitionEnd={() => setAnimating(false)}
      >
        {articles.map((a, i) => {
          // Nav-Titel-Fallback: Anzeigen haben kein `title`, also „Anzeige · <Sponsor>"
          const navTitle = (p: any) =>
            p._panelType === 'ad' ? `Anzeige · ${p.sponsor || ''}`.trim() : p.title
          const prev = i > 0 ? {slug: articles[i - 1].slug, title: navTitle(articles[i - 1])} : null
          const next =
            i < articles.length - 1
              ? {slug: articles[i + 1].slug, title: navTitle(articles[i + 1])}
              : null

          return (
            <div className="carousel-panel" key={a.slug || i}>
              {a._panelType === 'ad' ? (
                <AdView data={a} />
              ) : (
                <ArticleView data={a} nav={{prev, next}} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
