import type {ComponentType} from 'react'
import SpecializedLevo4 from './SpecializedLevo4'

// Mapping `componentId` (aus Sanity) → React-Komponente. Bewusst NICHT lazy-loaded:
// im Carousel werden alle Panels gleichzeitig gemountet, lazy + Suspense hat auf iOS
// Safari zu unmount/remount-Zyklen geführt (Reveal-Animation wurde wiederholt zurückgesetzt).
// Bundle-Größe pro Modul ist klein genug, dass static import OK ist.
//
// Neue Custom-Anzeige hinzufügen:
//   1. Komponente unter `components/ads/<id>.tsx` anlegen (default export)
//   2. Hier registrieren
//   3. Im Studio in der Anzeige `componentId` setzen
export const AD_REGISTRY: Record<string, ComponentType> = {
  'specialized-levo-4': SpecializedLevo4,
}

// Vorschaubild (Poster) je Custom-Ad — Custom-Module haben keine Sanity-`images[]`, deshalb
// braucht die Kiosk-/Übersicht-Kachel hier ein statisches Bild aus /public.
export const AD_POSTERS: Record<string, string> = {
  'specialized-levo-4': '/ads/specialized-levo-4/hero.jpg',
}
