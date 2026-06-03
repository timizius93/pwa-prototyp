// Geteilte Geometrie-Helfer: genutzt vom standalone GeometryOverlay UND vom Kombi-Baustein
// InteractiveBike. Reine Funktionen/Konstanten — kein React, damit beide Reader sie teilen
// können, ohne die Logik zu duplizieren.

export const SIZE_ORDER = ['S', 'M', 'L', 'XL', 'XXL']

// metric → Feld in den Größen-Werten
export const METRIC_FIELD: Record<string, string> = {
  reach: 'reach_mm', stack: 'stack_mm', wheelbase: 'wheelbase_mm', chainstay: 'chainstay_mm',
  topTube: 'topTube_mm', headTube: 'headTube_mm', seatTube: 'seatTube_mm',
  headAngle: 'headAngle_deg', seatAngle: 'seatAngle_deg',
}
// Klarname je metric — für die Werte-Liste auf dem Phone
export const METRIC_NAME: Record<string, string> = {
  reach: 'Reach', stack: 'Stack', wheelbase: 'Radstand', chainstay: 'Kettenstrebe',
  topTube: 'Oberrohr', headTube: 'Steuerrohr', seatTube: 'Sitzrohr',
  headAngle: 'Lenkwinkel', seatAngle: 'Sitzwinkel',
}
export const ANGLE_METRICS = new Set(['headAngle', 'seatAngle'])

// Foto-Dimensionen aus dem Sanity-Asset-Ref (z. B. „image-abc-4000x2668-jpg") parsen — brauchen
// wir, damit das Geometrie-SVG die Foto-Achsen gleich skaliert (sonst werden Bögen zu Ellipsen).
export function parseImageDims(image: any): {w: number; h: number} | null {
  const ref = image?.asset?._ref
  if (typeof ref !== 'string') return null
  const m = /-(\d+)x(\d+)-/.exec(ref)
  return m ? {w: +m[1], h: +m[2]} : null
}

// Für eine Winkel-Annotation (Lenkwinkel/Sitzwinkel) Bogen + gestrichelte Vertikal-Referenz +
// Label-Position berechnen — alles in FOTO-Pixel-Einheiten (das SVG nutzt dieselben). Drehpunkt
// = das untere Ende der Linie (größere y-Koordinate, also nahe Tretlager/Gabel). Liefert null,
// wenn die Annotation kein Winkel ist oder kein Endpunkt da ist.
export function computeAnglePlacement(a: any, w: number, h: number) {
  if (!ANGLE_METRICS.has(a.metric)) return null
  if (typeof a.x2 !== 'number' || typeof a.y2 !== 'number') return null
  const x1 = a.x1 * w, y1 = a.y1 * h, x2 = a.x2 * w, y2 = a.y2 * h
  // Drehpunkt = unteres Ende (im Bild größeres y); Spitze = oberes Ende
  const [px, py, tx, ty] = y1 > y2 ? [x1, y1, x2, y2] : [x2, y2, x1, y1]
  const dx = tx - px, dy = ty - py
  const tubeLen = Math.hypot(dx, dy)
  if (tubeLen < 1) return null
  // Bogen-Radius: ~40 % der Tube-Länge, gedeckelt damit's auf großen Bildern nicht klobig wird
  const arcR = Math.min(tubeLen * 0.4, Math.max(w, h) * 0.06)
  const ux = dx / tubeLen, uy = dy / tubeLen
  // Bogen-Start: am Tube im Abstand arcR; Bogen-Ende: senkrecht über dem Drehpunkt
  const startX = px + ux * arcR, startY = py + uy * arcR
  const endX = px, endY = py - arcR
  // Sweep-Flag: 0 = gegen Uhrzeigersinn, 1 = im Uhrzeigersinn (Screen-Koords, y nach unten).
  // Tube nach rechts (Lenkwinkel) → kurzer Bogen geht CCW → sweep 0; Tube nach links (Sitzwinkel) → CW → sweep 1.
  const sweep = ux > 0 ? 0 : 1
  const arcPath = `M ${startX} ${startY} A ${arcR} ${arcR} 0 0 ${sweep} ${endX} ${endY}`
  // Gestrichelte Vertikal-Referenz: vom Drehpunkt senkrecht hoch bis zur Höhe der Tube-Spitze
  const refLine = {x1: px, y1: py, x2: px, y2: ty}
  // Label auf der Winkelhalbierenden, knapp außerhalb des Bogens
  let bx = ux / 2, by = (uy - 1) / 2  // Mittel aus Tube-Richtung und Vertikal-Auf (0,-1)
  const bLen = Math.hypot(bx, by) || 1
  bx /= bLen; by /= bLen
  const labelR = arcR + Math.max(w, h) * 0.018
  return {
    arcPath,
    refLine,
    label: {x: px + bx * labelR, y: py + by * labelR},
  }
}

// Feste Lese-Reihenfolge der Liste (Kern-Maße zuerst). custom/Unbekanntes landet hinten.
export const METRIC_ORDER = [
  'reach', 'stack', 'headAngle', 'wheelbase', 'seatAngle',
  'topTube', 'chainstay', 'headTube', 'seatTube',
]
// So viele Zeilen zeigt die Phone-Liste eingeklappt (= die Kern-Maße)
export const COLLAPSE_AT = 4

export function fmt(v: unknown) {
  return typeof v === 'number' ? String(v).replace('.', ',') : '–'
}
function orderOf(metric: string) {
  const i = METRIC_ORDER.indexOf(metric)
  return i === -1 ? 99 : i
}

export type GeoItem = {a: any; text: string; name: string; lx: number; ly: number; n: number}

// Welche der SIZE_ORDER-Größen sind in den Werten vorhanden (in fester Reihenfolge).
export function availableSizes(measurements: any[]) {
  return SIZE_ORDER.filter((s) => measurements.some((m: any) => m.size === s))
}

// Wert einer Maßlinie für die aktive Größe (custom: der freie Text).
export function valueFor(a: any, current: any) {
  if (a.metric === 'custom') return a.customLabel || ''
  const field = METRIC_FIELD[a.metric]
  const val = current?.[field]
  if (typeof val !== 'number') return ''
  return ANGLE_METRICS.has(a.metric) ? `${fmt(val)}°` : `${fmt(val)} mm`
}
// Klarname fürs Phone-Listing (custom hat keinen eigenen Namen → trägt der Wert).
export function nameFor(a: any) {
  return a.metric === 'custom' ? '' : METRIC_NAME[a.metric] || ''
}

// Maßlinien → Mittelpunkt + Wert + Name, gefiltert auf die mit Wert, fest sortiert,
// durchnummeriert (Marker auf dem Bild und Listen-Eintrag teilen sich dieselbe Nummer).
// Mit `imgDims` werden Label-Positionen von Winkel-Annotationen auf die Winkelhalbierende
// gerückt (statt Linien-Mitte), damit sie an den Bogen passen.
export function buildItems(
  annotations: any[],
  current: any,
  imgDims?: {w: number; h: number} | null,
): GeoItem[] {
  return annotations
    .map((a: any) => {
      const hasEnd = typeof a.x2 === 'number' && typeof a.y2 === 'number'
      let lx = hasEnd ? (a.x1 + a.x2) / 2 : a.x1
      let ly = hasEnd ? (a.y1 + a.y2) / 2 : a.y1
      if (imgDims && ANGLE_METRICS.has(a.metric) && hasEnd) {
        const p = computeAnglePlacement(a, imgDims.w, imgDims.h)
        if (p) {
          lx = p.label.x / imgDims.w
          ly = p.label.y / imgDims.h
        }
      }
      return {a, text: valueFor(a, current), name: nameFor(a), lx, ly}
    })
    .filter((it: any) => it.text)
    .sort((p: any, q: any) => orderOf(p.a.metric) - orderOf(q.a.metric))
    .map((it: any, i: number) => ({...it, n: i + 1}))
}
