'use client'

import {useEffect, useState} from 'react'
import {createPortal} from 'react-dom'
import {imgUrl, imgSet} from '@/lib/image'
import {AD_REGISTRY} from './ads/registry'

// Rendert ein Anzeigen-Panel im Swipe-Carousel.
//   - Standard-Modus: gestapelte Print-Bilder mit unsichtbaren rechteckigen Klick-Zonen
//     (Bitly-Links). Letterbox (dunkler Rahmen) signalisiert die andere Inhalts-Ebene.
//     Beim ERSTEN Anzeigen-Aufruf pro Browser-Session zeigen wir einen 3s-Toast
//     „Bereiche im Bild sind klickbar" — Print-treu, aber Mobile-User merken's.
//   - Custom-Modus: lädt eine React-Komponente aus AD_REGISTRY.

type ClickZone = {
  _key: string
  x: number
  y: number
  w: number
  h: number
  url?: string
  label?: string
  linkTarget?: 'url' | 'gallery'
}
type AdImage = {
  _key: string
  image: any
  altText?: string
  clickZones?: ClickZone[]
  imageMobile?: any
  clickZonesMobile?: ClickZone[]
}

type AdData = {
  _panelType: 'ad'
  sponsor: string
  mode: 'standard' | 'custom'
  componentId?: string
  images?: AdImage[]
  gallery?: any[]
  magazine?: {name: string; primaryColor?: string}
}

const TOAST_SESSION_KEY = '41mag.adToastShown'

export function AdView({data, active = true}: {data: AdData; active?: boolean}) {
  if (data.mode === 'custom') return <CustomAd componentId={data.componentId} />
  return <StandardAd data={data} active={active} />
}

// ─── Standard-Modus ────────────────────────────────────────────────────────────
function StandardAd({data, active}: {data: AdData; active: boolean}) {
  const [showToast, setShowToast] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)

  // Wichtig: das Carousel mountet ALLE Panels gleichzeitig (auch off-screen). Der Toast darf
  // deshalb NICHT beim Mount feuern — sonst erscheint er beim Öffnen jedes Artikels, dessen
  // Ausgabe eine Standard-Anzeige enthält. Er feuert erst, wenn diese Anzeige das AKTIVE Panel
  // im Carousel ist (`active`), und dann nur einmal pro Browser-Session.
  useEffect(() => {
    if (!active) return
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(TOAST_SESSION_KEY)) return
    const hasZones = (data.images || []).some(
      (img) => (img.clickZones?.length ?? 0) > 0 || (img.clickZonesMobile?.length ?? 0) > 0,
    )
    if (!hasZones) return
    sessionStorage.setItem(TOAST_SESSION_KEY, '1')
    setShowToast(true)
    const t = setTimeout(() => setShowToast(false), 3000)
    return () => clearTimeout(t)
  }, [active, data.images])

  const images = data.images || []
  const gallery = data.gallery || []
  const hasGallery = gallery.length > 0
  const openGallery = () => hasGallery && setLightbox(0)
  // Existiert eine Klick-Zone, die die Galerie öffnet? Dann ist die Galerie über das
  // Bild erreichbar → den separaten Thumbnail-Strip ausblenden (print-treuer). Ohne
  // solche Zone bleibt der Strip der einzige Zugang und wird weiter gezeigt.
  const hasGalleryZone = images.some(
    (img) =>
      (img.clickZones || []).some((z) => z.linkTarget === 'gallery') ||
      (img.clickZonesMobile || []).some((z) => z.linkTarget === 'gallery'),
  )
  const showGalleryStrip = hasGallery && !hasGalleryZone

  // Lightbox als Slideshow: Pfeil-Tasten + Escape, wenn offen.
  useEffect(() => {
    if (lightbox === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
      else if (e.key === 'ArrowRight') setLightbox((i) => (i === null ? i : (i + 1) % gallery.length))
      else if (e.key === 'ArrowLeft')
        setLightbox((i) => (i === null ? i : (i - 1 + gallery.length) % gallery.length))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, gallery.length])

  return (
    <div className="ad-view ad-view--standard">
      {/* Die Kennzeichnung „Anzeige · Sponsor" übernimmt die fixe Topbar des Carousels */}
      <div className="ad-view__stack">
        {images.map((img) => (
          <AdImageBlock key={img._key} img={img} hasGallery={hasGallery} onOpenGallery={openGallery} />
        ))}

        {showGalleryStrip && (
          <div className="ad-view__gallery">
            <div className="ad-view__gallery-title">Weitere Bilder</div>
            <div className="ad-view__gallery-grid">
              {gallery.map((g, i) => (
                <button
                  key={g._key || i}
                  type="button"
                  className="ad-view__gallery-thumb"
                  onClick={() => setLightbox(i)}
                  aria-label={`Bild ${i + 1} öffnen`}
                >
                  <img src={imgUrl(g, 600)} alt="" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Toast + Lightbox per Portal an document.body — sonst landen sie im
          transformierten Carousel-Track (position:fixed wird dann relativ zum
          Track positioniert → off-screen + vom overflow:hidden abgeschnitten). */}
      {showToast &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="ad-view__toast" role="status">
            Bereiche im Bild sind klickbar
          </div>,
          document.body,
        )}

      {lightbox !== null &&
        gallery[lightbox] &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="ad-view__lightbox" onClick={() => setLightbox(null)}>
          <img
            src={imgUrl(gallery[lightbox], 1800)}
            alt=""
            onClick={(e) => e.stopPropagation()}
          />

          {gallery.length > 1 && (
            <>
              <button
                type="button"
                className="ad-view__lightbox-nav prev"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightbox((i) => (i === null ? i : (i - 1 + gallery.length) % gallery.length))
                }}
                aria-label="Vorheriges Bild"
              >
                ‹
              </button>
              <button
                type="button"
                className="ad-view__lightbox-nav next"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightbox((i) => (i === null ? i : (i + 1) % gallery.length))
                }}
                aria-label="Nächstes Bild"
              >
                ›
              </button>
              <div className="ad-view__lightbox-counter">
                {lightbox + 1} / {gallery.length}
              </div>
            </>
          )}

            <button
              type="button"
              className="ad-view__lightbox-close"
              onClick={() => setLightbox(null)}
              aria-label="Schließen"
            >
              ×
            </button>
          </div>,
          document.body,
        )}
    </div>
  )
}

function AdImageBlock({
  img,
  hasGallery,
  onOpenGallery,
}: {
  img: AdImage
  hasGallery: boolean
  onOpenGallery: () => void
}) {
  if (!img.image?.asset) return null
  const hasMobile = !!img.imageMobile?.asset

  // Zonen einer Variante rendern — Galerie-Zone → Slideshow, sonst externer Link.
  const renderZones = (zones?: ClickZone[]) =>
    (zones || []).map((z) => {
      const pos = {
        left: `${z.x * 100}%`,
        top: `${z.y * 100}%`,
        width: `${z.w * 100}%`,
        height: `${z.h * 100}%`,
      }
      if (z.linkTarget === 'gallery' && hasGallery) {
        return (
          <button
            key={z._key}
            type="button"
            className="ad-view__zone"
            aria-label={z.label || 'Bildergalerie öffnen'}
            onClick={onOpenGallery}
            style={pos}
          />
        )
      }
      if (!z.url) return null
      return (
        <a
          key={z._key}
          href={z.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="ad-view__zone"
          aria-label={z.label || `Link zu ${z.url}`}
          style={pos}
        />
      )
    })

  // srcset (Hebel A): Phone lädt die passende Stufe statt 2560 px. Anzeigen = Vollbild → '100vw'.
  const setLandscape = imgSet(img.image, '100vw')
  const setMobile = hasMobile ? imgSet(img.imageMobile, '100vw') : null

  return (
    <div className="ad-view__image-block">
      {/* Querformat — Standard; im Hochformat ausgeblendet, FALLS eine Mobil-Variante existiert. */}
      <div className={`ad-view__variant ad-view__variant--landscape${hasMobile ? ' has-mobile' : ''}`}>
        <img className="ad-view__image" {...setLandscape} alt={img.altText || ''} />
        {renderZones(img.clickZones)}
      </div>

      {/* Hochformat — nur wenn geliefert; nur im Hochformat sichtbar. */}
      {hasMobile && setMobile && (
        <div className="ad-view__variant ad-view__variant--portrait">
          <img className="ad-view__image" {...setMobile} alt={img.altText || ''} />
          {renderZones(img.clickZonesMobile)}
        </div>
      )}
    </div>
  )
}

// ─── Custom-Modus ──────────────────────────────────────────────────────────────
function CustomAd({componentId}: {componentId?: string}) {
  if (!componentId || !AD_REGISTRY[componentId]) {
    return (
      <div className="ad-view ad-view--custom-missing">
        <p>
          Custom-Modul <code>{componentId || '(keine ID gesetzt)'}</code> nicht in der Ad-Registry
          gefunden.
        </p>
      </div>
    )
  }
  const Comp = AD_REGISTRY[componentId]
  return (
    <div className="ad-view ad-view--custom">
      <Comp />
    </div>
  )
}
