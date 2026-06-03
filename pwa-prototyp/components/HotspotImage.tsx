'use client'

import {useState} from 'react'
import {urlFor} from '@/lib/sanity'

// Interaktives Foto mit +-Markern. Antippen öffnet ein Overlay (Detail-Foto + Text).
//
// Das Overlay-/Popup-Muster (Marker → eingeblendetes Panel über dem Bild) ist bewusst generisch
// gehalten: das ein-/ausblendbare Geometrie-Overlay kann später dieselbe Mechanik nutzen
// (State „welches Element ist offen", Schließen per Backdrop/×, Bild als skalierende Bühne).

type Hotspot = {
  _key: string
  x: number
  y: number
  label?: string
  detailImage?: any
  detailText?: string
}

function img(src: any, w: number) {
  return urlFor(src).width(w).fit('max').auto('format').url()
}

export function HotspotImage({block}: {block: any}) {
  const [open, setOpen] = useState<string | null>(null)
  const hotspots: Hotspot[] = (block.hotspots || []).filter(
    (h: Hotspot) => typeof h.x === 'number' && typeof h.y === 'number',
  )
  const active = hotspots.find((h) => h._key === open) || null

  if (!block.baseImage?.asset) return null

  return (
    <figure className="hotspot-figure">
      <div className="hotspot-stage">
        <img className="hotspot-base" src={img(block.baseImage, 2000)} alt="" loading="lazy" />

        {hotspots.map((h) => (
          <button
            key={h._key}
            type="button"
            className={`hotspot-marker${open === h._key ? ' is-open' : ''}`}
            style={{left: `${h.x * 100}%`, top: `${h.y * 100}%`}}
            onClick={() => setOpen(open === h._key ? null : h._key)}
            aria-label={h.label || 'Detail anzeigen'}
          >
            <span className="dot" />
          </button>
        ))}

        {active && (
          <div className="hotspot-popup" role="dialog" onClick={() => setOpen(null)}>
            <div className="hotspot-card" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="hotspot-close" onClick={() => setOpen(null)} aria-label="Schließen">
                ×
              </button>
              {active.detailImage?.asset && (
                <img className="hotspot-detail" src={img(active.detailImage, 1400)} alt={active.label || ''} />
              )}
              {(active.label || active.detailText) && (
                <div className="hotspot-text">
                  {active.label && <strong>{active.label}</strong>}
                  {active.detailText && <p>{active.detailText}</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <figcaption className="hotspot-hint">Tippe die Punkte für Details</figcaption>
    </figure>
  )
}
