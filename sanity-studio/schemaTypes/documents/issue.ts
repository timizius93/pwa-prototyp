import {defineType, defineField} from 'sanity'

// Eine Heft-Ausgabe eines Magazins (z. B. E-MTB #042).
export const issue = defineType({
  name: 'issue',
  title: 'Ausgabe',
  type: 'document',
  fields: [
    defineField({
      name: 'magazine',
      title: 'Magazin',
      type: 'reference',
      to: [{type: 'magazine'}],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'number',
      title: 'Ausgaben-Nummer',
      type: 'number',
      validation: (r) => r.required(),
    }),
    defineField({name: 'title', title: 'Ausgaben-Titel', type: 'localeString'}),
    defineField({
      name: 'coverImage',
      title: 'Cover-Hintergrundfoto',
      description:
        'Nur das Hintergrundfoto (OHNE eingebrannten Text/Logo) — Logo, Ausgabe und Titel legt der Kiosk im Code darüber. Der Hotspot steuert den Bildausschnitt.',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({name: 'publishDate', title: 'Erscheinungsdatum', type: 'date'}),
  ],
  preview: {
    select: {number: 'number', mag: 'magazine.name', title: 'title.de', media: 'coverImage'},
    prepare({number, mag, title, media}) {
      return {
        title: `${mag ?? 'Magazin'} #${number ?? '?'}`,
        subtitle: title,
        media,
      }
    },
  },
})
