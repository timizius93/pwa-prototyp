'use client'

import {useTransition} from 'react'
import {useRouter} from 'next/navigation'
import type {Lang} from '@/lib/sanity'

// DE|EN-Umschalter. Persistiert die Wahl im `lang`-Cookie und lädt die Server-Daten
// per router.refresh() neu (Reader-Pages sind force-dynamic + lesen den Cookie).
// `variant`: 'bar' = solider Pill für den Kiosk-Header, 'overlay' = für die Topbar
// über Cover-Heros/Anzeigen (heller, transparenter Hintergrund).
export function LangToggle({lang, variant = 'bar'}: {lang: Lang; variant?: 'bar' | 'overlay'}) {
  const router = useRouter()
  const [pending, start] = useTransition()

  const pick = (l: Lang) => {
    if (l === lang) return
    document.cookie = `lang=${l};path=/;max-age=31536000;samesite=lax`
    start(() => router.refresh())
  }

  return (
    <div
      className={`langtoggle langtoggle--${variant}${pending ? ' is-pending' : ''}`}
      role="group"
      aria-label="Sprache / Language"
    >
      {(['de', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          className={`langtoggle-opt${l === lang ? ' is-active' : ''}`}
          aria-pressed={l === lang}
          onClick={() => pick(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
