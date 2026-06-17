'use client'
import {useEffect, useRef} from 'react'
import Link from 'next/link'
import {PortableText, type PortableTextComponents} from '@portabletext/react'
import {imgUrl, imgSet} from '@/lib/image'
import {HotspotImage} from './HotspotImage'
import {GeometryOverlay} from './GeometryOverlay'
import {InteractiveBike} from './InteractiveBike'
import {ComparisonTable} from './ComparisonTable'
import {TesterCarousel} from './TesterCarousel'

// Touch-Icon vor Fließtext-Links (Heft-Konvention: schwarzer Kreis mit Hand → „antippbar").
const TapIcon = () => (
  <svg className="tap-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="12" fill="currentColor" />
    <path
      transform="translate(4 4) scale(0.667)"
      fill="#fff"
      d="M9 11.24V7.5C9 6.12 10.12 5 11.5 5S14 6.12 14 7.5v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74l-3.43-.72c-.08-.01-.15-.03-.24-.03-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.27.27.65.44 1.06.44h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.07.02-.14.02-.2 0-.62-.38-1.16-.91-1.39z"
    />
  </svg>
)

const ptComponents: PortableTextComponents = {
  block: {
    normal: ({children}) => <p>{children}</p>,
    h2: ({children}) => <h2>{children}</h2>,
    h3: ({children}) => <h3>{children}</h3>,
    blockquote: ({children}) => <blockquote>{children}</blockquote>,
  },
  marks: {
    strong: ({children}) => <strong>{children}</strong>,
    em: ({children}) => <em>{children}</em>,
    link: ({children, value}) => (
      <a className="text-link" href={value?.href} target="_blank" rel="noopener noreferrer">
        <TapIcon />
        {children}
      </a>
    ),
  },
}

// Einzelbild-URL via zentralen Helper → läuft durch den Bild-Host-Swap (Cloudflare-ready).
// Große Bilder nutzen stattdessen imgSet() (srcset); img() bleibt für kleine (Siegel etc.).
function img(src: any, w: number) {
  return imgUrl(src, w)
}

// Fullbleed-Foto mit optionalem Scroll-Effekt (Feld `scrollEffect` im Schema):
//   none      – statisches Foto (wie früher)
//   parallax  – Bild wandert beim Scrollen gegenläufig im Rahmen
//   scale     – Bild zoomt heran, während es durch den Viewport scrollt
//   kenBurns  – langsamer Dauer-Zoom + -Pan (reine CSS-Animation, scroll-unabhängig)
//
// Wichtig für die scroll-getriebenen Modi (parallax/scale): der Scroll-Container ist das
// `.carousel-panel` (overflow-y:auto), NICHT window — und der Carousel-Track trägt ein
// `transform`, das jedes `position:fixed`/`background-attachment:fixed`-Parallax bricht
// (siehe AdView.tsx). Wir transformieren deshalb das Bild rein per `transform` INNERHALB
// eines overflow:hidden-Rahmens; das ist transform-unabhängig und funktioniert im Panel.
function FullbleedPhoto({
  image,
  caption,
  effect = 'none',
  gear,
}: {
  image: any
  caption?: string
  effect?: string
  gear?: {label?: string; value?: string}[]
}) {
  const figRef = useRef<HTMLElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  // Outfit-Overlay (Hero-Shot): fett-Label + Produkt, unten links auf dem Foto.
  const gearList = (gear || []).filter((g) => g?.label || g?.value)
  const gearOverlay = gearList.length > 0 && (
    <dl className="gear-credits">
      {gearList.map((g, i) => (
        <div key={i}>
          {g.label && <dt>{g.label}</dt>}
          {g.value && <dd>{g.value}</dd>}
        </div>
      ))}
    </dl>
  )

  useEffect(() => {
    // kenBurns läuft per CSS, none hat keinen Effekt → nur parallax/scale brauchen JS
    if (effect !== 'parallax' && effect !== 'scale') return
    const fig = figRef.current
    const im = imgRef.current
    const frame = im?.parentElement
    if (!fig || !im || !frame) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const scroller: HTMLElement | Window = fig.closest('.carousel-panel') || window
    let raf = 0

    const update = () => {
      raf = 0
      const r = fig.getBoundingClientRect()
      const vh = window.innerHeight
      if (effect === 'parallax') {
        // Headroom aus dem CSS-Overskalieren (scale 1.14), je zur Hälfte oben/unten
        const maxShift = (im.getBoundingClientRect().height - frame.clientHeight) / 2
        // -1 (Figur unten im Viewport) … +1 (oben) → Bild wandert gegenläufig
        const p = (vh / 2 - (r.top + r.height / 2)) / (vh / 2 + r.height / 2)
        const shift = Math.max(-1, Math.min(1, p)) * maxShift
        im.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0) scale(1.14)`
      } else {
        // scale: 0 (Figur betritt unten) … 1 (verlässt oben) → Zoom 1.0 → 1.18
        const p = Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)))
        im.style.transform = `scale(${(1 + p * 0.18).toFixed(3)})`
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    update()
    scroller.addEventListener('scroll', onScroll, {passive: true})
    window.addEventListener('resize', onScroll, {passive: true})
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [effect])

  // Full-bleed = volle Viewport-Breite → sizes '100vw'. Phone lädt ~768–1440 px statt 2200 px.
  const imgProps = imgSet(image, '100vw')

  // „Keiner": statisches Foto wie früher (variable Höhe, kein fester Rahmen)
  if (effect !== 'parallax' && effect !== 'scale' && effect !== 'kenBurns') {
    return (
      <figure className="fullbleed">
        <div className="fullbleed-static">
          <img {...imgProps} alt={caption || ''} loading="lazy" />
          {gearOverlay}
        </div>
        {caption && <figcaption className="caption">{caption}</figcaption>}
      </figure>
    )
  }

  return (
    <figure className="fullbleed" ref={figRef}>
      <div className={`fullbleed-frame fx-${effect}`}>
        <img ref={imgRef} {...imgProps} alt={caption || ''} loading="lazy" />
        {gearOverlay}
      </div>
      {caption && <figcaption className="caption">{caption}</figcaption>}
    </figure>
  )
}

// Foto-Raster: konsistente Querformat-Kacheln, in den versetzten Heft-Layouts angeordnet.
// „Floating images": beim Scrollen schwebt die GANZE Kachel (nicht das Bild im Rahmen) — jede
// mit eigenem Tempo + eigener Richtung (signierte Faktoren) → die Boxen driften gegeneinander.
// Bezugsgröße ist die Position des Rasters im Viewport; Scroll-Container ist das `.carousel-panel`.
// Nur die versetzten Layouts schweben (sie haben Weißraum); enge Raster bleiben statisch.
const GRID_FLOAT = [-0.6, 0.5, 0.32, -0.45] // Richtung + Tempo pro Kachel
const FLOAT_AMP = 30 // px maximaler Schwebe-Versatz (dezent, damit Kacheln nicht überlappen)
const FLOATING_LAYOUTS = ['2_horizontal', '3_horizontal', '4_grid']

function PhotoGrid({images, layout, mirror}: {images: any[]; layout: string; mirror?: boolean}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!FLOATING_LAYOUTS.includes(layout)) return
    const root = ref.current
    if (!root) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia?.('(max-width: 720px)').matches) return // Phone: statisches Raster
    const cells = Array.from(root.querySelectorAll<HTMLElement>('.grid-cell'))
    const scroller: HTMLElement | Window = root.closest('.carousel-panel') || window
    let raf = 0

    const update = () => {
      raf = 0
      const vh = window.innerHeight
      const gr = root.getBoundingClientRect()
      // -1 (Raster unter dem Viewport) … +1 (darüber), 0 = mittig
      const p = Math.max(
        -1.2,
        Math.min(1.2, (vh / 2 - (gr.top + gr.height / 2)) / (vh / 2 + gr.height / 2)),
      )
      cells.forEach((cell, i) => {
        const f = GRID_FLOAT[i % GRID_FLOAT.length]
        cell.style.transform = `translate3d(0, ${(p * FLOAT_AMP * f).toFixed(1)}px, 0)`
      })
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    update()
    scroller.addEventListener('scroll', onScroll, {passive: true})
    window.addEventListener('resize', onScroll, {passive: true})
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [images.length, layout])

  return (
    <div className={`grid grid--${layout}${mirror ? ' grid--mirror' : ''}`} ref={ref}>
      {images.map((image: any, i: number) => (
        <div className="grid-cell" key={image._key || i}>
          <img {...imgSet(image, '(max-width: 720px) 100vw, 50vw')} alt="" loading="lazy" />
        </div>
      ))}
    </div>
  )
}

function Block({block, isLead, mirror}: {block: any; isLead: boolean; mirror?: boolean}) {
  switch (block._type) {
    case 'titlePage': {
      // Cover-Modus — ein durchgestaltetes Bild füllt den ersten Screen.
      // <picture> liefert dem Smartphone (orientation: portrait) das Hochformat,
      // sonst das Querformat. Sanity-CDN liefert die jeweils kleinste passende Größe.
      if (block.coverArtwork?.asset) {
        const landscape = imgSet(block.coverArtwork, '100vw')
        const portrait = block.coverArtworkMobile?.asset
          ? imgSet(block.coverArtworkMobile, '100vw')
          : null
        return (
          <header className="titlepage is-cover">
            <picture>
              {portrait && (
                <source media="(orientation: portrait)" srcSet={portrait.srcSet} sizes={portrait.sizes} />
              )}
              <img className="cover-art" {...landscape} alt={block.title || ''} />
            </picture>
          </header>
        )
      }
      const hasBg = !!block.backgroundImage?.asset
      const hasFg = !!block.foregroundImage?.asset
      return (
        <header className={`titlepage${hasBg ? ' has-bg' : ''}${hasFg ? ' has-fg' : ''}`}>
          {hasBg && <img className="bg" {...imgSet(block.backgroundImage, '100vw')} alt="" />}
          <div className="inner">
            {block.eyebrow && <div className="eyebrow">{block.eyebrow}</div>}
            <h1>{block.title}</h1>
            {block.subtitle && <p className="subtitle">{block.subtitle}</p>}
          </div>
          {hasFg && (
            <img
              className="fg"
              {...imgSet(block.foregroundImage, '100vw')}
              alt=""
              aria-hidden="true"
            />
          )}
          {block.creditByline && <div className="credits">{block.creditByline}</div>}
        </header>
      )
    }
    case 'articleText':
      return (
        <div className={isLead ? 'lead' : undefined}>
          <div className="prose">
            <PortableText value={block.content || []} components={ptComponents} />
          </div>
        </div>
      )
    case 'fullbleedPhoto':
      return (
        <FullbleedPhoto
          image={block.image}
          caption={block.caption}
          effect={block.scrollEffect}
          gear={block.gearList}
        />
      )
    case 'photoGrid': {
      const images = (block.images || []).filter((i: any) => i?.asset)
      return <PhotoGrid images={images} layout={block.layout || 'flow'} mirror={mirror} />
    }
    case 'pullQuote':
      return (
        <blockquote className="pullquote">
          <p>{block.text}</p>
          {block.attribution && <div className="attribution">— {block.attribution}</div>}
        </blockquote>
      )
    case 'specLine': {
      const items = [
        block.bikeName,
        block.motor,
        block.travelFront_mm != null && block.travelRear_mm != null
          ? `${block.travelFront_mm}/${block.travelRear_mm} mm (v/h)`
          : null,
        block.weight_kg != null
          ? `${String(block.weight_kg).replace('.', ',')} kg${block.weight_size ? ` in Größe ${block.weight_size}` : ''}`
          : null,
        block.price_eur != null ? `${block.price_eur.toLocaleString('de-DE')} €` : null,
      ].filter(Boolean)
      return (
        <div className="specline">
          <ul>
            {items.map((it: string, i: number) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
          {block.manufacturerLink && (
            <a className="specline-link" href={block.manufacturerLink} target="_blank" rel="noopener noreferrer">
              Hersteller-Website ↗
            </a>
          )}
        </div>
      )
    }
    case 'hotspotImage':
      return <HotspotImage block={block} />
    case 'geometryOverlay':
      return <GeometryOverlay block={block} />
    case 'interactiveBike':
      return <InteractiveBike block={block} />
    case 'comparisonTable':
      return <ComparisonTable block={block} />
    case 'testerCarousel':
      return <TesterCarousel block={block} />
    case 'awardBox': {
      const AWARDS: Record<string, string> = {
        best_in_test: 'Testsieger',
        best_buy: 'Kauftipp',
        editors_choice: 'Editors’ Choice',
      }
      const label = AWARDS[block.awardType] || block.customLabel || 'Auszeichnung'
      // Sieger-Name: erstes Wort (Marke) fett, Rest leicht — wie im Heft
      const name: string = block.winnerName || ''
      const sp = name.indexOf(' ')
      const brand = sp > 0 ? name.slice(0, sp) : name
      const rest = sp > 0 ? name.slice(sp + 1) : ''
      return (
        <section className="award">
          <div className="award-kicker">{label}</div>
          {name && (
            <h3 className="award-winner">
              <span className="brand">{brand}</span>
              {rest && <> {rest}</>}
            </h3>
          )}
          {block.winnerImage?.asset && (
            <figure className="award-media">
              <img {...imgSet(block.winnerImage, '(max-width: 720px) 100vw, 700px')} alt={name} loading="lazy" />
              {block.badge?.asset && (
                <img className="award-badge" src={img(block.badge, 480)} alt="" aria-hidden="true" />
              )}
            </figure>
          )}
          {block.verdict && <p className="award-verdict">{block.verdict}</p>}
        </section>
      )
    }
    case 'tuningTip':
      return (
        <aside className="tuningtip">
          <span className="tuningtip-badge">🔧 Tuning-Tipp</span>
          <p>{block.tip}</p>
        </aside>
      )
    case 'verdictPanel': {
      const style = block.overlayStyle || 'gradient'
      return (
        <section className={`verdict overlay-${style}`}>
          {block.backgroundImage?.asset && (
            <img className="verdict-bg" {...imgSet(block.backgroundImage, '100vw')} alt="" loading="lazy" />
          )}
          <div className="verdict-inner">
            <h2>{block.headline || 'Fazit'}</h2>
            <p className="verdict-text">{block.verdict}</p>
            <div className="verdict-cols">
              {Array.isArray(block.tops) && block.tops.length > 0 && (
                <div className="verdict-tops">
                  <h3>Tops</h3>
                  <ul>
                    {block.tops.map((t: string, i: number) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(block.flops) && block.flops.length > 0 && (
                <div className="verdict-flops">
                  <h3>Flops</h3>
                  <ul>
                    {block.flops.map((t: string, i: number) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      )
    }
    case 'ctaBlock':
      return (
        <div className="cta">
          {block.headline && <p className="cta-headline">{block.headline}</p>}
          <a className="cta-button" href={block.targetUrl} target="_blank" rel="noopener noreferrer">
            {block.buttonLabel} ↗
          </a>
        </div>
      )
    default:
      return null
  }
}

export function ArticleView({
  data,
  nav,
  onPastHero,
}: {
  data: any
  nav: {prev: any; next: any}
  // Meldet dem Carousel, ob das Cover-Hero aus dem Panel gescrollt ist (steuert die fixe Topbar)
  onPastHero?: (past: boolean) => void
}) {
  const body = data.body || []
  const firstTextKey = body.find((b: any) => b._type === 'articleText')?._key
  const hasTitlePage = body.some((b: any) => b._type === 'titlePage')

  // Aufeinanderfolgende gleichartige Foto-Raster abwechselnd spiegeln → gestapelte 2er
  // zickzacken diagonal statt zwei starre Spalten zu bilden. Zählung pro Layout-Typ.
  const gridMirror: Record<string, boolean> = {}
  const gridSeen: Record<string, number> = {}
  body.forEach((b: any) => {
    if (b._type === 'photoGrid') {
      const l = b.layout || 'flow'
      gridMirror[b._key] = (gridSeen[l] || 0) % 2 === 1
      gridSeen[l] = (gridSeen[l] || 0) + 1
    }
  })

  // Cover-Hero-Modus: erster Block ist eine titlePage mit Cover-Artwork → die fixe Topbar des
  // Carousels schwebt initial transparent über dem Cover und wird solid, sobald das Cover aus
  // dem Panel gescrollt ist. Wir beobachten das hier und melden es per onPastHero nach oben.
  const firstBlock = body[0]
  const hasCoverHero = firstBlock?._type === 'titlePage' && !!firstBlock?.coverArtwork?.asset
  const wrapperRef = useRef<HTMLDivElement>(null)
  const onPastHeroRef = useRef(onPastHero)
  onPastHeroRef.current = onPastHero

  useEffect(() => {
    if (!hasCoverHero) return
    const cover = wrapperRef.current?.querySelector('.titlepage.is-cover')
    if (!cover) return
    // Root = das eigene Panel, NICHT der Viewport: off-screen Panels stehen seitlich im
    // transformierten Track und würden gegen den Viewport fälschlich als „vorbeigescrollt" zählen.
    const panel = wrapperRef.current?.closest('.carousel-panel')
    const obs = new IntersectionObserver(
      ([entry]) => onPastHeroRef.current?.(!entry.isIntersecting),
      {root: panel ?? null, threshold: 0.05},
    )
    obs.observe(cover)
    return () => obs.disconnect()
  }, [hasCoverHero])

  const wrapperClass = ['article-page', hasCoverHero && 'has-cover-hero'].filter(Boolean).join(' ')

  return (
    <div className={wrapperClass} ref={wrapperRef}>
      <article className="article">
        {!hasTitlePage && (
          <header className="article-header prose">
            {data.category && <div className="eyebrow dark">{data.category}</div>}
            <h1>{data.title}</h1>
            {data.author && <p className="byline">von {data.author}</p>}
          </header>
        )}

        {body.map((block: any) => (
          <Block
            key={block._key}
            block={block}
            isLead={block._key === firstTextKey}
            mirror={gridMirror[block._key]}
          />
        ))}

        {data.signature && <div className="signature">{data.signature}</div>}

        <p className="swipe-hint">‹ wische zum Blättern ›</p>

        <nav className="pager">
          {nav.prev ? (
            <Link href={`/artikel/${nav.prev.slug}`} className="pager-link prev">
              <span>← Vorheriger</span>
              <strong>{nav.prev.title}</strong>
            </Link>
          ) : (
            <span />
          )}
          {nav.next ? (
            <Link href={`/artikel/${nav.next.slug}`} className="pager-link next">
              <span>Nächster →</span>
              <strong>{nav.next.title}</strong>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>
    </div>
  )
}
