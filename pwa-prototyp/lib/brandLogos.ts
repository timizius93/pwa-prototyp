// Offizielle Verlags-Logos (von Tim geliefert, Quelle: pilot-content/Logos/).
// pos = farbig/dunkel für helle Hintergründe, neg = weiß für dunkle Hintergründe/Fotos.
// stacked = Hochformat-Logo (Wappen über Schriftzug) → braucht mehr Höhe als die Wortmarken.
// Key = Magazin-Slug (wie in Sanity bzw. der BRANDS-Liste der Regal-Seite).
export const BRAND_LOGOS: Record<string, {pos: string; neg: string; stacked?: boolean}> = {
  emtb: {pos: '/logos/emtb-pos.png', neg: '/logos/emtb-neg.png'},
  enduro: {pos: '/logos/enduro-pos.png', neg: '/logos/enduro-neg.png'},
  granfondo: {pos: '/logos/granfondo-pos.png', neg: '/logos/granfondo-neg.png', stacked: true},
  downtown: {pos: '/logos/downtown-pos.png', neg: '/logos/downtown-neg.png'},
}
