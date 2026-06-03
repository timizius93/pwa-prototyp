import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  set, insert, unset, setIfMissing,
  useClient, useFormValue,
  type ArrayOfObjectsInputProps,
} from 'sanity'
import {Box, Button, Card, Flex, Inline, Stack, Text, TextInput} from '@sanity/ui'
import imageUrlBuilder from '@sanity/image-url'
import {EditStagePortal, PreviewHint} from './EditStagePortal'

// Wizard-Flow für Geometrie-Maßlinien: ersetzt die generische Array-Liste durch eine Checkliste
// der Standardmaße (Reach, Stack, Lenkwinkel, …). Klick auf ein offenes Maß → fokussierte
// Platzier-Bühne fürs Foto (zwei Klicks für Start/Ende), Wert für die fotografierte Größe wird
// direkt mitabgefragt und in die measurements-Tabelle geschrieben. Bestehende Pfeile lassen sich
// per Klick bearbeiten/löschen. Snap-Logik (Endpunkt-Snap + waagerecht/senkrecht/45°) wie im
// klassischen Placer. Datenmodell unverändert — Umstieg ist nicht-destruktiv.
//
// Schreibt Pfeil-Positionen über die normale onChange-Schiene (relativ zum annotations-Array).
// Werte für die Größentabelle sind ein Geschwisterfeld und brauchen einen Direkt-Patch über
// client.patch (siehe writeValue). Damit der draftRefresh anschlägt, läuft alles auf dem aktuell
// im Form geöffneten Dokument (drafts.<id> oder <id>).

type Metric =
  | 'reach' | 'stack' | 'wheelbase' | 'chainstay'
  | 'topTube' | 'headTube' | 'seatTube'
  | 'headAngle' | 'seatAngle' | 'custom'

type Ann = {
  _key: string
  _type?: 'geoAnnotation'
  metric?: Metric
  customLabel?: string
  x1?: number; y1?: number; x2?: number; y2?: number
}

type SizeRow = {
  _key?: string
  _type?: 'sizeRow'
  size?: string
  [k: string]: any
}

// Standardmaße in fester Lese-Reihenfolge (= Wizard-Liste, matcht METRIC_ORDER im Reader).
const STD: Array<{metric: Metric; name: string; field: string; unit: 'mm' | '°'}> = [
  {metric: 'reach',     name: 'Reach',        field: 'reach_mm',      unit: 'mm'},
  {metric: 'stack',     name: 'Stack',        field: 'stack_mm',      unit: 'mm'},
  {metric: 'headAngle', name: 'Lenkwinkel',   field: 'headAngle_deg', unit: '°'},
  {metric: 'wheelbase', name: 'Radstand',     field: 'wheelbase_mm',  unit: 'mm'},
  {metric: 'seatAngle', name: 'Sitzwinkel',   field: 'seatAngle_deg', unit: '°'},
  {metric: 'chainstay', name: 'Kettenstrebe', field: 'chainstay_mm',  unit: 'mm'},
  {metric: 'topTube',   name: 'Oberrohr',     field: 'topTube_mm',    unit: 'mm'},
  {metric: 'headTube',  name: 'Steuerrohr',   field: 'headTube_mm',   unit: 'mm'},
  {metric: 'seatTube',  name: 'Sitzrohr',     field: 'seatTube_mm',   unit: 'mm'},
]

function newKey() {
  return Math.random().toString(36).slice(2, 12)
}
function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}
function round(n: number) {
  return Math.round(n * 1000) / 1000
}
function parseNum(s: string): number | null {
  if (!s.trim()) return null
  const n = parseFloat(s.replace(',', '.'))
  return isNaN(n) ? null : n
}

// Sanity-Pfad-Segmente → GROQ-Pfad-String für client.patch (Doc-Root → Geschwisterfeld).
function pathToString(path: ReadonlyArray<unknown>): string {
  let out = ''
  for (const seg of path) {
    if (typeof seg === 'string') out += (out ? '.' : '') + seg
    else if (typeof seg === 'number') out += `[${seg}]`
    else if (seg && typeof seg === 'object' && '_key' in (seg as any))
      out += `[_key=="${(seg as any)._key}"]`
  }
  return out
}

// Snap-Logik in drei Stufen, Priorität: 1) fremder Endpunkt, 2) fremde Linie (lotrecht),
// 3) Winkel-Snap (waagerecht/senkrecht + Shift=45°) relativ zum festen anderen eigenen Endpunkt.
// Distanzen werden im Pixel-Raum (W/H des Fotos) gerechnet, damit „rechtwinklig" optisch stimmt
// (das Bild ist nicht quadratisch). Eingang/Ausgang in 0–1-Koordinaten.
function applySnap(
  rx: number, ry: number,
  ox: number | undefined, oy: number | undefined,
  anns: Ann[], dragKey: string,
  W: number, H: number, shift: boolean,
) {
  const SNAP_PX = 18

  // 1) Endpunkt-Snap — fremde Linien, jeder Endpunkt ist Kandidat
  let bestPt: [number, number] | null = null
  let bestPtD = SNAP_PX
  for (const a of anns) {
    if (a._key === dragKey) continue
    for (const p of [[a.x1, a.y1], [a.x2, a.y2]] as const) {
      if (typeof p[0] !== 'number' || typeof p[1] !== 'number') continue
      const d = Math.hypot((p[0] - rx) * W, (p[1] - ry) * H)
      if (d < bestPtD) { bestPtD = d; bestPt = [p[0], p[1]] }
    }
  }
  if (bestPt) return {x: clamp01(bestPt[0]), y: clamp01(bestPt[1])}

  // 2) Linien-Snap — lotrechte Distanz zur nächstgelegenen fremden Strecke
  let bestLine: [number, number] | null = null
  let bestLineD = SNAP_PX
  for (const a of anns) {
    if (a._key === dragKey) continue
    if (typeof a.x1 !== 'number' || typeof a.y1 !== 'number'
      || typeof a.x2 !== 'number' || typeof a.y2 !== 'number') continue
    const ax = a.x1 * W, ay = a.y1 * H
    const bx = a.x2 * W, by = a.y2 * H
    const abx = bx - ax, aby = by - ay
    const ab2 = abx * abx + aby * aby
    if (ab2 < 1) continue
    const px = rx * W, py = ry * H
    const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / ab2))
    const cx = ax + t * abx, cy = ay + t * aby
    const d = Math.hypot(px - cx, py - cy)
    if (d < bestLineD) { bestLineD = d; bestLine = [cx / W, cy / H] }
  }
  if (bestLine) return {x: clamp01(bestLine[0]), y: clamp01(bestLine[1])}

  // 3) Winkel-Snap relativ zum festen anderen Endpunkt
  if (typeof ox !== 'number' || typeof oy !== 'number') return {x: rx, y: ry}
  const vx = (rx - ox) * W, vy = (ry - oy) * H
  if (vx === 0 && vy === 0) return {x: rx, y: ry}
  const ang = Math.atan2(vy, vx)
  const candsDeg = shift ? [0, 45, 90, 135, 180, 225, 270, 315] : [0, 90, 180, 270]
  const thresh = (shift ? 999 : 8) * (Math.PI / 180)
  let bestA: number | null = null
  let bestDiff = thresh
  for (const c of candsDeg) {
    const cr = (c * Math.PI) / 180
    const diff = Math.abs(Math.atan2(Math.sin(ang - cr), Math.cos(ang - cr)))
    if (diff < bestDiff) { bestDiff = diff; bestA = cr }
  }
  if (bestA === null) return {x: rx, y: ry}
  const dirx = Math.cos(bestA), diry = Math.sin(bestA)
  const len = vx * dirx + vy * diry
  return {x: clamp01((ox * W + dirx * len) / W), y: clamp01((oy * H + diry * len) / H)}
}

// Wizard-Modi: list / place (neu setzen) / edit (bestehenden bearbeiten).
type Mode =
  | {kind: 'list'}
  | {kind: 'place'; metric: Metric; customLabel?: string;
     p1?: {x: number; y: number}; p2?: {x: number; y: number}; value: string}
  | {kind: 'edit'; key: string; value: string; drag?: {pt: 1 | 2; x: number; y: number}}

export function GeometryWizard(props: ArrayOfObjectsInputProps) {
  const {value = [], onChange, path} = props
  const anns = value as unknown as Ann[]

  const client = useClient({apiVersion: '2021-06-07'})
  const parentPath = path.slice(0, -1)
  const docId = useFormValue(['_id']) as string | undefined
  const bikePhoto = useFormValue([...parentPath, 'bikePhoto']) as
    {asset?: {_ref?: string}} | undefined
  const photographedSize = (useFormValue([...parentPath, 'photographedSize']) as string | undefined) || 'M'
  const measurements = (useFormValue([...parentPath, 'measurements']) as SizeRow[] | undefined) || []

  const stageRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<Mode>({kind: 'list'})
  const [fullscreen, setFullscreen] = useState(false)
  const annsRef = useRef(anns); annsRef.current = anns
  const modeRef = useRef(mode); modeRef.current = mode

  const imageUrl = bikePhoto?.asset?._ref
    ? imageUrlBuilder(client).image(bikePhoto).width(1400).fit('max').url()
    : null
  // Höhere Auflösung für die große Bühne (präzises Platzieren).
  const stageImageUrl = bikePhoto?.asset?._ref
    ? imageUrlBuilder(client).image(bikePhoto).width(2400).fit('max').url()
    : null

  // Wert in die measurements-Tabelle für die fotografierte Größe schreiben. Geschwisterfeld
  // außerhalb des annotations-Arrays → kann nicht über die input-onChange-Schiene laufen,
  // also Direkt-Patch über client.patch auf dem Dokument.
  const writeValue = useCallback(async (field: string, val: number | null) => {
    if (!docId) return
    const basePath = pathToString(parentPath)
    const row = measurements.find((r) => r.size === photographedSize)
    try {
      if (row?._key) {
        const fieldPath = `${basePath}.measurements[_key=="${row._key}"].${field}`
        const p = client.patch(docId)
        if (val === null) p.unset([fieldPath])
        else p.set({[fieldPath]: val})
        await p.commit()
      } else if (val !== null) {
        const newRow: SizeRow = {_key: newKey(), _type: 'sizeRow', size: photographedSize, [field]: val}
        const measurementsPath = `${basePath}.measurements`
        await client.patch(docId)
          .setIfMissing({[measurementsPath]: []})
          .insert('after', `${measurementsPath}[-1]`, [newRow])
          .commit()
      }
    } catch (err) {
      console.warn('GeometryWizard: writeValue fehlgeschlagen', err)
    }
  }, [client, docId, measurements, photographedSize, parentPath])

  const readValue = useCallback((metric?: Metric): string => {
    const s = STD.find((x) => x.metric === metric)
    if (!s) return ''
    const row = measurements.find((r) => r.size === photographedSize)
    const v = row?.[s.field]
    return typeof v === 'number' ? String(v).replace('.', ',') : ''
  }, [measurements, photographedSize])

  const posFromEvent = useCallback((cx: number, cy: number) => {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return {x: 0.5, y: 0.5}
    return {x: clamp01((cx - rect.left) / rect.width), y: clamp01((cy - rect.top) / rect.height)}
  }, [])

  // Klick auf die Bühne: nur im place-Modus aktiv (setzt Start/Ende).
  const handleStageClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-handle]')) return
    if (modeRef.current.kind !== 'place') return
    const {x, y} = posFromEvent(e.clientX, e.clientY)
    const shift = e.shiftKey
    setMode((m) => {
      if (m.kind !== 'place') return m
      const rect = stageRef.current?.getBoundingClientRect()
      const W = rect?.width ?? 1, H = rect?.height ?? 1
      if (!m.p1) {
        // Auch der erste Klick snapt zu fremden Endpunkten — Längen teilen sich oft den
        // Drehpunkt (z. B. Reach + Stack am Tretlager). Kein Winkel-Snap hier (kein Bezugspunkt).
        const s = applySnap(x, y, undefined, undefined, annsRef.current, '__new__', W, H, shift)
        return {...m, p1: {x: round(s.x), y: round(s.y)}}
      }
      if (!m.p2) {
        const s = applySnap(x, y, m.p1.x, m.p1.y, annsRef.current, '__new__', W, H, shift)
        return {...m, p2: {x: round(s.x), y: round(s.y)}}
      }
      return m
    })
  }, [posFromEvent])

  // Drag im edit-Modus: pointermove/-up am window registrieren, solange ein Drag aktiv ist.
  const isDragging = mode.kind === 'edit' && !!mode.drag
  useEffect(() => {
    if (!isDragging) return
    const onMove = (e: PointerEvent) => {
      const m = modeRef.current
      if (m.kind !== 'edit' || !m.drag) return
      const {x, y} = posFromEvent(e.clientX, e.clientY)
      const rect = stageRef.current?.getBoundingClientRect()
      const W = rect?.width ?? 1, H = rect?.height ?? 1
      const ann = annsRef.current.find((a) => a._key === m.key)
      const ox = m.drag.pt === 1 ? ann?.x2 : ann?.x1
      const oy = m.drag.pt === 1 ? ann?.y2 : ann?.y1
      const s = applySnap(x, y, ox, oy, annsRef.current, m.key, W, H, e.shiftKey)
      setMode((cur) => cur.kind === 'edit' && cur.drag
        ? {...cur, drag: {...cur.drag, x: s.x, y: s.y}} : cur)
    }
    const onUp = () => {
      setMode((cur) => {
        if (cur.kind !== 'edit' || !cur.drag) return cur
        const fx = cur.drag.pt === 1 ? 'x1' : 'x2'
        const fy = cur.drag.pt === 1 ? 'y1' : 'y2'
        onChange([
          set(round(cur.drag.x), [{_key: cur.key}, fx]),
          set(round(cur.drag.y), [{_key: cur.key}, fy]),
        ])
        return {...cur, drag: undefined}
      })
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [isDragging, onChange, posFromEvent])

  // Commits.
  const commitNew = useCallback(async () => {
    const m = modeRef.current
    if (m.kind !== 'place' || !m.p1 || !m.p2) return
    const std = STD.find((s) => s.metric === m.metric)
    const ann: Ann = {
      _key: newKey(),
      _type: 'geoAnnotation',
      metric: m.metric,
      x1: m.p1.x, y1: m.p1.y, x2: m.p2.x, y2: m.p2.y,
      ...(m.metric === 'custom' && m.customLabel ? {customLabel: m.customLabel} : {}),
    }
    onChange([setIfMissing([]), insert([ann], 'after', [-1])])
    if (std) {
      const v = parseNum(m.value)
      if (v !== null) await writeValue(std.field, v)
    }
    setMode({kind: 'list'})
  }, [onChange, writeValue])

  const commitEdit = useCallback(async () => {
    const m = modeRef.current
    if (m.kind !== 'edit') return
    const a = annsRef.current.find((x) => x._key === m.key)
    const std = a?.metric ? STD.find((s) => s.metric === a.metric) : null
    if (std) {
      const v = parseNum(m.value)
      if (v !== null) await writeValue(std.field, v)
      else if (m.value.trim() === '') await writeValue(std.field, null)
    }
    setMode({kind: 'list'})
  }, [writeValue])

  const deleteAnnotation = useCallback((key: string) => {
    onChange(unset([{_key: key}]))
    setMode({kind: 'list'})
  }, [onChange])

  // Editier-Modus für ein bestehendes Standardmaß starten (Wert vorbefüllen) + Bühne öffnen.
  const startEdit = useCallback((a: Ann) => {
    setMode({kind: 'edit', key: a._key, value: readValue(a.metric)})
    setFullscreen(true)
  }, [readValue])

  // List-Anzeige: Status pro Metric (genau ein Pfeil pro Standardmaß; weitere wären redundant).
  const placedByMetric = useMemo(() => {
    const map = new Map<Metric, Ann>()
    for (const a of anns) {
      if (a.metric && a.metric !== 'custom' && !map.has(a.metric)) map.set(a.metric, a)
    }
    return map
  }, [anns])

  const customAnns = useMemo(() => anns.filter((a) => a.metric === 'custom'), [anns])

  const currentEditAnn = mode.kind === 'edit' ? annsRef.current.find((a) => a._key === mode.key) : null
  const currentStd =
    mode.kind === 'place' ? STD.find((s) => s.metric === mode.metric) :
    mode.kind === 'edit' && currentEditAnn?.metric ? STD.find((s) => s.metric === currentEditAnn.metric) :
    null

  const stageCursor =
    mode.kind === 'place' ? 'crosshair' :
    mode.kind === 'edit' && mode.drag ? 'grabbing' : 'default'

  // === Pfeile + Handles auf der Bühne ===
  function renderArrows() {
    return (
      <>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none"
             style={{position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none'}}>
          {anns.map((a) => {
            const isEditing = mode.kind === 'edit' && mode.key === a._key
            const liveX1 = isEditing && mode.drag?.pt === 1 ? mode.drag.x : a.x1
            const liveY1 = isEditing && mode.drag?.pt === 1 ? mode.drag.y : a.y1
            const liveX2 = isEditing && mode.drag?.pt === 2 ? mode.drag.x : a.x2
            const liveY2 = isEditing && mode.drag?.pt === 2 ? mode.drag.y : a.y2
            if ([liveX1, liveY1, liveX2, liveY2].some((v) => typeof v !== 'number')) return null
            const dim = mode.kind === 'place' || (mode.kind === 'edit' && !isEditing)
            return (
              <line key={a._key}
                x1={(liveX1 as number) * 100} y1={(liveY1 as number) * 100}
                x2={(liveX2 as number) * 100} y2={(liveY2 as number) * 100}
                stroke={dim ? 'rgba(0,168,232,0.35)' : '#00a8e8'}
                strokeWidth={2}
                vectorEffect="non-scaling-stroke" />
            )
          })}
          {mode.kind === 'place' && mode.p1 && mode.p2 && (
            <line
              x1={mode.p1.x * 100} y1={mode.p1.y * 100}
              x2={mode.p2.x * 100} y2={mode.p2.y * 100}
              stroke="#00a8e8" strokeWidth={2} vectorEffect="non-scaling-stroke" />
          )}
        </svg>

        {anns.map((a, i) => {
          const isEditing = mode.kind === 'edit' && mode.key === a._key
          const dim = mode.kind === 'place' || (mode.kind === 'edit' && !isEditing)
          const clickable = mode.kind === 'list'
          const liveX1 = isEditing && mode.drag?.pt === 1 ? mode.drag.x : a.x1
          const liveY1 = isEditing && mode.drag?.pt === 1 ? mode.drag.y : a.y1
          const liveX2 = isEditing && mode.drag?.pt === 2 ? mode.drag.x : a.x2
          const liveY2 = isEditing && mode.drag?.pt === 2 ? mode.drag.y : a.y2
          if (typeof liveX1 !== 'number' || typeof liveY1 !== 'number') return null
          return (
            <div key={a._key}>
              <div
                data-handle={isEditing ? '1' : undefined}
                onPointerDown={isEditing ? (e) => {
                  e.preventDefault(); e.stopPropagation()
                  setMode((m) => m.kind === 'edit'
                    ? {...m, drag: {pt: 1, x: a.x1 as number, y: a.y1 as number}} : m)
                } : undefined}
                onClick={clickable ? (e) => { e.stopPropagation(); startEdit(a) } : undefined}
                title={STD.find((s) => s.metric === a.metric)?.name || a.customLabel || a.metric}
                style={{
                  position: 'absolute', left: `${liveX1 * 100}%`, top: `${liveY1 * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'transparent',
                  border: `2px solid ${dim ? 'rgba(0,168,232,0.5)' : '#00a8e8'}`,
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.4)',
                  cursor: isEditing ? 'grab' : clickable ? 'pointer' : 'default',
                  touchAction: 'none', opacity: dim ? 0.55 : 1,
                }}
              >
                <span style={{
                  position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                  width: 4, height: 4, borderRadius: '50%',
                  background: dim ? 'rgba(0,168,232,0.7)' : '#00a8e8',
                  boxShadow: '0 0 0 1.5px rgba(255,255,255,0.9)', pointerEvents: 'none',
                }} />
                <span style={{
                  position: 'absolute', top: -9, left: -9, minWidth: 15, height: 15, padding: '0 3px',
                  borderRadius: 8,
                  background: dim ? 'rgba(0,168,232,0.7)' : '#00a8e8',
                  color: '#fff', fontSize: 10, fontWeight: 700, lineHeight: '15px',
                  textAlign: 'center', pointerEvents: 'none',
                }}>{i + 1}</span>
              </div>
              {typeof liveX2 === 'number' && typeof liveY2 === 'number' && (
                <div
                  data-handle={isEditing ? '2' : undefined}
                  onPointerDown={isEditing ? (e) => {
                    e.preventDefault(); e.stopPropagation()
                    setMode((m) => m.kind === 'edit'
                      ? {...m, drag: {pt: 2, x: a.x2 as number, y: a.y2 as number}} : m)
                  } : undefined}
                  onClick={clickable ? (e) => { e.stopPropagation(); startEdit(a) } : undefined}
                  style={{
                    position: 'absolute', left: `${liveX2 * 100}%`, top: `${liveY2 * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 16, height: 16, borderRadius: '50%',
                    background: 'transparent',
                    border: `2px solid ${dim ? 'rgba(255,255,255,0.5)' : '#fff'}`,
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.4)',
                    cursor: isEditing ? 'grab' : clickable ? 'pointer' : 'default',
                    touchAction: 'none', opacity: dim ? 0.55 : 1,
                  }}
                >
                  <span style={{
                    position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                    width: 4, height: 4, borderRadius: '50%',
                    background: dim ? 'rgba(255,255,255,0.7)' : '#fff',
                    boxShadow: '0 0 0 1.5px rgba(0,0,0,0.6)', pointerEvents: 'none',
                  }} />
                </div>
              )}
            </div>
          )
        })}

        {/* Vorschau-Punkte für die noch nicht gespeicherte neue Linie */}
        {mode.kind === 'place' && mode.p1 && (
          <div style={previewDot('#00a8e8', 20, mode.p1.x, mode.p1.y)}>
            <span style={previewCenter('#00a8e8')} />
          </div>
        )}
        {mode.kind === 'place' && mode.p2 && (
          <div style={previewDot('#fff', 16, mode.p2.x, mode.p2.y)}>
            <span style={previewCenter('#fff')} />
          </div>
        )}
      </>
    )
  }

  // ── Steuer-Karten (werden inline als Überblick UND in der Bühnen-Seitenleiste gezeigt) ──
  const listControls = (
    <Stack space={3}>
      <Card padding={3} radius={2} border>
        <Stack space={2}>
          <Text size={1} weight="semibold" muted>STANDARDMASSE</Text>
          {STD.map((s) => {
            const placed = placedByMetric.get(s.metric)
            const val = placed ? readValue(s.metric) : ''
            return (
              <Flex key={s.metric} align="center" gap={2}>
                <Box flex={1}>
                  <Flex align="center" gap={2}>
                    <Text size={2} weight="semibold"
                      style={{color: placed ? '#00a8e8' : '#999', minWidth: 14}}>
                      {placed ? '✓' : '○'}
                    </Text>
                    <Text size={2} weight={placed ? 'semibold' : 'regular'}>{s.name}</Text>
                    {placed && val && (
                      <Text size={1} muted>· {val}{s.unit === '°' ? '°' : ' mm'}</Text>
                    )}
                    {placed && !val && (
                      <Text size={1} muted style={{color: '#c80'}}>· kein Wert</Text>
                    )}
                  </Flex>
                </Box>
                {placed ? (
                  <Inline space={1}>
                    <Button text="Bearbeiten" mode="ghost" tone="primary" fontSize={1}
                      onClick={() => startEdit(placed)} />
                    <Button text="✕" mode="bleed" tone="critical" fontSize={1}
                      onClick={() => deleteAnnotation(placed._key)} />
                  </Inline>
                ) : (
                  <Button text="+ Platzieren" mode="ghost" tone="primary" fontSize={1}
                    onClick={() => {
                      setMode({kind: 'place', metric: s.metric, value: ''})
                      setFullscreen(true)
                    }} />
                )}
              </Flex>
            )
          })}
        </Stack>
      </Card>

      <Card padding={3} radius={2} border>
        <Stack space={2}>
          <Text size={1} weight="semibold" muted>EIGENE MASSE (z. B. Laufradgrößen)</Text>
          {customAnns.length === 0 && (
            <Text size={1} muted>Keine eigenen Maße — z. B. „27,5"" oder „29""</Text>
          )}
          {customAnns.map((a) => (
            <Flex key={a._key} align="center" gap={2}>
              <Box flex={1}>
                <Text size={2}>{a.customLabel || '(ohne Beschriftung)'}</Text>
              </Box>
              <Inline space={1}>
                <Button text="Bearbeiten" mode="ghost" fontSize={1}
                  onClick={() => { setMode({kind: 'edit', key: a._key, value: ''}); setFullscreen(true) }} />
                <Button text="✕" mode="bleed" tone="critical" fontSize={1}
                  onClick={() => deleteAnnotation(a._key)} />
              </Inline>
            </Flex>
          ))}
          <Box>
            <Button text="+ Eigenes Maß" mode="ghost" tone="primary" fontSize={1}
              onClick={() => {
                const label = window.prompt('Beschriftung des eigenen Maßes (z. B. „29\"")', '')
                if (label) {
                  setMode({kind: 'place', metric: 'custom', customLabel: label, value: ''})
                  setFullscreen(true)
                }
              }} />
          </Box>
        </Stack>
      </Card>

      <Text size={1} muted>
        Klick aufs Foto öffnet die große Bühne. „Platzieren" startet sie fokussiert für ein Maß;
        bestehende Pfeile bleiben als gedimmte Referenz. „Bearbeiten" lässt dich Endpunkte ziehen
        und den Wert für die fotografierte Größe ({photographedSize}) anpassen.
      </Text>
    </Stack>
  )

  const placeControls = mode.kind === 'place' ? (
    <Card padding={3} radius={2} tone="primary" border>
      <Stack space={3}>
        <Text size={2} weight="semibold">
          {currentStd?.name || mode.customLabel || 'Maß'} platzieren
        </Text>
        {!mode.p1 ? (
          <Text size={1}>1/3 · Klick den <b>Start</b>-Punkt auf dem Foto (i. d. R. nahe Tretlager / Drehpunkt).</Text>
        ) : !mode.p2 ? (
          <Text size={1}>2/3 · Klick den <b>Ende</b>-Punkt. Beim zweiten Klick rastet die Linie an waagerecht/senkrecht ein (Shift = zusätzlich 45°).</Text>
        ) : currentStd ? (
          <>
            <Text size={1}>3/3 · Wert für Größe <b>{photographedSize}</b> eintragen:</Text>
            <Flex gap={2} align="center">
              <Box flex={1}>
                <TextInput
                  autoFocus
                  value={mode.value}
                  onChange={(e) => {
                    const v = e.currentTarget.value
                    setMode((m) => m.kind === 'place' ? {...m, value: v} : m)
                  }}
                  placeholder={currentStd.unit === '°' ? 'z. B. 63,75' : 'z. B. 475'}
                />
              </Box>
              <Text size={2} muted>{currentStd.unit === '°' ? '°' : 'mm'}</Text>
            </Flex>
          </>
        ) : (
          <Text size={1} muted>Beschriftung: „{mode.customLabel}" (eigene Maße haben keinen Wert in der Größen-Tabelle).</Text>
        )}
        <Flex gap={2} wrap="wrap">
          {mode.p1 && mode.p2 && (
            <Button text="Speichern" tone="primary" onClick={commitNew} />
          )}
          {mode.p2 && (
            <Button text="Punkt 2 neu setzen" mode="ghost"
              onClick={() => setMode((m) => m.kind === 'place' ? {...m, p2: undefined} : m)} />
          )}
          {mode.p1 && !mode.p2 && (
            <Button text="Punkt 1 neu setzen" mode="ghost"
              onClick={() => setMode((m) => m.kind === 'place' ? {...m, p1: undefined} : m)} />
          )}
          <Box flex={1} />
          <Button text="Abbrechen" mode="ghost" onClick={() => setMode({kind: 'list'})} />
        </Flex>
      </Stack>
    </Card>
  ) : null

  const editControls = mode.kind === 'edit' && currentEditAnn ? (
    <Card padding={3} radius={2} border>
      <Stack space={3}>
        <Text size={2} weight="semibold">
          {currentStd?.name || currentEditAnn.customLabel || 'Maß'} bearbeiten
        </Text>
        <Text size={1} muted>
          Pfeil-Endpunkte (blau = Start, weiß = Ende) direkt im Foto ziehen — Snap an
          waagerecht/senkrecht, Shift zusätzlich 45°, nah an fremdem Endpunkt rastet bündig ein.
        </Text>
        {currentStd && (
          <Flex gap={2} align="center">
            <Box style={{minWidth: 140}}>
              <Text size={1}>Wert (Größe {photographedSize}):</Text>
            </Box>
            <Box flex={1}>
              <TextInput
                value={mode.value}
                onChange={(e) => {
                  const v = e.currentTarget.value
                  setMode((m) => m.kind === 'edit' ? {...m, value: v} : m)
                }}
                placeholder={currentStd.unit === '°' ? 'z. B. 63,75' : 'z. B. 475'}
              />
            </Box>
            <Text size={2} muted>{currentStd.unit === '°' ? '°' : 'mm'}</Text>
          </Flex>
        )}
        <Flex gap={2} wrap="wrap">
          <Button text="Fertig" tone="primary" onClick={commitEdit} />
          <Box flex={1} />
          <Button text="Maß löschen" tone="critical" mode="ghost"
            onClick={() => deleteAnnotation(mode.key)} />
        </Flex>
      </Stack>
    </Card>
  ) : null

  const sidebar =
    mode.kind === 'place' ? placeControls :
    mode.kind === 'edit' ? editControls :
    listControls

  const stageTitle =
    mode.kind === 'place'
      ? (!mode.p1 ? 'Punkt 1 (Start) auf dem Foto klicken'
         : !mode.p2 ? 'Punkt 2 (Ende) klicken — rastet waagerecht/senkrecht ein (Shift = 45°)'
         : `${currentStd?.name || mode.customLabel || 'Maß'} — Wert rechts eintragen`)
      : mode.kind === 'edit'
      ? `${currentStd?.name || currentEditAnn?.customLabel || 'Maß'} bearbeiten — Endpunkte ziehen`
      : 'Maßlinien · rechts „Platzieren", oder einen Pfeil zum Bearbeiten anklicken'

  return (
    <Stack space={3}>
      {imageUrl ? (
        // Inline-Vorschau — Klick öffnet die große Bühne.
        <Card border radius={2} overflow="hidden">
          <div
            onClick={() => setFullscreen(true)}
            style={{position: 'relative', cursor: 'zoom-in', userSelect: 'none', lineHeight: 0}}
            title="Maßlinien bearbeiten — öffnen"
          >
            <img src={imageUrl} alt="" style={{width: '100%', display: 'block'}} draggable={false} />
            {/* Bestehende Pfeile als reine Referenz */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none"
                 style={{position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none'}}>
              {anns.map((a) => {
                if ([a.x1, a.y1, a.x2, a.y2].some((v) => typeof v !== 'number')) return null
                return (
                  <line key={a._key}
                    x1={(a.x1 as number) * 100} y1={(a.y1 as number) * 100}
                    x2={(a.x2 as number) * 100} y2={(a.y2 as number) * 100}
                    stroke="#00a8e8" strokeWidth={2} vectorEffect="non-scaling-stroke" />
                )
              })}
            </svg>
            {anns.map((a, i) => {
              if (typeof a.x1 !== 'number' || typeof a.y1 !== 'number') return null
              return (
                <span key={a._key} style={{
                  position: 'absolute', left: `${a.x1 * 100}%`, top: `${a.y1 * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  minWidth: 16, height: 16, padding: '0 3px', borderRadius: 8,
                  background: '#00a8e8', color: '#fff', fontSize: 10, fontWeight: 700,
                  lineHeight: '16px', textAlign: 'center', pointerEvents: 'none',
                }}>{i + 1}</span>
              )
            })}
            <PreviewHint>
              {anns.length > 0
                ? `${anns.length} Maßlinie${anns.length === 1 ? '' : 'n'} · zum Bearbeiten klicken`
                : 'Klicken, um Maßlinien anzulegen'}
            </PreviewHint>
          </div>
        </Card>
      ) : (
        <Card padding={4} radius={2} tone="caution" border>
          <Text size={1}>Erst oben ein „Bike-Foto" hochladen, dann hier Maßlinien anlegen.</Text>
        </Card>
      )}

      {/* Checkliste als Überblick auch im Dokument (die eigentliche Arbeit passiert auf der Bühne). */}
      {imageUrl && listControls}

      {/* ── Große Bühne ────────────────────────────────────────────────── */}
      <EditStagePortal
        open={fullscreen && !!imageUrl}
        onClose={() => { setFullscreen(false); setMode({kind: 'list'}) }}
        closeLabel="Schließen"
        title={stageTitle}
        sidebar={sidebar}
      >
        <div
          ref={stageRef}
          onClick={handleStageClick}
          style={{
            position: 'relative', display: 'inline-block', maxWidth: '100%',
            cursor: stageCursor, userSelect: 'none', lineHeight: 0, touchAction: 'none',
            boxShadow: '0 10px 60px rgba(0,0,0,0.6)',
          }}
        >
          <img src={stageImageUrl || imageUrl || ''} alt=""
            draggable={false}
            style={{
              display: 'block', maxWidth: '100%', maxHeight: 'calc(100vh - 140px)',
              width: 'auto', height: 'auto',
              opacity: mode.kind === 'list' ? 1 : 0.9,
            }} />
          {renderArrows()}
          {(mode.kind === 'place' || mode.kind === 'edit') && (
            <div style={{
              position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
              padding: '6px 14px', borderRadius: 999,
              background: mode.kind === 'place' ? '#00a8e8' : '#222',
              color: '#fff', fontWeight: 700, fontSize: 13,
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)', pointerEvents: 'none',
            }}>
              {mode.kind === 'place'
                ? (!mode.p1 ? 'Klick Punkt 1 (Start)'
                   : !mode.p2 ? 'Klick Punkt 2 (Ende)'
                   : `${currentStd?.name || mode.customLabel || ''} – Wert rechts eintragen`)
                : `${currentStd?.name || currentEditAnn?.customLabel || 'Maß'} bearbeiten`}
            </div>
          )}
        </div>
      </EditStagePortal>
    </Stack>
  )
}

// Style-Helfer für die Punkt-Vorschau im place-Modus
function previewDot(color: string, size: number, x: number, y: number): React.CSSProperties {
  return {
    position: 'absolute', left: `${x * 100}%`, top: `${y * 100}%`,
    transform: 'translate(-50%, -50%)',
    width: size, height: size, borderRadius: '50%',
    background: 'transparent', border: `2px solid ${color}`,
    boxShadow: '0 0 0 1px rgba(0,0,0,0.4)', pointerEvents: 'none',
  }
}
function previewCenter(color: string): React.CSSProperties {
  return {
    position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
    width: 4, height: 4, borderRadius: '50%', background: color,
    boxShadow: '0 0 0 1.5px rgba(255,255,255,0.9)', pointerEvents: 'none',
  }
}
