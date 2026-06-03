import Link from 'next/link'
import {urlFor} from '@/lib/sanity'

function thumb(src: any) {
  return urlFor(src).width(900).height(600).fit('crop').auto('format').url()
}

export function Kiosk({data}: {data: any}) {
  const panels = (data?.panels || []).filter((p: any) => p.slug)
  const articleCount = panels.filter((p: any) => p._panelType !== 'ad').length

  return (
    <>
      <header className="kiosk-hero">
        <div className="eyebrow">{data?.magazine?.name || 'E-MOUNTAINBIKE'}</div>
        <h1>#{data?.number} — {data?.title}</h1>
        <p className="kiosk-sub">{articleCount} Artikel in dieser Ausgabe</p>
      </header>

      <div className="kiosk-grid">
        {panels.map((p: any) =>
          p._panelType === 'ad' ? (
            <Link key={p.slug} href={`/artikel/${p.slug}`} className="card card--ad">
              <div className="card-thumb">
                {p.thumb?.asset ? (
                  <img src={thumb(p.thumb)} alt="" />
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
    </>
  )
}
