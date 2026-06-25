import type {ValidationContext} from 'sanity'

// Mandanten-Sicherung: stellt sicher, dass die gewählte AUSGABE zum selben MAGAZIN
// gehört wie das Dokument (Artikel/Editorial/Anzeige). Ohne diese Prüfung kann ein
// Redakteur eine ENDURO-Ausgabe an einen E-MTB-Artikel hängen — der Reader filtert
// Panels über `issue._ref` + `magazine`, ein Mismatch erzeugt Geister-Panels.
//
// Async-Validator auf dem `issue`-Feld: lädt das referenzierte Issue und vergleicht
// dessen `magazine._ref` mit dem `magazine._ref` des aktuellen Dokuments.
// Leere Felder werden NICHT hier gemeldet (das macht `.required()`), nur echte Mismatches.
export function validateIssueMatchesMagazine() {
  return async (issueRef: {_ref?: string} | undefined, context: ValidationContext) => {
    const doc = context.document as {magazine?: {_ref?: string}} | undefined
    const docMag = doc?.magazine?._ref
    // Ohne Issue oder ohne Magazin gibt es nichts zu vergleichen — required() greift dort.
    if (!issueRef?._ref || !docMag) return true

    const client = context.getClient({apiVersion: '2023-01-01'})
    // Draft- wie Published-ID auflösen (issue._ref zeigt auf die Published-ID).
    const issueMag: string | null = await client.fetch(
      `*[_id==$id][0].magazine._ref`,
      {id: issueRef._ref},
    )
    if (!issueMag) return true // Issue (noch) nicht ladbar → nicht blockieren

    return issueMag === docMag
      ? true
      : 'Diese Ausgabe gehört zu einem anderen Magazin als oben gewählt.'
  }
}
