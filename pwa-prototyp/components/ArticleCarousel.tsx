'use client'

import {useEffect, useRef, useState, useCallback} from 'react'
import {ArticleView} from './ArticleView'

// Lücke zwischen den Artikeln (wie der weiße Rand zwischen Fotos in der iPhone-Fotos-App)
const GAP = 24

// Interaktives Swipe-Carousel im Stil der iPhone-Fotos-App:
// Der Artikel folgt dem Finger, der Nachbar lugt rein, beim Loslassen schnappt es weiter/zurück.
export function ArticleCarousel({
  articles,
  startIndex,
}: {
  articles: any[]
  startIndex: number
}) {
  const [index, setIndex] = useState(startIndex)
  const [dragX, setDragX] = useState(0)
  const [animating, setAnimating] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null)

  // Drag-Zustand in einem Ref (ändert sich pro Touch-Frame, soll kein Re-Render auslösen)
  const drag = useRef({
    active: false,
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
      drag.current = {
        active: true,
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
      if (!d.active) return
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
        {articles.map((a, i) => (
          <div className="carousel-panel" key={a.slug || i}>
            <ArticleView
              data={a}
              nav={{
                prev: i > 0 ? {slug: articles[i - 1].slug, title: articles[i - 1].title} : null,
                next:
                  i < articles.length - 1
                    ? {slug: articles[i + 1].slug, title: articles[i + 1].title}
                    : null,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
