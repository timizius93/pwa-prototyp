import type {StructureResolver} from 'sanity/structure'

// Browsing-Hierarchie der „Content"-Spalte: Magazin → Ausgabe → (bearbeiten | Artikel |
// Anzeigen). Spiegelt den realen Redaktions-Workflow und skaliert auf viele Ausgaben/
// Artikel, statt alles in einen flachen Topf zu kippen. Magazin- und Ausgaben-Dokumente
// werden über die jeweilige „› … bearbeiten"-Zeile editiert — keine doppelten Flachlisten.
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Inhalt')
    .items([
      // ── Magazin → Ausgabe → Inhalte ──────────────────────────────────────────
      S.listItem()
        .id('browse-by-magazine')
        .title('Magazine')
        .child(
          S.documentTypeList('magazine')
            .title('Magazine')
            // Klick auf ein Magazin → bearbeiten | seine Ausgaben
            .child((magazineId) =>
              S.list()
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
                        // Klick auf eine Ausgabe → bearbeiten | Artikel | Anzeigen
                        .child((issueId) =>
                          S.list()
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
                                    .filter(
                                      '_type in ["article","articleEditorial"] && issue._ref == $issueId',
                                    )
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
                            ]),
                        ),
                    ),
                ]),
            ),
        ),

      S.divider(),

      // ── Personen (querschnittlich, gehören zu keiner einzelnen Ausgabe) ───────
      S.documentTypeListItem('person').title('Personen'),
    ])
