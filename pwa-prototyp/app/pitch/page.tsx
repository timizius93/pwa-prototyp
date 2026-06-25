import {PitchIntro} from '@/components/PitchIntro'

// Pitch-Intro: cinematischer Einstieg für die Präsentation, der nahtlos in den Live-Kiosk (/) übergeht.
// Eigene Route, kein Reader-Chrome — bewusst self-contained (lokale Assets) für Offline-Robustheit im Termin.
export const metadata = {title: '41 Publishing — Pitch'}

export default function PitchPage() {
  return <PitchIntro />
}
