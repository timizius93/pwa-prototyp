import {defineType, defineField} from 'sanity'

// Hervorhebung — deckt zwei wiederkehrende Print-Muster mit EINEM Baustein ab:
//   • Box: gerahmter, zentrierter Kasten mit Überschrift + Fließtext/Aufzählung
//     (z. B. „REALITÄTSCHECK: Was euer Bike können sollte").
//   • Nummeriert: Sektionen mit grünen Kreis-Ziffern 1 / 2 / 3 + Titel + Inhalt
//     (z. B. „1 Effiziente Full-Power-Konzepte …").
// Der Body ist Portable Text (localeBlockContent) → Fett/Listen/Zentrierung kommen aus
// dem gewohnten Editor, kein Spezial-Markup nötig.
export const highlightBlock = defineType({
  name: 'highlightBlock',
  title: 'Hervorhebung (Box / nummerierte Sektionen)',
  type: 'object',
  fields: [
    defineField({
      name: 'variant',
      title: 'Form',
      type: 'string',
      options: {
        list: [
          {title: 'Box (gerahmt, zentriert)', value: 'box'},
          {title: 'Nummerierte Sektionen', value: 'numbered'},
        ],
        layout: 'radio',
      },
      initialValue: 'box',
    }),
    defineField({
      name: 'heading',
      title: 'Überschrift',
      description: 'Box: Titel im Kasten. Nummeriert: optionale Überschrift über den Sektionen.',
      type: 'localeString',
    }),
    defineField({
      name: 'body',
      title: 'Inhalt',
      description:
        'Box: der gesamte Kasten-Inhalt (Einleitung, Aufzählung, Schlusssatz). ' +
        'Nummeriert: optionale Einleitung über den Sektionen.',
      type: 'localeBlockContent',
    }),
    defineField({
      name: 'items',
      title: 'Nummerierte Sektionen',
      description: 'Nur für Form „Nummerierte Sektionen". Jede Sektion bekommt automatisch ihre Nummer.',
      type: 'array',
      hidden: ({parent}) => parent?.variant !== 'numbered',
      of: [
        defineField({
          name: 'section',
          title: 'Sektion',
          type: 'object',
          fields: [
            defineField({name: 'title', title: 'Titel', type: 'localeString'}),
            defineField({name: 'body', title: 'Inhalt', type: 'localeBlockContent'}),
          ],
          preview: {
            select: {title: 'title.de'},
            prepare({title}) {
              return {title: title || '(Sektion ohne Titel)'}
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {variant: 'variant', heading: 'heading.de', items: 'items'},
    prepare({variant, heading, items}) {
      const v = variant === 'numbered' ? `Nummeriert · ${Array.isArray(items) ? items.length : 0} Sektionen` : 'Box'
      return {title: heading || 'Hervorhebung', subtitle: v}
    },
  },
})
