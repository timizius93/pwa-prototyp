import Link from 'next/link'
import {imgUrl, imgSet, imgSetCrop} from '@/lib/image'
import type {Lang} from '@/lib/sanity'
import {ui} from '@/lib/ui-strings'
import {AD_POSTERS} from './ads/registry'
import {OfflineSaver} from './OfflineSaver'
import {LangToggle} from './LangToggle'

function thumb(src: any) {
  return imgSetCrop(src, 900, 600, '(max-width: 720px) 50vw, 320px')
}

// Anzeigen sind designte Ganzseiten — nicht beschneiden, sondern im natürlichen
// Seitenverhältnis liefern (Karte zeigt sie per CSS `contain` mit dunklem Rahmen).
function adThumb(src: any) {
  return imgSet(src, '(max-width: 720px) 50vw, 320px', 1000)
}

export function Kiosk({data, lang = 'de'}: {data: any; lang?: Lang}) {
  const t = ui(lang)
  const panels = (data?.panels || []).filter((p: any) => p.slug)
  const articleCount = panels.filter((p: any) => p._panelType !== 'ad').length

  const cover = data?.coverImage?.asset
    ? imgSetCrop(data.coverImage, 2400, 1350, '100vw')
    : null
  const logo = data?.magazine?.logo?.asset
    ? imgUrl(data.magazine.logo, 900)
    : null
  const dateLabel = data?.publishDate
    ? new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'de-DE', {month: 'long', year: 'numeric'})
        .format(new Date(data.publishDate))
        .toUpperCase()
    : null
  const magName = data?.magazine?.name || 'E-MOUNTAINBIKE'

  return (
    <>
      {cover ? (
        <header className="kiosk-cover">
          <img className="kiosk-cover-bg" {...cover} alt="" aria-hidden />
          <Link href="/magazine" className="kiosk-up">
            ← Magazine
          </Link>
          <LangToggle lang={lang} variant="overlay" />
          <div className="kiosk-cover-logo">
            {logo ? <img src={logo} alt={magName} /> : <span>{magName}</span>}
          </div>
          <div className="kiosk-cover-foot">
            <p className="kiosk-cover-sub">{t.articlesInIssue(articleCount)}</p>
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
          <Link href="/magazine" className="kiosk-up kiosk-up--dark">
            ← Magazine
          </Link>
          <LangToggle lang={lang} variant="bar" />
          <div className="eyebrow">{magName}</div>
          <h1>#{data?.number} — {data?.title}</h1>
          <p className="kiosk-sub">{t.articlesInIssue(articleCount)}</p>
        </header>
      )}

      <div className="kiosk-offline">
        <OfflineSaver slugs={panels.map((p: any) => p.slug)} />
      </div>

      <div className="kiosk-grid">
        {panels.map((p: any) =>
          p._panelType === 'ad' ? (
            <Link key={p.slug} href={`/artikel/${p.slug}`} className="card card--ad">
              <div className="card-thumb">
                {p.thumb?.asset ? (
                  <img {...adThumb(p.thumb)} alt="" />
                ) : p.componentId && AD_POSTERS[p.componentId] ? (
                  <img src={AD_POSTERS[p.componentId]} alt="" />
                ) : (
                  <div className="card-thumb placeholder" />
                )}
                <div className="card-ad-badge" aria-label="Werbung">AD</div>
              </div>
              <div className="card-body">
                <div className="card-cat">{t.ad}</div>
                <div className="card-title">{p.sponsor}</div>
              </div>
            </Link>
          ) : (
            <Link key={p.slug} href={`/artikel/${p.slug}`} className="card">
              <div className="card-thumb">
                {p.thumb?.asset ? (
                  <img {...thumb(p.thumb)} alt="" />
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
