import {defineType, defineField} from 'sanity'

// Editorial — persönliche Einleitung des Heft-Gründers (z. B. „Run, Forrest, run!").
// Der einfachste der drei Pilot-Artikel: Header + freier Body aus Bausteinen + Signatur.
export const articleEditorial = defineType({
  name: 'articleEditorial',
  title: 'Editorial',
  type: 'document',
  groups: [
    {name: 'content', title: 'Inhalt', default: true},
    {name: 'meta', title: 'Meta & Veröffentlichung'},
  ],
  fields: [
    // --- Inhalt ---
    defineField({
      name: 'title_mag',
      title: 'Titel (Heft / PWA)',
      type: 'localeString',
      group: 'content',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'author',
      title: 'Autor',
      type: 'reference',
      to: [{type: 'person'}],
      group: 'content',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'body',
      title: 'Inhalt (Bausteine)',
      description: 'Die Seite wird aus diesen Bausteinen in dieser Reihenfolge zusammengesetzt.',
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
      name: 'signature',
      title: 'Signatur',
      type: 'localeText',
      description: 'z. B. „Cheers, Robin Schmitt — Gründer E-MOUNTAINBIKE"',
      group: 'content',
    }),

    // --- Meta & Veröffentlichung ---
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
      name: 'position',
      title: 'Position in der Ausgabe',
      type: 'number',
      group: 'meta',
      description:
        'Reihenfolge im Reader-Carousel (kleiner = früher). Teilt sich den Werteraum ' +
        'mit den Anzeigen derselben Ausgabe.',
    }),
    defineField({
      name: 'category',
      title: 'Kategorie',
      type: 'string',
      initialValue: 'Editorial',
      group: 'meta',
    }),
    defineField({
      name: 'title_web',
      title: 'Titel (SEO / Web)',
      type: 'localeString',
      description: 'Längerer SEO-Titel — wird in der PWA NICHT angezeigt, nur perspektivisch für WordPress mitgeführt.',
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
      name: 'photographers',
      title: 'Fotografen',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'person'}]}],
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
    defineField({
      name: 'availableLanguages',
      title: 'Verfügbare Sprachen',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Deutsch', value: 'de'},
          {title: 'English', value: 'en'},
        ],
      },
      initialValue: ['de', 'en'],
      group: 'meta',
    }),
  ],
  preview: {
    select: {title: 'title_mag.de', author: 'author.name', mag: 'magazine.name'},
    prepare({title, author, mag}) {
      return {
        title: title || 'Editorial (ohne Titel)',
        subtitle: [mag, author].filter(Boolean).join(' · '),
      }
    },
  },
})
