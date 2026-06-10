import {defineType, defineField} from 'sanity'

// Generische Vergleichstabelle für Vergleichstests (Spec-Tabelle, Herkunfts-Tabelle …).
// Bewusst FREI modelliert (Spalten + Zeilen eingetippt) statt relational mit Produkt-Referenzen —
// deckt damit jede Tabelle in jedem Magazin ab, auch nicht-spec-artige (z. B. Herkunfts-Länder).
// Konventionen für den Reader:
//   • Die ERSTE Spalte ist die Subjekt-Spalte (Produktname). Auf dem Smartphone wird sie zur
//     Karten-Überschrift, auf dem Desktop bleibt sie als linke Spalte stehen.
//   • Spalten mit „numerisch" werden rechtsbündig gesetzt und beim Sortieren als Zahl behandelt.
//   • Jede Spalte ist im Reader per Klick auf die Überschrift sortierbar (das „Killer-Feature",
//     das im Print/InDesign unmöglich ist).
export const comparisonTable = defineType({
  name: 'comparisonTable',
  title: 'Vergleichstabelle',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'localeString',
      description: 'Optional — Überschrift über der Tabelle.',
    }),
    defineField({
      name: 'columns',
      title: 'Spalten',
      type: 'array',
      description:
        'Die erste Spalte ist der Produktname (wird auf dem Smartphone zur Karten-Überschrift). ' +
        'Reihenfolge der Spalten = Reihenfolge der Zellen pro Zeile.',
      of: [
        defineField({
          name: 'column',
          title: 'Spalte',
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Überschrift',
              type: 'localeString',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'unit',
              title: 'Einheit',
              type: 'string',
              description: 'Optional, z. B. „Nm", „kg", „Wh" — klein an die Überschrift gehängt.',
            }),
            defineField({
              name: 'numeric',
              title: 'Numerisch (rechtsbündig + als Zahl sortieren)',
              type: 'boolean',
              initialValue: false,
            }),
          ],
          preview: {
            select: {label: 'label.de', unit: 'unit', numeric: 'numeric'},
            prepare({label, unit, numeric}) {
              return {
                title: [label, unit && `[${unit}]`].filter(Boolean).join(' ') || 'Spalte',
                subtitle: numeric ? '123 · numerisch' : 'Text',
              }
            },
          },
        }),
      ],
      validation: (r) => r.required().min(2),
    }),
    defineField({
      name: 'rows',
      title: 'Zeilen',
      type: 'array',
      of: [
        defineField({
          name: 'row',
          title: 'Zeile',
          type: 'object',
          fields: [
            defineField({
              name: 'cells',
              title: 'Zellen (in Spalten-Reihenfolge)',
              type: 'array',
              of: [{type: 'localeString'}],
            }),
          ],
          preview: {
            select: {cells: 'cells'},
            prepare({cells}) {
              const arr = Array.isArray(cells) ? cells : []
              return {
                title: arr[0]?.de || 'Zeile',
                subtitle: arr
                  .slice(1)
                  .map((c: {de?: string}) => c?.de)
                  .filter(Boolean)
                  .join(' · '),
              }
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'notes',
      title: 'Fußnoten',
      type: 'localeText',
      description: 'Optional — Erläuterungen / Sternchen-Hinweise unter der Tabelle.',
    }),
  ],
  preview: {
    select: {title: 'title.de', rows: 'rows', cols: 'columns'},
    prepare({title, rows, cols}) {
      const r = Array.isArray(rows) ? rows.length : 0
      const c = Array.isArray(cols) ? cols.length : 0
      return {title: title || 'Vergleichstabelle', subtitle: `${r} Zeilen × ${c} Spalten`}
    },
  },
})
