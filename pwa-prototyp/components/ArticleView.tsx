'use client'
import {useEffect, useRef, useState} from 'react'
import Link from 'next/link'
import {PortableText, type PortableTextComponents} from '@portabletext/react'
import {urlFor} from '@/lib/sanity'
import {HotspotImage} from './HotspotImage'
import {GeometryOverlay} from './GeometryOverlay'
import {InteractiveBike} from './InteractiveBike'

const GRID_COLS: Record<string, number> = {
  '2_horizontal': 2,
  '2_vertical': 1,
  '3_horizontal': 3,
  '4_grid': 2,
  '4_horizontal': 4,
}

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
      <a href={value?.href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  },
}

function img(src: any, w: number) {
  return urlFor(src).width(w).fit('max').auto('format').url()
}

function Block({block, isLead}: {block: any; isLead: boolean}) {
  switch (block._type) {
    case 'titlePage': {
      // Cover-Modus — ein durchgestaltetes Bild füllt den ersten Screen.
      // <picture> liefert dem Smartphone (orientation: portrait) das Hochformat,
      // sonst das Querformat. Sanity-CDN liefert die jeweils kleinste passende Größe.
      if (block.coverArtwork?.asset) {
        const landscape = img(block.coverArtwork, 2400)
        const portrait = block.coverArtworkMobile?.asset
          ? img(block.coverArtworkMobile, 1440)
          : null
        return (
          <header className="titlepage is-cover">
            <picture>
              {portrait && <source media="(orientation: portrait)" srcSet={portrait} />}
              <img className="cover-art" src={landscape} alt={block.title || ''} />
            </picture>
          </header>
        )
      }
      const hasBg = !!block.backgroundImage?.asset
      const hasFg = !!block.foregroundImage?.asset
      return (
        <header className={`titlepage${hasBg ? ' has-bg' : ''}${hasFg ? ' has-fg' : ''}`}>
          {hasBg && <img className="bg" src={img(block.backgroundImage, 2400)} alt="" />}
          <div className="inner">
            {block.eyebrow && <div className="eyebrow">{block.eyebrow}</div>}
            <h1>{block.title}</h1>
            {block.subtitle && <p className="subtitle">{block.subtitle}</p>}
          </div>
          {hasFg && (
            <img
              className="fg"
              src={img(block.foregroundImage, 2400)}
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
        <figure className="fullbleed">
          <img src={img(block.image, 2200)} alt={block.caption || ''} loading="lazy" />
          {block.caption && <figcaption className="caption">{block.caption}</figcaption>}
        </figure>
      )
    case 'photoGrid': {
      const cols = GRID_COLS[block.layout] ?? 2
      const images = (block.images || []).filter((i: any) => i?.asset)
      return (
        <div className={`grid cols-${cols}`}>
          {images.map((image: any, i: number) => (
            <img key={image._key || i} src={img(image, 1200)} alt="" loading="lazy" />
          ))}
        </div>
      )
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
            <img className="verdict-bg" src={img(block.backgroundImage, 2200)} alt="" loading="lazy" />
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

export function ArticleView({data, nav}: {data: any; nav: {prev: any; next: any}}) {
  const body = data.body || []
  const firstTextKey = body.find((b: any) => b._type === 'articleText')?._key
  const hasTitlePage = body.some((b: any) => b._type === 'titlePage')

  // Cover-Hero-Modus: erster Block ist eine titlePage mit Cover-Artwork → der Masthead schwebt
  // initial transparent über dem Cover und wird solid, sobald das Cover aus dem Viewport scrollt.
  const firstBlock = body[0]
  const hasCoverHero = firstBlock?._type === 'titlePage' && !!firstBlock?.coverArtwork?.asset
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [pastHero, setPastHero] = useState(false)

  useEffect(() => {
    if (!hasCoverHero) return
    const cover = wrapperRef.current?.querySelector('.titlepage.is-cover')
    if (!cover) return
    const obs = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      {threshold: 0.05},
    )
    obs.observe(cover)
    return () => obs.disconnect()
  }, [hasCoverHero])

  const wrapperClass = [
    'article-page',
    hasCoverHero && 'has-cover-hero',
    pastHero && 'is-past-hero',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={wrapperClass} ref={wrapperRef}>
      <div className="masthead">
        <Link href="/" className="brand back">← {data.magazine?.name || 'E-MOUNTAINBIKE'}</Link>
        <span className="issue">{data.category || ''}</span>
      </div>

      <article className="article">
        {!hasTitlePage && (
          <header className="article-header prose">
            {data.category && <div className="eyebrow dark">{data.category}</div>}
            <h1>{data.title}</h1>
            {data.author && <p className="byline">von {data.author}</p>}
          </header>
        )}

        {body.map((block: any) => (
          <Block key={block._key} block={block} isLead={block._key === firstTextKey} />
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
