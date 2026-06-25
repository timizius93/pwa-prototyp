'use client'

import {VisualEditing} from '@sanity/visual-editing/react'
import type {HistoryAdapterNavigate} from '@sanity/visual-editing/react'
import {useRouter, usePathname} from 'next/navigation'
import {useEffect, useRef} from 'react'

// Brücke zwischen Sanity Presentation und dem Reader.
// - Comlink-Verbindung zum Presentation-Tool (löst „Unable to connect").
// - History-Adapter: meldet Reader-Navigation (z. B. Kiosk → /artikel/<slug> via
//   Carousel) an Presentation, damit dessen URL-Leiste + „Documents on this page"
//   mitziehen; umgekehrt navigiert eine Presentation-Aktion den Reader.
// - refresh: Reader ist `force-dynamic` + `perspective:'drafts'`, daher holt
//   `router.refresh()` bei Studio-Änderungen den frischen Draft-Stand nach.
// Wird nur mit gesetztem Preview-Flag gerendert (Gating im Layout) → die öffentliche
// Demo bündelt diesen Code nicht.
export function VisualEditingBridge() {
  const router = useRouter()
  const pathname = usePathname()
  const navigateRef = useRef<HistoryAdapterNavigate | undefined>(undefined)

  // Reader-URL-Wechsel an Presentation melden (sobald die Brücke verbunden ist).
  useEffect(() => {
    navigateRef.current?.({type: 'push', url: pathname})
  }, [pathname])

  return (
    <VisualEditing
      portal
      refresh={() => {
        router.refresh()
        return new Promise<void>((resolve) => setTimeout(resolve, 1000))
      }}
      history={{
        subscribe: (navigate) => {
          navigateRef.current = navigate
          return () => {
            navigateRef.current = undefined
          }
        },
        update: (update) => {
          switch (update.type) {
            case 'push':
              router.push(update.url)
              break
            case 'replace':
              router.replace(update.url)
              break
            case 'pop':
              router.back()
              break
          }
        },
      }}
    />
  )
}
