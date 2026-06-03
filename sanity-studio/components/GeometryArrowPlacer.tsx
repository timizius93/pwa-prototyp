import {useCallback, useEffect, useRef, useState} from 'react'
import {
  set,
  insert,
  unset,
  setIfMissing,
  useClient,
  useFormValue,
  type ArrayOfObjectsInputProps,
  type ObjectItemProps,
} from 'sanity'
import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {createPortal} from 'react-dom'
import imageUrlBuilder from '@sanity/image-url'

// Visueller Maßlinien-Placer fürs Geometrie-Overlay: jede Annotation hat ZWEI Punkte (Start/Ende).
// Auf das Foto klicken legt eine neue Maßlinie an; beide Endpunkte sind ziehbar. Reuse-Erweiterung
// des Hotspot-Placer-Musters (dort ein Punkt, hier zwei). Schreibt x1/y1/x2/y2 (0–1) ins Dokument,
// die der Reader als SVG-Overlay rendert. Detail (Maß-Typ, freier Text) füllt der Editor in der
// Liste darunter (renderDefault).

type Ann = {_key: string; metric?: string; customLabel?: string; x1?: number; y1?: number; x2?: number; y2?: number}

const SHORT: Record<string, string> = {
  reach: 'Reach', stack: 'Stack', wheelbase: 'Radst.', chainstay: 'Kettenstr.',
  topTube: 'Oberr.', headTube: 'Steuerr.', seatTube: 'Sitzr.',
  headAngle: 'Lenkw.', seatAngle: 'Sitzw.', custom: 'Text',
}

function newKey() {
  return Math.random().toString(36).slice(2, 12)
}
function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}
function round(n: number) {
  return Math.round(n * 1000) / 1000
}

// Snapping für den gezogenen Endpunkt (Stufe 1):
//  1) Endpunkt-Snap: nah an einem Punkt EINER ANDEREN Maßlinie → bündig einrasten.
//  2) Winkel-Snap: nah an waagerecht/senkrecht → exakt einrasten (mit Shift zusätzlich 45°).
// Rechnung im PIXEL-Raum (W/H des Fotos), damit „rechtwinklig" optisch stimmt (das Bild ist nicht
// quadratisch). Liefert die ggf. eingerastete Position in 0–1-Koordinaten zurück.
function applySnap(
  rx: number, ry: number,
  ox: number | undefined, oy: number | undefined,
  anns: {_key: string; x1?: number; y1?: number; x2?: number; y2?: number}[],
  dragKey: string, W: number, H: number, shift: boolean,
) {
  // 1) Endpunkt-Snap (nur fremde Linien, nie der eigene)
  const SNAP_PX = 14
  let best: [number, number] | null = null
  let bestD = SNAP_PX
  for (const a of anns) {
    if (a._key === dragKey) continue
    for (const p of [[a.x1, a.y1], [a.x2, a.y2]] as const) {
      if (typeof p[0] !== 'number' || typeof p[1] !== 'number') continue
      const d = Math.hypot((p[0] - rx) * W, (p[1] - ry) * H)
      if (d < bestD) {
        bestD = d
        best = [p[0], p[1]]
      }
    }
  }
  if (best) return {x: clamp01(best[0]), y: clamp01(best[1])}

  // 2) Winkel-Snap relativ zum festen anderen Endpunkt
  if (typeof ox !== 'number' || typeof oy !== 'number') return {x: rx, y: ry}
  const vx = (rx - ox) * W
  const vy = (ry - oy) * H
  if (vx === 0 && vy === 0) return {x: rx, y: ry}
  const ang = Math.atan2(vy, vx)
  const candsDeg = shift ? [0, 45, 90, 135, 180, 225, 270, 315] : [0, 90, 180, 270]
  const thresh = (shift ? 999 : 8) * (Math.PI / 180)
  let bestA: number | null = null
  let bestDiff = thresh
  for (const c of candsDeg) {
    const cr = (c * Math.PI) / 180
    const diff = Math.abs(Math.atan2(Math.sin(ang - cr), Math.cos(ang - cr)))
    if (diff < bestDiff) {
      bestDiff = diff
      bestA = cr
    }
  }
  if (bestA === null) return {x: rx, y: ry}
  const dirx = Math.cos(bestA)
  const diry = Math.sin(bestA)
  const len = vx * dirx + vy * diry // Projektion auf die Snap-Richtung
  return {x: clamp01((ox * W + dirx * len) / W), y: clamp01((oy * H + diry * len) / H)}
}

// Rahmen um die Foto-Bühne: normal als Karte im Dialog, im Vollbild als große Overlay-Ebene
// (per Portal an document.body, damit nichts vom schmalen Sanity-Dialog beschneidet).
function Frame({
  fullscreen, onClose, children,
}: {
  fullscreen: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  if (!fullscreen) {
    return (
      <Card border radius={2} overflow="hidden">
        {children}
      </Card>
    )
  }
  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.9)',
        display: 'flex', flexDirection: 'column', padding: 20,
      }}
    >
      <div style={{flex: '0 0 auto', display: 'flex', justifyContent: 'flex-end', marginBottom: 12}}>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '9px 18px', borderRadius: 7, border: 'none', background: '#fff',
            color: '#111', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >
          Schließen ✕
        </button>
      </div>
      <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, overflow: 'auto'}}>
        <div style={{width: 'min(1300px, 94vw)'}}>{children}</div>
      </div>
    </div>,
    document.body,
  )
}

export function GeometryArrowPlacer(props: ArrayOfObjectsInputProps) {
  const {value = [], onChange, path, renderDefault} = props
  const anns = value as unknown as Ann[]
  const client = useClient({apiVersion: '2021-06-07'})
  const parentPath = path.slice(0, -1)
  const bikePhoto = useFormValue([...parentPath, 'bikePhoto']) as {asset?: {_ref?: string}} | undefined

  const stageRef = useRef<HTMLDivElement>(null)
  // welcher Endpunkt wird gezogen
  const [drag, setDrag] = useState<{key: string; pt: 1 | 2; x: number; y: number} | null>(null)
  // aktuelle Annotationen als Ref, damit der Snap im Drag immer den frischen Stand sieht
  const annsRef = useRef(anns)
  annsRef.current = anns
  // Vollbild-Bearbeitung (großes Foto), unabhängig von der schmalen Sanity-Dialog-Breite
  const [fullscreen, setFullscreen] = useState(false)

  const imageUrl = bikePhoto?.asset?._ref
    ? imageUrlBuilder(client).image(bikePhoto).width(1400).fit('max').url()
    : null

  const posFromEvent = useCallback((cx: number, cy: number) => {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return {x: 0.5, y: 0.5}
    return {x: clamp01((cx - rect.left) / rect.width), y: clamp01((cy - rect.top) / rect.height)}
  }, [])

  const handleStageClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-handle]')) return
      const {x, y} = posFromEvent(e.clientX, e.clientY)
      const item = {
        _key: newKey(), _type: 'geoAnnotation', metric: 'reach',
        x1: round(x), y1: round(y), x2: round(clamp01(x + 0.12)), y2: round(y),
      }
      onChange([setIfMissing([]), insert([item], 'after', [-1])])
    },
    [onChange, posFromEvent],
  )

  useEffect(() => {
    if (!drag) return
    const onMove = (e: PointerEvent) => {
      const {x, y} = posFromEvent(e.clientX, e.clientY)
      const rect = stageRef.current?.getBoundingClientRect()
      setDrag((d) => {
        if (!d) return d
        if (!rect) return {...d, x, y}
        const a = annsRef.current.find((it) => it._key === d.key)
        const ox = d.pt === 1 ? a?.x2 : a?.x1
        const oy = d.pt === 1 ? a?.y2 : a?.y1
        const s = applySnap(x, y, ox, oy, annsRef.current, d.key, rect.width, rect.height, e.shiftKey)
        return {...d, x: s.x, y: s.y}
      })
    }
    const onUp = () => {
      setDrag((d) => {
        if (d) {
          const fx = d.pt === 1 ? 'x1' : 'x2'
          const fy = d.pt === 1 ? 'y1' : 'y2'
          onChange([set(round(d.x), [{_key: d.key}, fx]), set(round(d.y), [{_key: d.key}, fy])])
        }
        return null
      })
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [drag, onChange, posFromEvent])

  const remove = useCallback((key: string) => onChange(unset([{_key: key}])), [onChange])

  // Hohler Ring: greifbar über die ganze (transparente) Fläche, aber man sieht durch die Mitte
  // aufs Bild → exakter Punkt sichtbar. Der feine Mittelpunkt markiert die genaue Koordinate.
  const ringStyle = (size: number, color: string): React.CSSProperties => ({
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    width: size,
    height: size,
    borderRadius: '50%',
    background: 'transparent',
    border: `2px solid ${color}`,
    boxShadow: '0 0 0 1px rgba(0,0,0,0.4)',
    cursor: 'grab',
    touchAction: 'none',
  })
  const centerDot = (color: string): React.CSSProperties => ({
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: color,
    boxShadow: '0 0 0 1.5px rgba(255,255,255,0.9)',
    pointerEvents: 'none',
  })

  return (
    <Stack space={3}>
      {imageUrl ? (
        <Frame fullscreen={fullscreen} onClose={() => setFullscreen(false)}>
          <div
            ref={stageRef}
            onClick={handleStageClick}
            style={{position: 'relative', cursor: 'crosshair', userSelect: 'none', lineHeight: 0}}
          >
            <img src={imageUrl} alt="" style={{width: '100%', display: 'block'}} draggable={false} />
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none'}}
            >
              {anns.map((a) => {
                const liveX1 = drag?.key === a._key && drag.pt === 1 ? drag.x : a.x1
                const liveY1 = drag?.key === a._key && drag.pt === 1 ? drag.y : a.y1
                const liveX2 = drag?.key === a._key && drag.pt === 2 ? drag.x : a.x2
                const liveY2 = drag?.key === a._key && drag.pt === 2 ? drag.y : a.y2
                if ([liveX1, liveY1, liveX2, liveY2].some((v) => typeof v !== 'number')) return null
                return (
                  <line
                    key={a._key}
                    x1={(liveX1 as number) * 100}
                    y1={(liveY1 as number) * 100}
                    x2={(liveX2 as number) * 100}
                    y2={(liveY2 as number) * 100}
                    stroke="#00a8e8"
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                  />
                )
              })}
            </svg>

            {anns.map((a, i) => {
              const d1 = drag?.key === a._key && drag.pt === 1
              const d2 = drag?.key === a._key && drag.pt === 2
              const x1 = d1 ? drag!.x : a.x1
              const y1 = d1 ? drag!.y : a.y1
              const x2 = d2 ? drag!.x : a.x2
              const y2 = d2 ? drag!.y : a.y2
              return (
                <div key={a._key}>
                  {typeof x1 === 'number' && typeof y1 === 'number' && (
                    <div
                      data-handle
                      onPointerDown={(e) => {
                        e.preventDefault(); e.stopPropagation()
                        setDrag({key: a._key, pt: 1, x: x1, y: y1})
                      }}
                      title={SHORT[a.metric || ''] || a.metric}
                      style={{...ringStyle(20, '#00a8e8'), left: `${x1 * 100}%`, top: `${y1 * 100}%`}}
                    >
                      <span style={centerDot('#00a8e8')} />
                      <span
                        style={{
                          position: 'absolute', top: -9, left: -9, minWidth: 15, height: 15,
                          padding: '0 3px', borderRadius: 8, background: '#00a8e8', color: '#fff',
                          fontSize: 10, fontWeight: 700, lineHeight: '15px', textAlign: 'center',
                          pointerEvents: 'none',
                        }}
                      >
                        {i + 1}
                      </span>
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {e.stopPropagation(); remove(a._key)}}
                        aria-label="Maßlinie entfernen"
                        style={{
                          position: 'absolute', top: -9, right: -9, width: 15, height: 15,
                          borderRadius: '50%', border: 'none', background: '#e23', color: '#fff',
                          fontSize: 10, lineHeight: '13px', cursor: 'pointer', padding: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {typeof x2 === 'number' && typeof y2 === 'number' && (
                    <div
                      data-handle
                      onPointerDown={(e) => {
                        e.preventDefault(); e.stopPropagation()
                        setDrag({key: a._key, pt: 2, x: x2, y: y2})
                      }}
                      style={{...ringStyle(16, '#fff'), left: `${x2 * 100}%`, top: `${y2 * 100}%`}}
                    >
                      <span style={centerDot('#fff')} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Frame>
      ) : (
        <Card padding={4} radius={2} tone="caution" border>
          <Text size={1}>Erst oben ein „Bike-Foto" hochladen, dann hier Maßlinien klicken.</Text>
        </Card>
      )}

      {imageUrl && !fullscreen && (
        <Flex>
          <Button text="⤢ Groß bearbeiten" mode="ghost" tone="primary" onClick={() => setFullscreen(true)} />
        </Flex>
      )}

      <Box>
        <Text size={1} muted>
          Aufs Foto klicken legt eine Maßlinie an · blauer Punkt = Start, weißer = Ende, beide
          ziehbar · × entfernt. Beim Ziehen rastet die Linie nah an waagerecht/senkrecht automatisch
          ein (Shift = zusätzlich 45°); nah an einem Punkt einer anderen Linie schnappt der Endpunkt
          bündig ein. Maß-Typ + freier Text in der Liste darunter.
        </Text>
      </Box>

      {renderDefault(props)}
    </Stack>
  )
}

// Nummern-Badge pro Listen-Zeile, passend zur Start-Punkt-Nummer auf dem Foto.
export function NumberedArrowItem(props: ObjectItemProps) {
  const arrayPath = props.path.slice(0, -1)
  const arr = useFormValue(arrayPath) as Array<{_key?: string}> | undefined
  const key = (props.value as {_key?: string})?._key
  const liveIdx = Array.isArray(arr) ? arr.findIndex((h) => h?._key === key) : -1
  const n = (liveIdx >= 0 ? liveIdx : props.index) + 1
  const open = props.open
  return (
    <Flex align={open ? 'flex-start' : 'center'} gap={1}>
      <Card
        tone="primary"
        style={{
          flex: '0 0 auto', marginTop: open ? 8 : 0, marginLeft: 2, width: 20, height: 20,
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }}
      >
        <Text size={0} weight="bold">{n}</Text>
      </Card>
      <Box flex={1}>{props.renderDefault(props)}</Box>
    </Flex>
  )
}
