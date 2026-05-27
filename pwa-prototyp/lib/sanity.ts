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

// Body-Projektion (für beide Artikel-Typen identisch)
const BODY = `body[]{
  _type, _key,
  _type=="titlePage" => { "eyebrow": eyebrow.de, "title": title.de, "subtitle": subtitle.de, backgroundImage },
  _type=="articleText" => { "content": content.de },
  _type=="fullbleedPhoto" => { image, "caption": caption.de, scrollEffect },
  _type=="photoGrid" => { layout, images },
  _type=="pullQuote" => { "text": text.de, attribution }
}`

// Kiosk: Ausgabe + ihre Artikel (in Reihenfolge der Anlage).
const KIOSK_QUERY = `*[_type=="issue" && _id==$issueId][0]{
  number,
  "title": title.de,
  "magazine": magazine->{name, primaryColor},
  "articles": *[_type in ["articleEditorial","article"] && issue._ref == ^._id] | order(_createdAt asc){
    _type,
    "title": title_mag.de,
    "category": coalesce(category, select(_type=="articleEditorial" => "Editorial")),
    "slug": slug.current,
    "thumb": coalesce(heroImage, body[_type=="fullbleedPhoto"][0].image, body[_type=="titlePage"][0].backgroundImage)
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
const NAV_QUERY = `*[_type in ["articleEditorial","article"] && issue._ref==$issueId] | order(_createdAt asc){
  "title": title_mag.de,
  "slug": slug.current
}`

// ALLE Artikel der Ausgabe mit vollem Inhalt — fürs Swipe-Carousel (Panels nebeneinander).
const ISSUE_ARTICLES_FULL = `*[_type=="issue" && _id==$issueId][0]{
  "articles": *[_type in ["articleEditorial","article"] && issue._ref==^._id && defined(slug.current)] | order(_createdAt asc){
    _type,
    "slug": slug.current,
    "title": title_mag.de,
    "category": coalesce(category, select(_type=="articleEditorial" => "Editorial")),
    "author": author->name,
    "signature": signature.de,
    "magazine": magazine->{name, primaryColor},
    "issue": issue->{number, "title": title.de},
    ${BODY}
  }
}`

export async function getKiosk() {
  return client.fetch(KIOSK_QUERY, {issueId: ISSUE_ID})
}

export async function getArticle(slug: string) {
  return client.fetch(ARTICLE_QUERY, {slug})
}

export async function getIssueArticlesFull() {
  const res = await client.fetch(ISSUE_ARTICLES_FULL, {issueId: ISSUE_ID})
  return res?.articles ?? []
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
