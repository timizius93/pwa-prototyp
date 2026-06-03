import {useCallback, useEffect, useRef, useState} from 'react'
import {createPortal} from 'react-dom'
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
import imageUrlBuilder from '@sanity/image-url'

// Visueller Studio-Input für Klick-Zonen auf einem Anzeigen-Bild.
//
// Interaktionsmuster (bewusst wie ein „Lightbox-Editor", weil Sanitys Array-Item-Dialog
// in dieser Version zu schmal ist und sich nicht zuverlässig breiter schalten lässt):
//   - Inline siehst du eine Vorschau des Fotos mit den bestehenden Zonen.
//   - KLICK aufs Foto → es expandiert auf eine große, randlose Bearbeiten-Bühne (Portal,
//     ~90 % Viewport, abgedunkelter Hintergrund). Kein extra „Groß bearbeiten"-Button.
//   - Auf der Bühne: klicken+ziehen → neue Zone · Rand/Ecke ziehen → Größe · Mitte ziehen
//     → verschieben · × → entfernen · „Fertig"/Escape → zurück.
//
// Speichert x/y/w/h relativ (0–1) ins Dokument; URL trägt der Editor im Listen-Formular darunter ein.
// Gleiche Wiederverwendbarkeits-Logik wie HotspotPositioner (parentPath → adImageWithZones.image).
// Das „Klick-aufs-Bild-öffnet-große-Bühne"-Muster ist als gemeinsames Studio-Pattern gedacht
// (perspektivisch auch für Hotspot- und Geometrie-Placer).

type Zone = {
  _key: string
  x?: number
  y?: number
  w?: number
  h?: number
  url?: string
  label?: string
}

type DragState =
  | {kind: 'create'; x0: number; y0: number; x1: number; y1: number}
  | {kind: 'move'; key: string; dx: number; dy: number; x: number; y: number; w: number; h: number}
  | {kind: 'resize'; key: string; handle: Handle; x: number; y: number; w: number; h: number}

type Handle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

const HANDLES: Handle[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']
const MIN_SIZE = 0.015 // Verwerfen, wenn die aufgezogene Zone < 1.5 % der Bildkante ist

function newKey() {
  return Math.random().toString(36).slice(2, 12)
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

function round(n: number) {
  return Math.round(n * 1000) / 1000
}

export function ClickZonePositioner(props: ArrayOfObjectsInputProps) {
  const {value = [], onChange, path, renderDefault} = props
  const zones = value as unknown as Zone[]

  const client = useClient({apiVersion: '2021-06-07'})
  const parentPath = path.slice(0, -1)
  // Backdrop-Foto aus dem passenden Geschwisterfeld: das Array `clickZonesMobile` liest
  // `imageMobile`, alles andere (`clickZones`) liest `image`. So funktioniert derselbe
  // Placer für beide Orientierungs-Varianten.
  const fieldName = String(path[path.length - 1])
  const imageField = fieldName === 'clickZonesMobile' ? 'imageMobile' : 'image'
  const imageVal = useFormValue([...parentPath, imageField]) as
    | {asset?: {_ref?: string}}
    | undefined

  const stageRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [expanded, setExpanded] = useState(false)

  const imageUrl = imageVal?.asset?._ref
    ? imageUrlBuilder(client).image(imageVal).width(1400).fit('max').url()
    : null
  // Größere Auflösung für die Vollbild-Bühne (das Foto wird groß dargestellt).
  const stageImageUrl = imageVal?.asset?._ref
    ? imageUrlBuilder(client).image(imageVal).width(2400).fit('max').url()
    : null

  // Escape schließt die Bühne; Body-Scroll sperren, solange offen.
  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false)
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [expanded])

  const posFromEvent = useCallback((clientX: number, clientY: number) => {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return {x: 0.5, y: 0.5}
    return {
      x: clamp01((clientX - rect.left) / rect.width),
      y: clamp01((clientY - rect.top) / rect.height),
    }
  }, [])

  // Klick + Ziehen auf freier Bildfläche → neue Zone aufziehen
  const handleStagePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest('[data-zone]')) return
      e.preventDefault()
      const {x, y} = posFromEvent(e.clientX, e.clientY)
      setDrag({kind: 'create', x0: x, y0: y, x1: x, y1: y})
    },
    [posFromEvent],
  )

  useEffect(() => {
    if (!drag) return
    const onMove = (e: PointerEvent) => {
      const {x, y} = posFromEvent(e.clientX, e.clientY)
      setDrag((d) => {
        if (!d) return d
        if (d.kind === 'create') return {...d, x1: x, y1: y}
        if (d.kind === 'move')
          return {
            ...d,
            x: clamp01(x - d.dx),
            y: clamp01(y - d.dy),
          }
        if (d.kind === 'resize') {
          let {x: zx, y: zy, w, h} = d
          const right = zx + w
          const bottom = zy + h
          if (d.handle.includes('e')) w = clamp01(x - zx)
          if (d.handle.includes('s')) h = clamp01(y - zy)
          if (d.handle.includes('w')) {
            const nx = clamp01(x)
            w = clamp01(right - nx)
            zx = nx
          }
          if (d.handle.includes('n')) {
            const ny = clamp01(y)
            h = clamp01(bottom - ny)
            zy = ny
          }
          return {...d, x: zx, y: zy, w, h}
        }
        return d
      })
    }
    const onUp = () => {
      setDrag((d) => {
        if (!d) return null
        if (d.kind === 'create') {
          const x = Math.min(d.x0, d.x1)
          const y = Math.min(d.y0, d.y1)
          const w = Math.abs(d.x1 - d.x0)
          const h = Math.abs(d.y1 - d.y0)
          if (w >= MIN_SIZE && h >= MIN_SIZE) {
            const item = {
              _key: newKey(),
              _type: 'clickZone',
              x: round(x),
              y: round(y),
              w: round(w),
              h: round(h),
            }
            onChange([setIfMissing([]), insert([item], 'after', [-1])])
          }
        } else if (d.kind === 'move' || d.kind === 'resize') {
          // Mindestgröße bei Resize einhalten
          const w = Math.max(d.w, MIN_SIZE)
          const h = Math.max(d.h, MIN_SIZE)
          onChange([
            set(round(d.x), [{_key: d.key}, 'x']),
            set(round(d.y), [{_key: d.key}, 'y']),
            set(round(w), [{_key: d.key}, 'w']),
            set(round(h), [{_key: d.key}, 'h']),
          ])
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

  // Live-Preview-Rect während Erstellen/Ziehen/Resizen
  const liveRectFor = (z: Zone) => {
    if (drag?.kind === 'move' && drag.key === z._key)
      return {x: drag.x, y: drag.y, w: drag.w, h: drag.h}
    if (drag?.kind === 'resize' && drag.key === z._key)
      return {x: drag.x, y: drag.y, w: drag.w, h: drag.h}
    return {x: z.x ?? 0, y: z.y ?? 0, w: z.w ?? 0, h: z.h ?? 0}
  }

  // Die interaktiven Zone-Rechtecke (mit Griffen) — nur auf der Vollbild-Bühne.
  const interactiveZones = zones.map((z, i) => {
    const r = liveRectFor(z)
    return (
      <ZoneRect
        key={z._key}
        index={i}
        label={z.label}
        rect={r}
        onMoveStart={(clientX, clientY) => {
          const {x: cx, y: cy} = posFromEvent(clientX, clientY)
          setDrag({kind: 'move', key: z._key, dx: cx - r.x, dy: cy - r.y, x: r.x, y: r.y, w: r.w, h: r.h})
        }}
        onResizeStart={(handle) => {
          setDrag({kind: 'resize', key: z._key, handle, x: r.x, y: r.y, w: r.w, h: r.h})
        }}
        onRemove={() => remove(z._key)}
      />
    )
  })

  return (
    <Stack space={4}>
      {imageUrl ? (
        // Inline-Vorschau — nicht-interaktiv, Klick öffnet die große Bühne.
        <Card border radius={2} overflow="hidden">
          <div
            onClick={() => setExpanded(true)}
            style={{position: 'relative', cursor: 'zoom-in', userSelect: 'none', lineHeight: 0}}
            title="Zum Bearbeiten der Klick-Zonen öffnen"
          >
            <img src={imageUrl} alt="" style={{width: '100%', display: 'block'}} draggable={false} />

            {/* Bestehende Zonen als reine Markierung (nicht editierbar in der Vorschau) */}
            {zones.map((z, i) => (
              <div
                key={z._key}
                style={{
                  position: 'absolute',
                  left: `${(z.x ?? 0) * 100}%`,
                  top: `${(z.y ?? 0) * 100}%`,
                  width: `${(z.w ?? 0) * 100}%`,
                  height: `${(z.h ?? 0) * 100}%`,
                  border: '2px solid rgba(0, 168, 232, 0.9)',
                  background: 'rgba(0, 168, 232, 0.12)',
                  boxSizing: 'border-box',
                  pointerEvents: 'none',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: 2,
                    minWidth: 18,
                    height: 18,
                    padding: '0 4px',
                    borderRadius: 9,
                    background: '#00a8e8',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {i + 1}
                </span>
              </div>
            ))}

            {/* Hover-/Klick-Hinweis */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                padding: 12,
                pointerEvents: 'none',
              }}
            >
              <span
                style={{
                  background: 'rgba(0,0,0,0.72)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '6px 12px',
                  borderRadius: 999,
                  lineHeight: 1.2,
                }}
              >
                {zones.length > 0
                  ? `${zones.length} Klick-${zones.length === 1 ? 'Zone' : 'Zonen'} · zum Bearbeiten klicken`
                  : 'Klicken, um Klick-Zonen zu zeichnen'}
              </span>
            </div>
          </div>
        </Card>
      ) : (
        <Card padding={4} radius={2} tone="caution" border>
          <Text size={1}>Erst oben das „Anzeigen-Bild" hochladen, dann hier Zonen aufziehen.</Text>
        </Card>
      )}

      <Box>
        <Text size={1} muted>
          Klick aufs Bild öffnet die große Bearbeiten-Bühne. Dort: klicken + ziehen → neue Zone ·
          Rand/Ecke ziehen → Größe · Mitte ziehen → verschieben · × → entfernen. URL trägst du in
          der Liste darunter ein.
        </Text>
      </Box>

      {renderDefault(props)}

      {/* ── Vollbild-Bühne (Portal) ───────────────────────────────────────── */}
      {expanded &&
        stageImageUrl &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(8, 9, 12, 0.92)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Kopfleiste */}
            <Flex
              align="center"
              justify="space-between"
              paddingX={4}
              paddingY={3}
              style={{flex: '0 0 auto', borderBottom: '1px solid rgba(255,255,255,0.12)'}}
            >
              <Text size={1} weight="semibold" style={{color: '#fff'}}>
                Klick-Zonen bearbeiten · klicken + ziehen → neue Zone · Rand/Ecke = Größe · × = löschen
              </Text>
              <Button text="Fertig" tone="primary" onClick={() => setExpanded(false)} />
            </Flex>

            {/* Bühne */}
            <div
              style={{
                flex: '1 1 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                minHeight: 0,
              }}
            >
              <div
                ref={stageRef}
                onPointerDown={handleStagePointerDown}
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  lineHeight: 0,
                  cursor: 'crosshair',
                  userSelect: 'none',
                  touchAction: 'none',
                  boxShadow: '0 10px 60px rgba(0,0,0,0.6)',
                }}
              >
                <img
                  src={stageImageUrl}
                  alt=""
                  draggable={false}
                  style={{
                    display: 'block',
                    maxWidth: '88vw',
                    maxHeight: 'calc(100vh - 140px)',
                    width: 'auto',
                    height: 'auto',
                  }}
                />

                {/* Live-Vorschau beim Aufziehen */}
                {drag?.kind === 'create' && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${Math.min(drag.x0, drag.x1) * 100}%`,
                      top: `${Math.min(drag.y0, drag.y1) * 100}%`,
                      width: `${Math.abs(drag.x1 - drag.x0) * 100}%`,
                      height: `${Math.abs(drag.y1 - drag.y0) * 100}%`,
                      border: '2px dashed #00a8e8',
                      background: 'rgba(0, 168, 232, 0.15)',
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {interactiveZones}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </Stack>
  )
}

function ZoneRect({
  index,
  label,
  rect,
  onMoveStart,
  onResizeStart,
  onRemove,
}: {
  index: number
  label?: string
  rect: {x: number; y: number; w: number; h: number}
  onMoveStart: (clientX: number, clientY: number) => void
  onResizeStart: (handle: Handle) => void
  onRemove: () => void
}) {
  return (
    <div
      data-zone
      style={{
        position: 'absolute',
        left: `${rect.x * 100}%`,
        top: `${rect.y * 100}%`,
        width: `${rect.w * 100}%`,
        height: `${rect.h * 100}%`,
        border: '2px solid #00a8e8',
        background: 'rgba(0, 168, 232, 0.12)',
        boxSizing: 'border-box',
      }}
    >
      {/* Move-Fläche (gesamte Innenfläche) */}
      <div
        onPointerDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onMoveStart(e.clientX, e.clientY)
        }}
        style={{
          position: 'absolute',
          inset: 6,
          cursor: 'move',
          touchAction: 'none',
        }}
      />

      {/* Nummer-Badge */}
      <div
        style={{
          position: 'absolute',
          top: 4,
          left: 4,
          minWidth: 22,
          height: 22,
          padding: '0 6px',
          borderRadius: 11,
          background: '#00a8e8',
          color: '#fff',
          fontSize: 12,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
          pointerEvents: 'none',
        }}
      >
        {index + 1}
        {label ? <span style={{marginLeft: 6, fontWeight: 500}}>{label}</span> : null}
      </div>

      {/* Entfernen */}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        aria-label="Klick-Zone entfernen"
        style={{
          position: 'absolute',
          top: -10,
          right: -10,
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: 'none',
          background: '#e23',
          color: '#fff',
          fontSize: 13,
          lineHeight: '18px',
          cursor: 'pointer',
          padding: 0,
          boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }}
      >
        ×
      </button>

      {/* 8 Resize-Griffe */}
      {HANDLES.map((h) => (
        <div
          key={h}
          onPointerDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onResizeStart(h)
          }}
          style={{
            position: 'absolute',
            width: 12,
            height: 12,
            borderRadius: 2,
            background: '#fff',
            border: '2px solid #00a8e8',
            cursor: handleCursor(h),
            touchAction: 'none',
            ...handlePosition(h),
          }}
        />
      ))}
    </div>
  )
}

function handlePosition(h: Handle): React.CSSProperties {
  const offset = -6
  const map: Record<Handle, React.CSSProperties> = {
    n: {top: offset, left: '50%', transform: 'translateX(-50%)'},
    s: {bottom: offset, left: '50%', transform: 'translateX(-50%)'},
    e: {right: offset, top: '50%', transform: 'translateY(-50%)'},
    w: {left: offset, top: '50%', transform: 'translateY(-50%)'},
    ne: {top: offset, right: offset},
    nw: {top: offset, left: offset},
    se: {bottom: offset, right: offset},
    sw: {bottom: offset, left: offset},
  }
  return map[h]
}

function handleCursor(h: Handle): string {
  const map: Record<Handle, string> = {
    n: 'ns-resize',
    s: 'ns-resize',
    e: 'ew-resize',
    w: 'ew-resize',
    ne: 'nesw-resize',
    sw: 'nesw-resize',
    nw: 'nwse-resize',
    se: 'nwse-resize',
  }
  return map[h]
}

// Listen-Zeile mit Nummer-Badge — wie bei den Hotspots, damit Liste + Bild synchron sind.
export function NumberedZoneItem(props: ObjectItemProps) {
  const arrayPath = props.path.slice(0, -1)
  const arr = useFormValue(arrayPath) as Array<{_key?: string}> | undefined
  const key = (props.value as {_key?: string})?._key
  const liveIdx = Array.isArray(arr) ? arr.findIndex((z) => z?._key === key) : -1
  const n = (liveIdx >= 0 ? liveIdx : props.index) + 1
  const open = props.open
  return (
    <Flex align={open ? 'flex-start' : 'center'} gap={1}>
      <Card
        tone="primary"
        style={{
          flex: '0 0 auto',
          marginTop: open ? 8 : 0,
          marginLeft: 2,
          width: 20,
          height: 20,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }}
      >
        <Text size={0} weight="bold">
          {n}
        </Text>
      </Card>
      <Box flex={1}>{props.renderDefault(props)}</Box>
    </Flex>
  )
}
