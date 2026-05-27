import {defineType, defineField} from 'sanity'

// Generischer Artikel (Test, Reportage, News, Inspiration …) — nutzt dieselben Body-Bausteine
// wie das Editorial. Bewusst schlank gehalten; spezialisierte Typen (Einzeltest mit Specs/Geometrie,
// Vergleichstest) kommen als eigener Schritt.
export const article = defineType({
  name: 'article',
  title: 'Artikel',
  type: 'document',
  groups: [
    {name: 'content', title: 'Inhalt', default: true},
    {name: 'meta', title: 'Meta & Veröffentlichung'},
  ],
  fields: [
    defineField({
      name: 'title_mag',
      title: 'Titel (Heft / PWA)',
      type: 'localeString',
      group: 'content',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'category',
      title: 'Kategorie',
      type: 'string',
      options: {
        list: ['Test', 'Vergleichstest', 'Reportage', 'News', 'Know How', 'Inspiration', 'Special'],
      },
      group: 'content',
    }),
    defineField({
      name: 'author',
      title: 'Autor',
      type: 'reference',
      to: [{type: 'person'}],
      group: 'content',
    }),
    defineField({
      name: 'heroImage',
      title: 'Titelbild (Kiosk-Vorschau)',
      type: 'image',
      options: {hotspot: true},
      description: 'Wird im Inhaltsverzeichnis / Kiosk als Vorschaubild gezeigt.',
      group: 'content',
    }),
    defineField({
      name: 'body',
      title: 'Inhalt (Bausteine)',
      type: 'array',
      group: 'content',
      of: [
        {type: 'titlePage'},
        {type: 'articleText'},
        {type: 'fullbleedPhoto'},
        {type: 'photoGrid'},
        {type: 'pullQuote'},
      ],
    }),
    defineField({
      name: 'magazine',
      title: 'Magazin',
      type: 'reference',
      to: [{type: 'magazine'}],
      group: 'meta',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'issue',
      title: 'Ausgabe',
      type: 'reference',
      to: [{type: 'issue'}],
      group: 'meta',
    }),
    defineField({
      name: 'slug',
      title: 'Artikel-URL (Slug)',
      type: 'slug',
      options: {source: (doc: {title_mag?: {de?: string}}) => doc.title_mag?.de},
      group: 'meta',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Entwurf', value: 'draft'},
          {title: 'In Review', value: 'in_review'},
          {title: 'Final', value: 'final'},
          {title: 'Veröffentlicht', value: 'published'},
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
      group: 'meta',
    }),
  ],
  preview: {
    select: {title: 'title_mag.de', category: 'category', media: 'heroImage'},
    prepare({title, category, media}) {
      return {title: title || 'Artikel', subtitle: category, media}
    },
  },
})
