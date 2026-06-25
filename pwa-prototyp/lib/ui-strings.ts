import type {Lang} from './sanity'

// Wenige UI-Chrome-Strings, die der Sprachumschalter mitziehen soll. Inhalte selbst
// kommen lokalisiert aus Sanity (siehe lib/sanity.ts) — hier nur das Reader-Gerüst.
const STRINGS = {
  de: {
    ad: 'Anzeige',
    backToKiosk: 'Zurück zum Kiosk',
    articlesInIssue: (n: number) => `${n} Artikel in dieser Ausgabe`,
    overview: 'Übersicht',
    prevItem: 'Vorheriger Beitrag',
    nextItem: 'Nächster Beitrag',
  },
  en: {
    ad: 'Ad',
    backToKiosk: 'Back to kiosk',
    articlesInIssue: (n: number) => `${n} ${n === 1 ? 'article' : 'articles'} in this issue`,
    overview: 'Overview',
    prevItem: 'Previous item',
    nextItem: 'Next item',
  },
} as const

export function ui(lang: Lang) {
  return STRINGS[lang] ?? STRINGS.de
}
