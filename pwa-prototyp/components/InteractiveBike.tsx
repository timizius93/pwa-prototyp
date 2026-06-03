'use client'

import {useEffect, useState} from 'react'
import {createPortal} from 'react-dom'
import {urlFor} from '@/lib/sanity'
import {availableSizes, buildItems, COLLAPSE_AT, parseImageDims} from '@/lib/geometry'
import {GeometrySvg} from './GeometrySvg'

// Kombi-Baustein „Interaktives Bike": EIN Bike-Foto, oben ein Umschalter Details ↔ Geometrie.
// - Details: klickbare +-Marker → Detail-Popups (wie HotspotImage).
// - Geometrie: Maßlinien + Größen-Switcher + Phone-Werteliste (wie GeometryOverlay).
// Das Foto bleibt beim Umschalten stehen (eine <img>-Bühne), nur die Overlays wechseln.
// Spiegelt das Modell der nativen App; Geometrie-Logik geteilt über lib/geometry.ts.

type Mode = 'details' | 'geometry'

function img(src: any, w: number) {
  return urlFor(src).width(w).fit('max').auto('format').url()
}

export function InteractiveBike({block}: {block: any}) {
  // --- Details (Hotspots) ---
  const hotspots = (block.hotspots || []).filter(
    (h: any) => typeof h.x === 'number' && typeof h.y === 'number',
  )
  const [open, setOpen] = useState<string | null>(null)

  // --- Geometrie ---
  const measurements = (block.measurements || []).filter((m: any) => m?.size)
  const sizes = availableSizes(measurements)
  const annotations = (block.annotations || []).filter(
    (a: any) => typeof a?.x1 === 'number' && typeof a?.y1 === 'number',
  )
  const [activeSize, setActiveSize] = useState<string>(() => {
    const ps = block.photographedSize
    return ps && sizes.includes(ps) ? ps : sizes[0]
  })
  const [expanded, setExpanded] = useState(false)

  const hasDetails = hotspots.length > 0
  const hasGeometry = sizes.length > 0 && annotations.length > 0

  // Start im Details-Modus; ist nur ein Modus vorhanden, fällt der Umschalter weg.
  const [mode, setMode] = useState<Mode>('details')
  const effMode: Mode = !hasGeometry ? 'details' : !hasDetails ? 'geometry' : mode

  // Das Detail-Popup wird per Portal an <body> gehängt (Vollbild-Modal), damit es weder vom
  // overflow:hidden der Bühne abgeschnitten noch von der Carousel-Transform verschoben wird.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!block.bikePhoto?.asset || (!hasDetails && !hasGeometry)) return null

  const activeHotspot = hotspots.find((h: any) => h._key === open) || null
  const current = measurements.find((m: any) => m.size === activeSize)
  const dims = parseImageDims(block.bikePhoto)
  const items = buildItems(annotations, current, dims)

  return (
    <section className="ibike">
      {hasDetails && hasGeometry && (
        <div className="ibike-toggle" role="tablist" aria-label="Ansicht">
          <button
            role="tab"
            aria-selected={effMode === 'details'}
            onClick={() => setMode('details')}
          >
            Details
          </button>
          <button
            role="tab"
            aria-selected={effMode === 'geometry'}
            onClick={() => setMode('geometry')}
          >
            Geometrie
          </button>
        </div>
      )}

      <div className="ibike-stage">
        <img className="ibike-photo" src={img(block.bikePhoto, 2000)} alt="" loading="lazy" />

        {effMode === 'geometry' && (
          <>
            <div className="geo-scrim ibike-fade" aria-hidden="true" />
            <GeometrySvg annotations={annotations} bikePhoto={block.bikePhoto} />
            {items.map((it) => (
              <span
                key={it.a._key}
                className="geo-label"
                style={{left: `${it.lx * 100}%`, top: `${it.ly * 100}%`}}
              >
                {it.text}
              </span>
            ))}
            {items.map((it) => (
              <span
                key={it.a._key}
                className="geo-marker"
                style={{left: `${it.lx * 100}%`, top: `${it.ly * 100}%`}}
                aria-hidden="true"
              >
                {it.n}
              </span>
            ))}
            {block.photographedSize && (
              <span className="geo-sizebadge">Foto: Größe {block.photographedSize}</span>
            )}
          </>
        )}

        {effMode === 'details' &&
          hotspots.map((h: any) => (
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
      </div>

      {/* Detail-Popup als Vollbild-Modal per Portal — nicht von Bühne/Carousel beschnitten. */}
      {mounted &&
        effMode === 'details' &&
        activeHotspot &&
        createPortal(
          <div className="ibike-popup" role="dialog" aria-modal="true" onClick={() => setOpen(null)}>
            <div className="hotspot-card" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="hotspot-close"
                onClick={() => setOpen(null)}
                aria-label="Schließen"
              >
                ×
              </button>
              {activeHotspot.detailImage?.asset && (
                <img
                  className="hotspot-detail"
                  src={img(activeHotspot.detailImage, 1400)}
                  alt={activeHotspot.label || ''}
                />
              )}
              {(activeHotspot.label || activeHotspot.detailText) && (
                <div className="hotspot-text">
                  {activeHotspot.label && <strong>{activeHotspot.label}</strong>}
                  {activeHotspot.detailText && <p>{activeHotspot.detailText}</p>}
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}

      {effMode === 'details' && <p className="ibike-hint">Tippe die Punkte für Details</p>}

      {effMode === 'geometry' && (
        <>
          <div className="geo-switch" role="tablist" aria-label="Rahmengröße">
            <span className="geo-switch-label">Größe</span>
            {sizes.map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={s === activeSize}
                className={`geo-size${s === activeSize ? ' active' : ''}`}
                onClick={() => setActiveSize(s)}
              >
                {s}
              </button>
            ))}
          </div>

          {items.length > 0 && (
            <div className="geo-legend-wrap">
              <ol className="geo-legend" key={activeSize}>
                {(expanded ? items : items.slice(0, COLLAPSE_AT)).map((it) => (
                  <li key={it.a._key}>
                    <span className="geo-legend-n">{it.n}</span>
                    <span className="geo-legend-name">{it.name}</span>
                    <span className="geo-legend-val">{it.text}</span>
                  </li>
                ))}
              </ol>
              {items.length > COLLAPSE_AT && (
                <button
                  type="button"
                  className="geo-legend-toggle"
                  aria-expanded={expanded}
                  onClick={() => setExpanded((v) => !v)}
                >
                  {expanded ? 'Weniger anzeigen' : `Alle ${items.length} Maße anzeigen`}
                </button>
              )}
            </div>
          )}

          {block.disclaimer && <p className="geo-disclaimer">{block.disclaimer}</p>}
        </>
      )}
    </section>
  )
}
