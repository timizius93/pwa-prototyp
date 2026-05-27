import Link from 'next/link'
import {urlFor} from '@/lib/sanity'

function thumb(src: any) {
  return urlFor(src).width(900).height(600).fit('crop').auto('format').url()
}

export function Kiosk({data}: {data: any}) {
  const articles = (data?.articles || []).filter((a: any) => a.slug)

  return (
    <>
      <header className="kiosk-hero">
        <div className="eyebrow">{data?.magazine?.name || 'E-MOUNTAINBIKE'}</div>
        <h1>#{data?.number} — {data?.title}</h1>
        <p className="kiosk-sub">{articles.length} Artikel in dieser Ausgabe</p>
      </header>

      <div className="kiosk-grid">
        {articles.map((a: any) => (
          <Link key={a.slug} href={`/artikel/${a.slug}`} className="card">
            <div className="card-thumb">
              {a.thumb?.asset ? (
                <img src={thumb(a.thumb)} alt="" />
              ) : (
                <div className="card-thumb placeholder" />
              )}
            </div>
            <div className="card-body">
              {a.category && <div className="card-cat">{a.category}</div>}
              <div className="card-title">{a.title}</div>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
