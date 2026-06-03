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
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import imageUrlBuilder from '@sanity/image-url'
import {EditStagePortal, PreviewHint} from './EditStagePortal'

// Custom-Input für das hotspots-Array: zeigt das Basis-Foto, der Editor klickt zum Setzen und
// zieht zum Verschieben — statt x/y von Hand zu tippen. Schreibt dieselben x/y-Felder (0–1) ins
// Dokument, die der Reader liest. Unter dem Bild bleibt das normale Array-Formular (renderDefault)
// für Beschriftung + Detail-Foto + Detail-Text pro Hotspot erhalten.
//
// Gleiches Muster wie Sanitys eingebautes Crop-/Fokuspunkt-Werkzeug (Custom Input Component) —
// und wiederverwendbar fürs spätere Geometrie-Overlay (Pfeil-Endpunkte auf dem Foto setzen).

type Hotspot = {_key: string; x?: number; y?: number; label?: {de?: string}}

function newKey() {
  return Math.random().toString(36).slice(2, 12)
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

export function HotspotPositioner(props: ArrayOfObjectsInputProps) {
  const {value = [], onChange, path, renderDefault} = props
  const hotspots = value as unknown as Hotspot[]

  const client = useClient({apiVersion: '2021-06-07'})
  const parentPath = path.slice(0, -1)
  // Standalone hotspotImage nutzt `baseImage`; im Kombi-Baustein interactiveBike heißt das
  // gemeinsame Foto `bikePhoto`. Beide unterstützen → Placer funktioniert in beiden Kontexten.
  const baseImageVal = useFormValue([...parentPath, 'baseImage']) as
    | {asset?: {_ref?: string}}
    | undefined
  const bikePhotoVal = useFormValue([...parentPath, 'bikePhoto']) as
    | {asset?: {_ref?: string}}
    | undefined
  const baseImage = baseImageVal?.asset?._ref ? baseImageVal : bikePhotoVal

  const stageRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<{key: string; x: number; y: number} | null>(null)
  const [expanded, setExpanded] = useState(false)

  const imageUrl =
    baseImage?.asset?._ref
      ? imageUrlBuilder(client).image(baseImage).width(1400).fit('max').url()
      : null
  // Höhere Auflösung für die große Bühne.
  const stageImageUrl =
    baseImage?.asset?._ref
      ? imageUrlBuilder(client).image(baseImage).width(2400).fit('max').url()
      : null

  const posFromEvent = useCallback((clientX: number, clientY: number) => {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return {x: 0.5, y: 0.5}
    return {
      x: clamp01((clientX - rect.left) / rect.width),
      y: clamp01((clientY - rect.top) / rect.height),
    }
  }, [])

  // Klick auf freie Bildfläche → neuen Hotspot anlegen
  const handleStageClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-marker]')) return // Marker selbst nicht
      const {x, y} = posFromEvent(e.clientX, e.clientY)
      const item = {_key: newKey(), _type: 'hotspot', x: round(x), y: round(y)}
      onChange([setIfMissing([]), insert([item], 'after', [-1])])
    },
    [onChange, posFromEvent],
  )

  // Ziehen eines Markers
  useEffect(() => {
    if (!drag) return
    const onMove = (e: PointerEvent) => {
      const {x, y} = posFromEvent(e.clientX, e.clientY)
      setDrag((d) => (d ? {...d, x, y} : d))
    }
    const onUp = () => {
      setDrag((d) => {
        if (d) onChange([set(round(d.x), [{_key: d.key}, 'x']), set(round(d.y), [{_key: d.key}, 'y'])])
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

  const remove = useCallback(
    (key: string) => onChange(unset([{_key: key}])),
    [onChange],
  )

  // Interaktive Marker (klick-/ziehbar, × zum Löschen) — nur auf der großen Bühne.
  const interactiveMarkers = hotspots.map((h, i) => {
    const live = drag?.key === h._key ? drag : h
    const x = typeof live.x === 'number' ? live.x : 0.5
    const y = typeof live.y === 'number' ? live.y : 0.5
    return (
      <div
        key={h._key}
        data-marker
        onPointerDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setDrag({key: h._key, x, y})
        }}
        title={h.label?.de || `Hotspot ${i + 1}`}
        style={{
          position: 'absolute',
          left: `${x * 100}%`,
          top: `${y * 100}%`,
          transform: 'translate(-50%, -50%)',
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: '#00a8e8',
          border: '2px solid #fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          color: '#fff',
          fontSize: 13,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
          touchAction: 'none',
        }}
      >
        {i + 1}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            remove(h._key)
          }}
          aria-label="Hotspot entfernen"
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            width: 16,
            height: 16,
            borderRadius: '50%',
            border: 'none',
            background: '#e23',
            color: '#fff',
            fontSize: 11,
            lineHeight: '14px',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ×
        </button>
      </div>
    )
  })

  return (
    <Stack space={4}>
      {imageUrl ? (
        // Inline-Vorschau — Klick öffnet die große Bühne.
        <Card border radius={2} overflow="hidden">
          <div
            onClick={() => setExpanded(true)}
            style={{position: 'relative', cursor: 'zoom-in', userSelect: 'none', lineHeight: 0}}
            title="Zum Setzen/Bearbeiten der Hotspots öffnen"
          >
            <img src={imageUrl} alt="" style={{width: '100%', display: 'block'}} draggable={false} />
            {hotspots.map((h, i) => {
              const x = typeof h.x === 'number' ? h.x : 0.5
              const y = typeof h.y === 'number' ? h.y : 0.5
              return (
                <div
                  key={h._key}
                  style={{
                    position: 'absolute',
                    left: `${x * 100}%`,
                    top: `${y * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: '#00a8e8',
                    border: '2px solid #fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  {i + 1}
                </div>
              )
            })}
            <PreviewHint>
              {hotspots.length > 0
                ? `${hotspots.length} Hotspot${hotspots.length === 1 ? '' : 's'} · zum Bearbeiten klicken`
                : 'Klicken, um Hotspots zu setzen'}
            </PreviewHint>
          </div>
        </Card>
      ) : (
        <Card padding={4} radius={2} tone="caution" border>
          <Text size={1}>Erst oben ein „Basis-Foto" hochladen, dann hier Hotspots klicken.</Text>
        </Card>
      )}

      <Box>
        <Text size={1} muted>
          Klick aufs Foto öffnet die große Bühne. Dort: aufs Foto klicken setzt einen Hotspot ·
          Punkt ziehen verschiebt · × entfernt. Details (Beschriftung, Detail-Foto, Text) füllst du
          in der Liste darunter.
        </Text>
      </Box>

      {renderDefault(props)}

      {/* ── Große Bühne ────────────────────────────────────────────────── */}
      <EditStagePortal
        open={expanded && !!stageImageUrl}
        onClose={() => setExpanded(false)}
        title="Hotspots setzen · aufs Foto klicken = neuer Punkt · ziehen = verschieben · × = löschen"
      >
        <div
          ref={stageRef}
          onClick={handleStageClick}
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
            src={stageImageUrl || imageUrl || ''}
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
          {interactiveMarkers}
        </div>
      </EditStagePortal>
    </Stack>
  )
}

function round(n: number) {
  return Math.round(n * 1000) / 1000
}

// Pro Listen-Zeile (auch eingeklappt) ein blaues Nummern-Badge — passend zur Marker-Nummer oben.
// Die Nummer kommt aus der LIVE-Array-Position des eigenen _key (nicht aus props.index, das nach
// Drag&Drop veraltet) — so teilen Liste und Bild-Marker exakt dieselbe Quelle und laufen beim
// Umsortieren immer synchron.
export function NumberedHotspotItem(props: ObjectItemProps) {
  const arrayPath = props.path.slice(0, -1)
  const arr = useFormValue(arrayPath) as Array<{_key?: string}> | undefined
  const key = (props.value as {_key?: string})?._key
  const liveIdx = Array.isArray(arr) ? arr.findIndex((h) => h?._key === key) : -1
  const n = (liveIdx >= 0 ? liveIdx : props.index) + 1
  // Eingeklappt (Übersicht): Badge vertikal mittig zur Zeile. Aufgeklappt: oben am Header.
  const open = props.open
  return (
    <Flex align={open ? 'flex-start' : 'center'} gap={1}>
      {/* tone="primary" zieht Hinter- und Schriftfarbe aus dem Studio-Theme (Dark-Mode-fähig) */}
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
