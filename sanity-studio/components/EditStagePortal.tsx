import {useEffect, type ReactNode} from 'react'
import {createPortal} from 'react-dom'
import {Button, Flex, Text} from '@sanity/ui'

// Gemeinsames Chrome für die „große Bearbeiten-Bühne" aller visuellen Placer
// (Klick-Zonen, Hotspots, Geometrie). Liefert: abgedunkeltes Vollbild-Portal,
// Kopfleiste mit Hinweistext + „Fertig", Escape-zum-Schließen, Body-Scroll-Lock,
// zentrierte Bühne und eine optionale Seitenleiste (für Wizard-Steuerung).
//
// Die eigentliche Bühne (Foto-Wrapper mit ref + Overlays) reicht der Aufrufer als
// `children` rein — so bleibt die Koordinaten-/Zeichenlogik beim jeweiligen Placer.
//
// Interaktionsmuster studio-weit: Klick aufs Foto öffnet diese Bühne, „Fertig"/Escape
// schließt sie. Kein separater „Groß bearbeiten"-Button mehr.
export function EditStagePortal({
  open,
  onClose,
  title,
  closeLabel = 'Fertig',
  sidebar,
  children,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  closeLabel?: string
  sidebar?: ReactNode
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(8, 9, 12, 0.92)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Kopfleiste */}
      <Flex
        align="center"
        justify="space-between"
        gap={3}
        paddingX={4}
        paddingY={3}
        style={{flex: '0 0 auto', borderBottom: '1px solid rgba(255,255,255,0.12)'}}
      >
        <Text size={1} weight="semibold" style={{color: '#fff'}}>
          {title}
        </Text>
        <Button text={closeLabel} tone="primary" onClick={onClose} />
      </Flex>

      {/* Body: Bühne (+ optionale Seitenleiste) */}
      <div style={{flex: '1 1 auto', display: 'flex', minHeight: 0}}>
        <div
          style={{
            flex: '1 1 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            minHeight: 0,
            minWidth: 0,
          }}
        >
          {children}
        </div>
        {sidebar && (
          <div
            style={{
              flex: '0 0 340px',
              maxWidth: '38vw',
              overflowY: 'auto',
              padding: 20,
              borderLeft: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            {sidebar}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

// Kleiner Klick-Hinweis-Pill, der unten mittig auf der Inline-Vorschau schwebt.
export function PreviewHint({children}: {children: ReactNode}) {
  return (
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
        {children}
      </span>
    </div>
  )
}
