'use client'

import {useState} from 'react'
import {imgUrl, imgSet} from '@/lib/image'
import {availableSizes, buildItems, COLLAPSE_AT, parseImageDims} from '@/lib/geometry'
import {GeometrySvg} from './GeometrySvg'

// Interaktive Geometrie: Bike-Foto + Maßlinien-Overlay (SVG) + Größen-Switcher.
// Die Pfeil-Positionen sind fix (zur fotografierten Größe); die Werte an den Pfeilen schalten
// mit der Größe live um. Der Kern-Unterschied zu Button Publish (statisches PNG einer Größe).
// Geometrie-Logik (Maps, Items, Reihenfolge) liegt geteilt in lib/geometry.ts.

function img(src: any, w: number) {
  return imgUrl(src, w)
}

export function GeometryOverlay({block}: {block: any}) {
  const measurements = (block.measurements || []).filter((m: any) => m?.size)
  const sizes = availableSizes(measurements)
  const annotations = (block.annotations || []).filter(
    (a: any) => typeof a?.x1 === 'number' && typeof a?.y1 === 'number',
  )

  const [active, setActive] = useState<string>(() => {
    const ps = block.photographedSize
    return ps && sizes.includes(ps) ? ps : sizes[0]
  })
  const [expanded, setExpanded] = useState(false)

  if (!block.bikePhoto?.asset || !sizes.length) return null
  const current = measurements.find((m: any) => m.size === active)
  const dims = parseImageDims(block.bikePhoto)
  const items = buildItems(annotations, current, dims)

  return (
    <section className="geo">
      <div className="geo-stage">
        <img className="geo-photo" {...imgSet(block.bikePhoto, '100vw')} alt="" loading="lazy" />

        {/* dunkle Ebene, damit weiße Linien + Labels besser lesbar sind */}
        <div className="geo-scrim" aria-hidden="true" />

        {/* Maßlinien — Winkel kriegen Bogen + gestrichelte Vertikal-Referenz (siehe GeometrySvg) */}
        <GeometrySvg annotations={annotations} bikePhoto={block.bikePhoto} />

        {/* Desktop: Werte direkt auf der Linie. Phone: nur die Nummer (.geo-marker). */}
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
      </div>

      <div className="geo-switch" role="tablist" aria-label="Rahmengröße">
        <span className="geo-switch-label">Größe</span>
        {sizes.map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={s === active}
            className={`geo-size${s === active ? ' active' : ''}`}
            onClick={() => setActive(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Werte-Liste — nur auf dem Phone sichtbar; schaltet mit der Größe live um.
          Eingeklappt nur die Kern-Maße, Rest auf Knopfdruck. */}
      {items.length > 0 && (
        <div className="geo-legend-wrap">
          <ol className="geo-legend" key={active}>
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
    </section>
  )
}
