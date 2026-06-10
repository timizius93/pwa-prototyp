import Link from 'next/link'
import {urlFor} from '@/lib/sanity'
import {AD_POSTERS} from './ads/registry'

function thumb(src: any) {
  return urlFor(src).width(900).height(600).fit('crop').auto('format').url()
}

// Anzeigen sind designte Ganzseiten — nicht beschneiden, sondern im natürlichen
// Seitenverhältnis liefern (Karte zeigt sie per CSS `contain` mit dunklem Rahmen).
function adThumb(src: any) {
  return urlFor(src).width(1000).auto('format').url()
}

export function Kiosk({data}: {data: any}) {
  const panels = (data?.panels || []).filter((p: any) => p.slug)
  const articleCount = panels.filter((p: any) => p._panelType !== 'ad').length

  const cover = data?.coverImage?.asset
    ? urlFor(data.coverImage).width(2400).height(1350).fit('crop').auto('format').url()
    : null
  const logo = data?.magazine?.logo?.asset
    ? urlFor(data.magazine.logo).width(900).auto('format').url()
    : null
  const dateLabel = data?.publishDate
    ? new Intl.DateTimeFormat('de-DE', {month: 'long', year: 'numeric'})
        .format(new Date(data.publishDate))
        .toUpperCase()
    : null
  const magName = data?.magazine?.name || 'E-MOUNTAINBIKE'

  return (
    <>
      {cover ? (
        <header className="kiosk-cover">
          <img className="kiosk-cover-bg" src={cover} alt="" aria-hidden />
          <div className="kiosk-cover-logo">
            {logo ? <img src={logo} alt={magName} /> : <span>{magName}</span>}
          </div>
          <div className="kiosk-cover-foot">
            <p className="kiosk-cover-sub">{articleCount} Artikel in dieser Ausgabe</p>
            <div className="kiosk-cover-meta">
              <div className="kiosk-cover-issue">
                <span className="kc-num">#{String(data?.number).padStart(3, '0')}</span>
                {dateLabel && <span className="kc-date"> {dateLabel}</span>}
              </div>
              <h1 className="kiosk-cover-title">{data?.title}</h1>
            </div>
          </div>
        </header>
      ) : (
        <header className="kiosk-hero">
          <div className="eyebrow">{magName}</div>
          <h1>#{data?.number} — {data?.title}</h1>
          <p className="kiosk-sub">{articleCount} Artikel in dieser Ausgabe</p>
        </header>
      )}

      <div className="kiosk-grid">
        {panels.map((p: any) =>
          p._panelType === 'ad' ? (
            <Link key={p.slug} href={`/artikel/${p.slug}`} className="card card--ad">
              <div className="card-thumb">
                {p.thumb?.asset ? (
                  <img src={adThumb(p.thumb)} alt="" />
                ) : p.componentId && AD_POSTERS[p.componentId] ? (
                  <img src={AD_POSTERS[p.componentId]} alt="" />
                ) : (
                  <div className="card-thumb placeholder" />
                )}
                <div className="card-ad-badge" aria-label="Werbung">AD</div>
              </div>
              <div className="card-body">
                <div className="card-cat">Anzeige</div>
                <div className="card-title">{p.sponsor}</div>
              </div>
            </Link>
          ) : (
            <Link key={p.slug} href={`/artikel/${p.slug}`} className="card">
              <div className="card-thumb">
                {p.thumb?.asset ? (
                  <img src={thumb(p.thumb)} alt="" />
                ) : (
                  <div className="card-thumb placeholder" />
                )}
              </div>
              <div className="card-body">
                {p.category && <div className="card-cat">{p.category}</div>}
                <div className="card-title">{p.title}</div>
              </div>
            </Link>
          ),
        )}
      </div>
      <footer className="kiosk-footer">
        <a href="https://www.41publishing.com/impressum" target="_blank" rel="noopener noreferrer">
          Impressum
        </a>
        <span aria-hidden>·</span>
        <a href="https://www.41publishing.com/datenschutz" target="_blank" rel="noopener noreferrer">
          Datenschutz
        </a>
      </footer>
    </>
  )
}
