import type {StructureBuilder, StructureResolver} from 'sanity/structure'

// Browsing-Hierarchie der „Content"-Spalte: Magazin → Ausgabe → (bearbeiten | Artikel |
// Anzeigen). Die Magazine liegen direkt unter „Inhalt" (keine „Magazine"-Zwischenebene) und
// werden datengetrieben geladen — neue Magazine erscheinen automatisch, sobald ihr Dokument
// existiert. Magazin-/Ausgaben-Dokumente werden über die jeweilige „› … bearbeiten"-Zeile
// editiert; Personen liegen quer darunter (gehören zu keiner einzelnen Ausgabe).

// Eine Ausgabe → bearbeiten | Artikel | Anzeigen dieser Ausgabe
function issueChild(S: StructureBuilder, issueId: string) {
  return S.list()
    .title('Ausgabe')
    .items([
      S.listItem()
        .id('edit-issue')
        .title('› Ausgabe bearbeiten')
        .child(S.document().schemaType('issue').documentId(issueId)),
      S.divider(),
      S.listItem()
        .id('issue-articles')
        .title('Artikel')
        .child(
          S.documentList()
            .title('Artikel')
            .filter('_type in ["article","articleEditorial"] && issue._ref == $issueId')
            .params({issueId})
            .defaultOrdering([{field: 'position', direction: 'asc'}]),
        ),
      S.listItem()
        .id('issue-ads')
        .title('Anzeigen')
        .child(
          S.documentList()
            .title('Anzeigen')
            .schemaType('advertisement')
            .filter('_type == "advertisement" && issue._ref == $issueId')
            .params({issueId})
            .defaultOrdering([{field: 'position', direction: 'asc'}]),
        ),
    ])
}

// Ein Magazin → bearbeiten | seine Ausgaben (neueste zuerst)
function magazineChild(S: StructureBuilder, magazineId: string) {
  return S.list()
    .title('Magazin')
    .items([
      S.listItem()
        .id('edit-magazine')
        .title('› Magazin bearbeiten')
        .child(S.document().schemaType('magazine').documentId(magazineId)),
      S.divider(),
      S.listItem()
        .id('magazine-issues')
        .title('Ausgaben')
        .child(
          S.documentList()
            .title('Ausgaben')
            .schemaType('issue')
            .filter('_type == "issue" && magazine._ref == $magazineId')
            .params({magazineId})
            .defaultOrdering([{field: 'number', direction: 'desc'}])
            .child((issueId) => issueChild(S, issueId)),
        ),
    ])
}

export const structure: StructureResolver = async (S, context) => {
  const client = context.getClient({apiVersion: '2025-08-15'})
  // Kann je Magazin BEIDE Versionen liefern (published + drafts.<id>) → auf die nackte
  // ID deduplizieren, sonst erscheint dasselbe Magazin doppelt in der Liste.
  const raw: {_id: string; name: string}[] = await client.fetch(
    '*[_type == "magazine"] | order(name asc){_id, name}',
  )
  const seen = new Set<string>()
  const magazines = raw
    .map((m) => ({_id: m._id.replace(/^drafts\./, ''), name: m.name}))
    .filter((m) => (seen.has(m._id) ? false : seen.add(m._id)))

  return S.list()
    .title('Inhalt')
    .items([
      // Magazine direkt auf oberster Ebene (datengetrieben)
      ...magazines.map((m) =>
        S.listItem()
          .id(m._id)
          .title(m.name)
          .child(magazineChild(S, m._id)),
      ),
      S.divider(),
      // Personen (querschnittlich, gehören zu keiner einzelnen Ausgabe)
      S.documentTypeListItem('person').title('Personen'),
    ])
}
