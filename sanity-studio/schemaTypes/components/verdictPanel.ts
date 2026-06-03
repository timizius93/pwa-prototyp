import {defineType, defineField} from 'sanity'

// Test-Abschluss: Fazit-Text + Tops + Flops, gelegt als Overlay über ein großformatiges Foto.
// Bewusst EINE kombinierte Komponente (nicht drei) — im Heft tritt das immer zusammen auf.
export const verdictPanel = defineType({
  name: 'verdictPanel',
  title: 'Fazit + Tops/Flops',
  type: 'object',
  fields: [
    defineField({
      name: 'headline',
      title: 'Überschrift',
      type: 'localeString',
      description: 'Optional — sonst „Fazit"',
    }),
    defineField({
      name: 'verdict',
      title: 'Fazit',
      type: 'localeText',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'tops',
      title: 'Tops',
      type: 'array',
      of: [{type: 'localeString'}],
    }),
    defineField({
      name: 'flops',
      title: 'Flops',
      type: 'array',
      of: [{type: 'localeString'}],
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Hintergrundfoto (Closing-Shot)',
      type: 'image',
      options: {hotspot: true},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'overlayStyle',
      title: 'Overlay-Stil (Lesbarkeit je nach Foto-Helligkeit)',
      type: 'string',
      options: {
        list: [
          {title: 'Dunkel', value: 'dark'},
          {title: 'Hell', value: 'light'},
          {title: 'Verlauf', value: 'gradient'},
        ],
        layout: 'radio',
      },
      initialValue: 'gradient',
    }),
  ],
  preview: {
    select: {verdict: 'verdict.de', media: 'backgroundImage', tops: 'tops'},
    prepare({verdict, media, tops}) {
      const count = Array.isArray(tops) ? tops.length : 0
      return {title: 'Fazit + Tops/Flops', subtitle: `${count} Tops · ${verdict?.slice(0, 40) ?? ''}…`, media}
    },
  },
})
