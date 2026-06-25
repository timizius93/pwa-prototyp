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
// Last-Test (nächste Session, Lazy-Mount): hier temporär 'issue-lasttest' setzen + neu bauen.
export const ISSUE_ID = 'issue-emtb-042'

// --- Sprache (i18n) -------------------------------------------------------
// Reader-Inhalte sind durchgängig localeString/Text/BlockContent (DE + EN). Der
// Reader liest die per Cookie gewählte Sprache; jede Projektion fällt mit
// `coalesce(feld.<lang>, feld.de)` auf Deutsch zurück, wo noch kein EN gepflegt ist.
export type Lang = 'de' | 'en'
export const asLang = (v: unknown): Lang => (v === 'en' ? 'en' : 'de')

// Gemeinsame Sortier-Logik: Panels (Artikel + Anzeigen) werden nach `position` gemischt.
// Items ohne explizite Position landen ans Ende (9999); innerhalb gleicher Position bleibt die
// Anlage-Reihenfolge stabil. Anzeigen bekommen einen synthetischen Slug `ad-<id>`, damit der
// Carousel sie genauso adressieren kann wie Artikel.
const PANEL_ORDER = `order(coalesce(position, 9999) asc, _createdAt asc)`

// Body-Projektion pro Sprache (für beide Artikel-Typen identisch).
// `s()` = einzelnes localeString/Text/BlockContent mit DE-Fallback.
// `a()` = Array lokalisierter Strings (z. B. tops[]/flops[]/cells[]) — pro Element
//         kein Fallback, aber die Pilot-Inhalte sind DE+EN geseedet.
function bodyProjection(l: Lang) {
  const s = (p: string) => `coalesce(${p}.${l}, ${p}.de)`
  const a = (p: string) => `${p}[].${l}`
  return `body[]{
  _type, _key,
  _type=="titlePage" => { "eyebrow": ${s('eyebrow')}, "title": ${s('title')}, "subtitle": ${s('subtitle')}, "creditByline": ${s('creditByline')}, backgroundImage, foregroundImage, coverArtwork, coverArtworkMobile },
  _type=="articleText" => { "content": ${s('content')} },
  _type=="fullbleedPhoto" => { image, "caption": ${s('caption')}, display, scrollEffect, "gearList": gearList[]{ "label": ${s('label')}, value } },
  _type=="photoGrid" => { layout, "images": images[]{ ..., "caption": ${s('caption')} } },
  _type=="highlightBlock" => {
    variant,
    "heading": ${s('heading')},
    "body": ${s('body')},
    "items": items[]{ "title": ${s('title')}, "body": ${s('body')} }
  },
  _type=="pullQuote" => { "text": ${s('text')}, attribution },
  _type=="specLine" => { bikeName, motor, travelFront_mm, travelRear_mm, weight_kg, weight_size, price_eur, manufacturerLink },
  _type=="hotspotImage" => {
    baseImage,
    "hotspots": hotspots[]{ _key, x, y, "label": ${s('label')}, detailImage, "detailText": ${s('detailText')} }
  },
  _type=="geometryOverlay" => {
    bikePhoto, photographedSize,
    "annotations": annotations[]{ _key, metric, customLabel, x1, y1, x2, y2 },
    "measurements": measurements[]{ _key, size, reach_mm, stack_mm, headAngle_deg, seatAngle_deg, chainstay_mm, wheelbase_mm, topTube_mm, headTube_mm, seatTube_mm },
    "disclaimer": ${s('disclaimer')}
  },
  _type=="interactiveBike" => {
    bikePhoto, photographedSize,
    "hotspots": hotspots[]{ _key, x, y, "label": ${s('label')}, detailImage, "detailText": ${s('detailText')} },
    "annotations": annotations[]{ _key, metric, customLabel, x1, y1, x2, y2 },
    "measurements": measurements[]{ _key, size, reach_mm, stack_mm, headAngle_deg, seatAngle_deg, chainstay_mm, wheelbase_mm, topTube_mm, headTube_mm, seatTube_mm },
    "disclaimer": ${s('disclaimer')}
  },
  _type=="tuningTip" => { "tip": ${s('tip')} },
  _type=="verdictPanel" => { "headline": ${s('headline')}, "verdict": ${s('verdict')}, "tops": ${a('tops')}, "flops": ${a('flops')}, backgroundImage, overlayStyle },
  _type=="comparisonTable" => {
    "title": ${s('title')},
    "columns": columns[]{ "label": ${s('label')}, unit, numeric },
    "rows": rows[]{ "cells": ${a('cells')} },
    "notes": ${s('notes')}
  },
  _type=="awardBox" => { awardType, "customLabel": ${s('customLabel')}, winnerName, winnerImage, badge, "verdict": ${s('verdict')} },
  _type=="testerCarousel" => {
    "title": ${s('title')},
    "testers": testers[]->{ _id, name, "role": roleDefault, "bio": ${s('bio')}, portrait }
  },
  _type=="ctaBlock" => { "headline": ${s('headline')}, "buttonLabel": ${s('buttonLabel')}, targetUrl }
}`
}

// Kiosk: Ausgabe + Panels (Artikel UND Anzeigen, gemeinsam sortiert nach `position`).
// Anzeigen werden mit eigenem `_panelType: 'ad'` markiert, damit der Kiosk sie als AD-Card
// rendert (mit AD-Badge + Sponsor-Name). Artikel kriegen `_panelType: 'article'`.
function kioskQuery(l: Lang) {
  return `*[_type=="issue" && _id==$issueId][0]{
  number,
  "title": coalesce(title.${l}, title.de),
  coverImage,
  publishDate,
  "magazine": magazine->{name, primaryColor, logo},
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
      "componentId": componentId,
      "thumb": images[0].image
    },
    _type in ["articleEditorial","article"] => {
      "_panelType": "article",
      "title": coalesce(title_mag.${l}, title_mag.de),
      "category": coalesce(category, select(_type=="articleEditorial" => "Editorial")),
      "slug": slug.current,
      "thumb": coalesce(heroImage, body[_type=="fullbleedPhoto"][0].image, body[_type=="titlePage"][0].backgroundImage)
    }
  }
}`
}

// Ein Artikel per Slug (funktioniert für Editorial UND generischen Artikel).
function articleQuery(l: Lang) {
  return `*[defined(slug.current) && slug.current==$slug][0]{
  _type,
  "title": coalesce(title_mag.${l}, title_mag.de),
  "category": coalesce(category, select(_type=="articleEditorial" => "Editorial")),
  "author": author->name,
  "signature": coalesce(signature.${l}, signature.de),
  "magazine": magazine->{name, primaryColor},
  "issue": issue->{number, "title": coalesce(title.${l}, title.de)},
  ${bodyProjection(l)}
}`
}

// Reihenfolge der Slugs in der Ausgabe — für „vorheriger / nächster Artikel".
function navQuery(l: Lang) {
  return `*[_type in ["articleEditorial","article"] && issue._ref==$issueId] | ${PANEL_ORDER}{
  "title": coalesce(title_mag.${l}, title_mag.de),
  "slug": slug.current
}`
}

// ALLE Panels der Ausgabe (Artikel + Anzeigen) mit vollem Inhalt — fürs Swipe-Carousel.
// Anzeigen kommen mit `_panelType: 'ad'` und Standard- ODER Custom-Mode-Feldern.
function issuePanelsQuery(l: Lang) {
  return `*[_type=="issue" && _id==$issueId][0]{
  "panels": *[
    (
      (_type in ["articleEditorial","article"] && defined(slug.current))
      || (_type=="advertisement" && (!defined(language) || language=="both" || language=="${l}"))
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
      "thumb": images[0].image,
      "magazine": magazine->{name, primaryColor},
      "issue": issue->{number, "title": coalesce(title.${l}, title.de)},
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
      "title": coalesce(title_mag.${l}, title_mag.de),
      "category": coalesce(category, select(_type=="articleEditorial" => "Editorial")),
      "author": author->name,
      "signature": coalesce(signature.${l}, signature.de),
      "thumb": coalesce(heroImage, body[_type=="fullbleedPhoto"][0].image, body[_type=="titlePage"][0].coverArtwork, body[_type=="titlePage"][0].backgroundImage),
      "magazine": magazine->{name, primaryColor},
      "issue": issue->{number, "title": coalesce(title.${l}, title.de)},
      ${bodyProjection(l)}
    }
  }
}`
}

// 41-Publishing-Regal: alle Magazine in Sanity + ihre jeweils neueste LESBARE Ausgabe
// (Kachel-Cover + „Aktuelle Ausgabe"-Pill). Lesbar = hat Artikel — Platzhalter-Ausgaben
// (z. B. #043 nur mit Cover) sollen die Regal-Kachel nicht kapern, der Kiosk zeigt ja
// weiter die Ausgabe mit Inhalt. Die Magazine, die noch nicht in Sanity existieren,
// ergänzt die Regal-Seite als statische „Bald in der App"-Kacheln (app/magazine/page.tsx).
const SHELF_QUERY = `*[_type=="magazine"]{
  name,
  "slug": slug.current,
  primaryColor,
  logo,
  "latestIssue": *[
    _type=="issue" && magazine._ref==^._id
    && count(*[_type in ["articleEditorial","article"] && issue._ref==^._id]) > 0
  ] | order(number desc)[0]{
    number, "title": title.de, coverImage, publishDate
  }
}`

// Ausgaben-Übersicht EINES Magazins (alle Ausgaben, neueste zuerst).
const MAGAZINE_ISSUES_QUERY = `*[_type=="magazine" && slug.current==$slug][0]{
  name,
  "slug": slug.current,
  primaryColor,
  logo,
  "issues": *[_type=="issue" && magazine._ref==^._id] | order(number desc){
    number, "title": title.de, coverImage, publishDate,
    "articleCount": count(*[_type in ["articleEditorial","article"] && issue._ref==^._id])
  }
}`

export async function getMagazineShelf() {
  return client.fetch(SHELF_QUERY)
}

export async function getMagazineIssues(slug: string) {
  return client.fetch(MAGAZINE_ISSUES_QUERY, {slug})
}

export async function getKiosk(lang: Lang = 'de') {
  return client.fetch(kioskQuery(lang), {issueId: ISSUE_ID})
}

export async function getArticle(slug: string, lang: Lang = 'de') {
  return client.fetch(articleQuery(lang), {slug})
}

// Liefert ALLE Panels (Artikel + Anzeigen) der Pilot-Ausgabe mit vollem Inhalt,
// gemischt nach `position`. Jedes Panel hat `_panelType: 'article' | 'ad'`.
export async function getIssuePanels(lang: Lang = 'de') {
  const res = await client.fetch(issuePanelsQuery(lang), {issueId: ISSUE_ID})
  return res?.panels ?? []
}

export async function getNav(slug: string, lang: Lang = 'de') {
  const items: {title: string; slug: string}[] = await client.fetch(navQuery(lang), {issueId: ISSUE_ID})
  const list = items.filter((a) => a.slug)
  const i = list.findIndex((a) => a.slug === slug)
  return {
    prev: i > 0 ? list[i - 1] : null,
    next: i >= 0 && i < list.length - 1 ? list[i + 1] : null,
  }
}
