import {urlFor} from './sanity'

// ---------------------------------------------------------------------------
// Image-Delivery-Spike (Mess-Sprint) — zwei Hebel gegen die Bild-Bandbreite:
//
//  Hebel A — srcset/sizes: Statt überall die Desktop-Auflösung (2000–2560 px) zu
//            laden, liefert der Browser die passende Größe fürs Gerät. Ein Phone
//            lädt bei 100vw ~768–1440 px statt 2560 px → −60 bis −80 % mobil.
//
//  Hebel B — eigener Bild-Host: Wenn NEXT_PUBLIC_IMAGE_HOST gesetzt ist, laufen
//            alle Bild-URLs über diese Domain (z. B. images.41publishing.com)
//            statt direkt über cdn.sanity.io. Davor sitzt Cloudflare und cached
//            die Bilder → Sanity-Origin-Last (= kostenpflichtige Bandbreite) geht
//            gegen 0. Das ist die Lösung der ~$600/Ausgabe-Falle aus
//            docs/skeptiker-review.md §3.3.
//
// Default (Host leer) = heutiges Verhalten, cdn.sanity.io, nichts bricht.
// Beim Aktivieren des Hosts: public/sw.js + components/OfflineSaver.tsx filtern
// auf den Bild-Host — dort denselben Host ergänzen (siehe docs/image-delivery-spike.md).
// ---------------------------------------------------------------------------

const SANITY_CDN = 'https://cdn.sanity.io'
const IMAGE_HOST = process.env.NEXT_PUBLIC_IMAGE_HOST?.trim()

/**
 * Ist die Bildquelle auflösbar? Platzhalter-Blöcke (Pilot-Inhalt ohne Bild) liefern
 * `null`/leeres Objekt — dann darf `urlFor()` NICHT aufgerufen werden (wirft sonst
 * „Unable to resolve image URL from source"). Komponenten prüfen hiermit vor dem <img>.
 */
export function hasImage(src: any): boolean {
  return !!(src && (src.asset || src._ref || src._id || typeof src === 'string'))
}

/** Tauscht cdn.sanity.io gegen die eigene (Cloudflare-)Domain, falls konfiguriert. */
export function withImageHost(url: string): string {
  if (!IMAGE_HOST) return url
  return url.replace(SANITY_CDN, `https://${IMAGE_HOST}`)
}

/**
 * Einzel-URL — ersetzt die lokalen `img(src, w)`-Helper der Komponenten.
 * Läuft durch den Host-Swap, damit AUCH Bilder ohne srcset (Thumbs, Logos, Siegel)
 * vom künftigen CDN-Layer profitieren — nicht nur die großen srcset-Bilder.
 */
export function imgUrl(src: any, width: number): string {
  if (!hasImage(src)) return '' // Platzhalter ohne Bild → leere URL statt Crash
  return withImageHost(urlFor(src).width(width).fit('max').auto('format').url())
}

// srcset-Leiter: deckt Phone (390–430 px CSS × DPR 2–3) bis Desktop-Retina ab.
// Sanity rendert jede Breite on-the-fly, die Leiter ist also frei wählbar.
const WIDTHS = [480, 640, 768, 1080, 1440, 1920, 2560]
// Fallback-src für Browser ohne srcset-Support UND die EINE Auflösung, die offline
// gecacht wird (siehe OfflineSaver) — bewusst mittig, damit offline nicht 7 Varianten landen.
const FALLBACK_WIDTH = 1200

type ImgProps = {src: string; srcSet: string; sizes: string}

/**
 * Volle srcset-Props für ein „freies" Bild (fit=max, kein fester Zuschnitt).
 * `sizes` beschreibt, wie breit das Bild im Layout dargestellt wird (Default: volle
 * Viewport-Breite). Direkt aufs <img> spreaden: `<img {...imgSet(src)} alt="" />`.
 */
export function imgSet(src: any, sizes = '100vw', maxWidth = 2560): ImgProps {
  if (!hasImage(src)) return {src: '', srcSet: '', sizes}
  const ladder = WIDTHS.filter((w) => w <= maxWidth)
  if (ladder[ladder.length - 1] !== maxWidth) ladder.push(maxWidth)
  return {
    src: imgUrl(src, Math.min(FALLBACK_WIDTH, maxWidth)),
    srcSet: ladder.map((w) => `${imgUrl(src, w)} ${w}w`).join(', '),
    sizes,
  }
}

/**
 * srcset-Props für ein Bild mit festem Seitenverhältnis (fit=crop, z. B. Kiosk-Thumbs
 * und Cover). Skaliert Breite UND Höhe proportional über die DPR-Stufen, damit der
 * Zuschnitt identisch bleibt und der Browser trotzdem die passende Auflösung wählt.
 */
export function imgSetCrop(src: any, width: number, height: number, sizes: string): ImgProps {
  if (!hasImage(src)) return {src: '', srcSet: '', sizes}
  const ratio = height / width
  const url = (w: number) =>
    withImageHost(
      urlFor(src)
        .width(w)
        .height(Math.round(w * ratio))
        .fit('crop')
        .auto('format')
        .url(),
    )
  const ladder = WIDTHS.filter((w) => w <= width * 1.5) // bis ~1.5× der CSS-Zielbreite reicht für Retina
  if (!ladder.includes(width)) ladder.push(width)
  return {
    src: url(width),
    srcSet: ladder.map((w) => `${url(w)} ${w}w`).join(', '),
    sizes,
  }
}
