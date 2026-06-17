import Link from 'next/link'
import {getMagazineShelf} from '@/lib/sanity'
import {imgUrl, imgSetCrop} from '@/lib/image'
import {BRAND_LOGOS} from '@/lib/brandLogos'

export const dynamic = 'force-dynamic'

// Oberste Ebene der Navigation: 41 Publishing → Magazin wählen → Ausgaben → Ausgabe lesen.
// Die vier Verlags-Marken sind fix; was davon schon in Sanity existiert (aktuell nur E-MTB),
// wird zur aktiven Kachel mit Cover der neuesten Ausgabe — der Rest zeigt als „Bald in der
// App"-Kachel die Multi-Magazin-Vision (Pitch-Argument, Julian designt später drüber).
const BRANDS = [
  {slug: 'emtb', name: 'E-MOUNTAINBIKE'},
  {slug: 'enduro', name: 'ENDURO'},
  {slug: 'granfondo', name: 'GRAN FONDO'},
  {slug: 'downtown', name: 'DOWNTOWN'},
]

export default async function Page() {
  const inSanity: any[] = (await getMagazineShelf()) || []

  const dateLabel = (d?: string) =>
    d
      ? new Intl.DateTimeFormat('de-DE', {month: 'long', year: 'numeric'}).format(new Date(d))
      : null

  return (
    <main className="shelf">
      <header className="shelf-head">
        <img className="shelf-publisher-logo" src="/logos/41publishing.png" alt="41 Publishing" />
        <h1>Unsere Magazine</h1>
        <p className="shelf-sub">Vier Magazine. Ein Reader.</p>
      </header>

      <div className="shelf-grid">
        {BRANDS.map((brand) => {
          const mag = inSanity.find((m) => m.slug === brand.slug)
          const negLogo = BRAND_LOGOS[brand.slug]?.neg
          const logoClass = `shelf-tile-logo${BRAND_LOGOS[brand.slug]?.stacked ? ' is-stacked' : ''}`

          if (!mag) {
            return (
              <div key={brand.slug} className="shelf-tile is-soon" aria-disabled="true">
                <div className="shelf-tile-inner">
                  {negLogo ? (
                    <img className={logoClass} src={negLogo} alt={brand.name} />
                  ) : (
                    <span className="shelf-tile-name">{brand.name}</span>
                  )}
                  <span className="shelf-soon-pill">Bald in der App</span>
                </div>
              </div>
            )
          }

          const cover = mag.latestIssue?.coverImage?.asset
            ? imgSetCrop(mag.latestIssue.coverImage, 1400, 900, '(max-width: 720px) 100vw, 600px')
            : null
          // Lokales Verlags-Logo (neg = weiß) vor dem Sanity-Asset bevorzugen
          const logo =
            negLogo || (mag.logo?.asset ? imgUrl(mag.logo, 700) : null)
          const issueLine = mag.latestIssue
            ? `Aktuelle Ausgabe #${String(mag.latestIssue.number).padStart(3, '0')}${
                dateLabel(mag.latestIssue.publishDate) ? ` · ${dateLabel(mag.latestIssue.publishDate)}` : ''
              }`
            : null

          return (
            <Link key={brand.slug} href={`/magazine/${mag.slug}`} className="shelf-tile is-active">
              {cover && <img className="shelf-tile-bg" {...cover} alt="" aria-hidden />}
              <div className="shelf-tile-inner">
                {logo ? (
                  <img className={logoClass} src={logo} alt={mag.name} />
                ) : (
                  <span className="shelf-tile-name">{mag.name}</span>
                )}
                {issueLine && <span className="shelf-issue-pill">{issueLine}</span>}
              </div>
            </Link>
          )
        })}
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
    </main>
  )
}
