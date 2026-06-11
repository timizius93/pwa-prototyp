import Link from 'next/link'
import {notFound} from 'next/navigation'
import {getMagazineIssues, urlFor} from '@/lib/sanity'
import {BRAND_LOGOS} from '@/lib/brandLogos'

export const dynamic = 'force-dynamic'

// Mittlere Navigations-Ebene: alle Ausgaben EINES Magazins (neueste zuerst).
// Im Pilot existiert nur E-MTB #042 — jede Ausgaben-Karte führt deshalb auf den
// bestehenden Kiosk unter `/`. Sobald mehrere Ausgaben existieren, braucht der
// Kiosk eine eigene Route pro Ausgabe (z. B. /ausgabe/<id>) — Produktions-Thema.
export default async function Page({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const mag = await getMagazineIssues(slug)
  if (!mag) notFound()

  const issues: any[] = mag.issues || []

  const dateLabel = (d?: string) =>
    d
      ? new Intl.DateTimeFormat('de-DE', {month: 'long', year: 'numeric'})
          .format(new Date(d))
          .toUpperCase()
      : null

  return (
    <main className="mag-issues" style={mag.primaryColor ? ({'--mag': mag.primaryColor} as any) : undefined}>
      <header className="mag-issues-head">
        <Link href="/magazine" className="mag-back">
          ← Alle Magazine
        </Link>
        {/* pos-Logo (farbig, für hellen Grund) — NICHT das weiße Sanity-Logo-Asset */}
        {BRAND_LOGOS[mag.slug]?.pos ? (
          <h1 className="mag-issues-name">
            <img className="mag-issues-logo" src={BRAND_LOGOS[mag.slug].pos} alt={mag.name} />
          </h1>
        ) : (
          <h1 className="mag-issues-name">{mag.name}</h1>
        )}
      </header>

      <div className="issues-grid">
        {issues.map((iss) => {
          // Hochformat-Karte wie ein Heft im Regal (Tim, 11.06.) — 4:5-Crop,
          // der Bildausschnitt folgt dem Hotspot aus dem Studio.
          const cover = iss.coverImage?.asset
            ? urlFor(iss.coverImage).width(1200).height(1500).fit('crop').auto('format').url()
            : null
          return (
            <Link key={iss.number} href="/" className="issue-card">
              <div className="issue-card-cover">
                {cover ? <img src={cover} alt="" /> : <div className="issue-card-empty" />}
                <span className="issue-card-num">#{String(iss.number).padStart(3, '0')}</span>
              </div>
              <div className="issue-card-body">
                {dateLabel(iss.publishDate) && (
                  <div className="issue-card-date">{dateLabel(iss.publishDate)}</div>
                )}
                <div className="issue-card-title">{iss.title}</div>
                {iss.articleCount > 0 && (
                  <div className="issue-card-count">{iss.articleCount} Artikel</div>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      <p className="issues-hint">Ältere Ausgaben erscheinen hier, sobald sie in der PWA verfügbar sind.</p>
    </main>
  )
}
