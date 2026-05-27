import Link from 'next/link'
import {PortableText, type PortableTextComponents} from '@portabletext/react'
import {urlFor} from '@/lib/sanity'

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
      const hasBg = !!block.backgroundImage?.asset
      return (
        <header className={`titlepage${hasBg ? ' has-bg' : ''}`}>
          {hasBg && <img className="bg" src={img(block.backgroundImage, 2000)} alt="" />}
          <div className="inner">
            {block.eyebrow && <div className="eyebrow">{block.eyebrow}</div>}
            <h1>{block.title}</h1>
            {block.subtitle && <p className="subtitle">{block.subtitle}</p>}
          </div>
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
    default:
      return null
  }
}

export function ArticleView({data, nav}: {data: any; nav: {prev: any; next: any}}) {
  const body = data.body || []
  const firstTextKey = body.find((b: any) => b._type === 'articleText')?._key
  const hasTitlePage = body.some((b: any) => b._type === 'titlePage')

  return (
    <>
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
    </>
  )
}
