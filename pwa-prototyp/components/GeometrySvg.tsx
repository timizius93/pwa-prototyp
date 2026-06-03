import {computeAnglePlacement, parseImageDims} from '@/lib/geometry'

// Maßlinien-Overlay aufs Bike-Foto. Genutzt von GeometryOverlay (standalone) UND InteractiveBike.
// - Längen-Maße: einfache weiße Linie zwischen den zwei Punkten.
// - Winkel-Maße (Lenkwinkel/Sitzwinkel): Tube-Linie solid + gestrichelte Vertikal-Referenz
//   vom Drehpunkt + Kreisbogen mit der Gradzahl (Bike-Geo-Konvention).
// Das SVG nutzt das Foto-Seitenverhältnis als viewBox, damit Bögen kreisrund bleiben (nicht
// elliptisch verzerrt, was bei viewBox 100×100 + preserveAspectRatio="none" passieren würde).
export function GeometrySvg({annotations, bikePhoto}: {annotations: any[]; bikePhoto: any}) {
  const dims = parseImageDims(bikePhoto)
  // Fallback 100×100, falls Foto-Dimensionen nicht parsebar — Linien funktionieren weiterhin,
  // Winkel-Bögen werden dann unterdrückt (siehe placement-Bedingung unten).
  const w = dims?.w ?? 100
  const h = dims?.h ?? 100

  // Pfeilspitzen-Größe in Foto-Pixel-Einheiten — skaliert mit dem Bild, sieht auf Phone und
  // Desktop proportional gleich aus.
  const arrowSize = Math.max(w, h) * 0.012

  return (
    <svg
      className="geo-svg"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        {/* Pfeilspitze: gleiche Definition für beide Enden — orient="auto-start-reverse"
            dreht sie an markerStart automatisch um, sodass beide Enden nach außen zeigen. */}
        <marker
          id="geoArrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerUnits="userSpaceOnUse"
          markerWidth={arrowSize}
          markerHeight={arrowSize}
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="#fff" />
        </marker>
      </defs>
      {annotations.map((a: any) => {
        const hasEnd = typeof a.x2 === 'number' && typeof a.y2 === 'number'
        if (!hasEnd) return null
        const x1 = a.x1 * w, y1 = a.y1 * h, x2 = a.x2 * w, y2 = a.y2 * h
        const placement = dims ? computeAnglePlacement(a, w, h) : null
        if (placement) {
          return (
            <g key={a._key}>
              {/* das Tube selbst */}
              <line x1={x1} y1={y1} x2={x2} y2={y2} vectorEffect="non-scaling-stroke" />
              {/* gestrichelte Vertikal-Referenz */}
              <line
                className="geo-ref"
                x1={placement.refLine.x1}
                y1={placement.refLine.y1}
                x2={placement.refLine.x2}
                y2={placement.refLine.y2}
                strokeDasharray="6 5"
                vectorEffect="non-scaling-stroke"
              />
              {/* Bogen — wird gleich vom geteilten Label mit der Gradzahl beschriftet.
                  Eigene Klasse, damit das CSS nicht versehentlich die Marker-Pfeilspitzen mit hohlem fill erwischt. */}
              <path className="geo-arc" d={placement.arcPath} fill="none" vectorEffect="non-scaling-stroke" />
            </g>
          )
        }
        return (
          <line
            key={a._key}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            vectorEffect="non-scaling-stroke"
            markerStart="url(#geoArrow)"
            markerEnd="url(#geoArrow)"
          />
        )
      })}
    </svg>
  )
}
