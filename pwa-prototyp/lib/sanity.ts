import {createClient} from '@sanity/client'
import {createImageUrlBuilder} from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.SANITY_API_VERSION || '2021-06-07',
  token: process.env.SANITY_READ_TOKEN,
  useCdn: false, // immer frisch (Pilot/Preview) — Caching kommt später über CDN-Schicht
  perspective: 'drafts', // zeigt den aktuellen Entwurfsstand (noch nicht veröffentlicht)
})

const builder = createImageUrlBuilder(client)
export const urlFor = (src: any) => builder.image(src)

// Die Pilot-Ausgabe, die der Kiosk zeigt.
export const ISSUE_ID = 'issue-emtb-042'

// Gemeinsame Sortier-Logik: Panels (Artikel + Anzeigen) werden nach `position` gemischt.
// Items ohne explizite Position landen ans Ende (9999); innerhalb gleicher Position bleibt die
// Anlage-Reihenfolge stabil. Anzeigen bekommen einen synthetischen Slug `ad-<id>`, damit der
// Carousel sie genauso adressieren kann wie Artikel.
const PANEL_ORDER = `order(coalesce(position, 9999) asc, _createdAt asc)`

// Body-Projektion (für beide Artikel-Typen identisch)
const BODY = `body[]{
  _type, _key,
  _type=="titlePage" => { "eyebrow": eyebrow.de, "title": title.de, "subtitle": subtitle.de, "creditByline": creditByline.de, backgroundImage, foregroundImage, coverArtwork, coverArtworkMobile },
  _type=="articleText" => { "content": content.de },
  _type=="fullbleedPhoto" => { image, "caption": caption.de, scrollEffect },
  _type=="photoGrid" => { layout, images },
  _type=="pullQuote" => { "text": text.de, attribution },
  _type=="specLine" => { bikeName, motor, travelFront_mm, travelRear_mm, weight_kg, weight_size, price_eur, manufacturerLink },
  _type=="hotspotImage" => {
    baseImage,
    "hotspots": hotspots[]{ _key, x, y, "label": label.de, detailImage, "detailText": detailText.de }
  },
  _type=="geometryOverlay" => {
    bikePhoto, photographedSize,
    "annotations": annotations[]{ _key, metric, customLabel, x1, y1, x2, y2 },
    "measurements": measurements[]{ _key, size, reach_mm, stack_mm, headAngle_deg, seatAngle_deg, chainstay_mm, wheelbase_mm, topTube_mm, headTube_mm, seatTube_mm },
    "disclaimer": disclaimer.de
  },
  _type=="interactiveBike" => {
    bikePhoto, photographedSize,
    "hotspots": hotspots[]{ _key, x, y, "label": label.de, detailImage, "detailText": detailText.de },
    "annotations": annotations[]{ _key, metric, customLabel, x1, y1, x2, y2 },
    "measurements": measurements[]{ _key, size, reach_mm, stack_mm, headAngle_deg, seatAngle_deg, chainstay_mm, wheelbase_mm, topTube_mm, headTube_mm, seatTube_mm },
    "disclaimer": disclaimer.de
  },
  _type=="tuningTip" => { "tip": tip.de },
  _type=="verdictPanel" => { "headline": headline.de, "verdict": verdict.de, "tops": tops[].de, "flops": flops[].de, backgroundImage, overlayStyle },
  _type=="ctaBlock" => { "headline": headline.de, "buttonLabel": buttonLabel.de, targetUrl }
}`

// Kiosk: Ausgabe + Panels (Artikel UND Anzeigen, gemeinsam sortiert nach `position`).
// Anzeigen werden mit eigenem `_panelType: 'ad'` markiert, damit der Kiosk sie als AD-Card
// rendert (mit AD-Badge + Sponsor-Name). Artikel kriegen `_panelType: 'article'`.
const KIOSK_QUERY = `*[_type=="issue" && _id==$issueId][0]{
  number,
  "title": title.de,
  "magazine": magazine->{name, primaryColor},
  "panels": *[
    (_type in ["articleEditorial","article"] || _type=="advertisement")
    && issue._ref == ^._id
  ] | ${PANEL_ORDER} {
    _type,
    "position": position,
    _type=="advertisement" => {
      "_panelType": "ad",
      "slug": "ad-" + _id,
      "sponsor": sponsor,
      "mode": mode,
      "thumb": images[0].image
    },
    _type in ["articleEditorial","article"] => {
      "_panelType": "article",
      "title": title_mag.de,
      "category": coalesce(category, select(_type=="articleEditorial" => "Editorial")),
      "slug": slug.current,
      "thumb": coalesce(heroImage, body[_type=="fullbleedPhoto"][0].image, body[_type=="titlePage"][0].backgroundImage)
    }
  }
}`

// Ein Artikel per Slug (funktioniert für Editorial UND generischen Artikel).
const ARTICLE_QUERY = `*[defined(slug.current) && slug.current==$slug][0]{
  _type,
  "title": title_mag.de,
  "category": coalesce(category, select(_type=="articleEditorial" => "Editorial")),
  "author": author->name,
  "signature": signature.de,
  "magazine": magazine->{name, primaryColor},
  "issue": issue->{number, "title": title.de},
  ${BODY}
}`

// Reihenfolge der Slugs in der Ausgabe — für „vorheriger / nächster Artikel".
const NAV_QUERY = `*[_type in ["articleEditorial","article"] && issue._ref==$issueId] | ${PANEL_ORDER}{
  "title": title_mag.de,
  "slug": slug.current
}`

// ALLE Panels der Ausgabe (Artikel + Anzeigen) mit vollem Inhalt — fürs Swipe-Carousel.
// Anzeigen kommen mit `_panelType: 'ad'` und Standard- ODER Custom-Mode-Feldern.
const ISSUE_PANELS_FULL = `*[_type=="issue" && _id==$issueId][0]{
  "panels": *[
    (
      (_type in ["articleEditorial","article"] && defined(slug.current))
      || _type=="advertisement"
    )
    && issue._ref==^._id
  ] | ${PANEL_ORDER} {
    _type,
    "position": position,
    _type=="advertisement" => {
      "_panelType": "ad",
      "slug": "ad-" + _id,
      "sponsor": sponsor,
      "mode": mode,
      "componentId": componentId,
      "magazine": magazine->{name, primaryColor},
      "issue": issue->{number, "title": title.de},
      "images": images[]{
        _key,
        image,
        altText,
        "clickZones": clickZones[]{ _key, x, y, w, h, url, label, linkTarget },
        imageMobile,
        "clickZonesMobile": clickZonesMobile[]{ _key, x, y, w, h, url, label, linkTarget }
      },
      "gallery": gallery[]{ _key, asset, hotspot, crop }
    },
    _type in ["articleEditorial","article"] => {
      "_panelType": "article",
      "slug": slug.current,
      "title": title_mag.de,
      "category": coalesce(category, select(_type=="articleEditorial" => "Editorial")),
      "author": author->name,
      "signature": signature.de,
      "magazine": magazine->{name, primaryColor},
      "issue": issue->{number, "title": title.de},
      ${BODY}
    }
  }
}`

export async function getKiosk() {
  return client.fetch(KIOSK_QUERY, {issueId: ISSUE_ID})
}

export async function getArticle(slug: string) {
  return client.fetch(ARTICLE_QUERY, {slug})
}

// Liefert ALLE Panels (Artikel + Anzeigen) der Pilot-Ausgabe mit vollem Inhalt,
// gemischt nach `position`. Jedes Panel hat `_panelType: 'article' | 'ad'`.
export async function getIssuePanels() {
  const res = await client.fetch(ISSUE_PANELS_FULL, {issueId: ISSUE_ID})
  return res?.panels ?? []
}

export async function getNav(slug: string) {
  const items: {title: string; slug: string}[] = await client.fetch(NAV_QUERY, {issueId: ISSUE_ID})
  const list = items.filter((a) => a.slug)
  const i = list.findIndex((a) => a.slug === slug)
  return {
    prev: i > 0 ? list[i - 1] : null,
    next: i >= 0 && i < list.length - 1 ? list[i + 1] : null,
  }
}
