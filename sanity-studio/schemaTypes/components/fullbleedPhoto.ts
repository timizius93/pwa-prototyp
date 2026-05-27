import {defineType, defineField} from 'sanity'

// Ein vollformatiges Foto über die ganze Breite, optional mit Scroll-Effekt.
export const fullbleedPhoto = defineType({
  name: 'fullbleedPhoto',
  title: 'Großes Foto (vollformatig)',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Foto',
      type: 'image',
      options: {hotspot: true},
      validation: (r) => r.required(),
    }),
    defineField({name: 'caption', title: 'Bildunterschrift', type: 'localeString'}),
    defineField({
      name: 'credit',
      title: 'Fotograf',
      type: 'reference',
      to: [{type: 'person'}],
    }),
    defineField({
      name: 'scrollEffect',
      title: 'Scroll-Effekt',
      type: 'string',
      options: {
        list: [
          {title: 'Keiner', value: 'none'},
          {title: 'Parallax', value: 'parallax'},
          {title: 'Zoom', value: 'scale'},
          {title: 'Ken Burns', value: 'kenBurns'},
        ],
        layout: 'radio',
      },
      initialValue: 'none',
    }),
  ],
  preview: {
    select: {media: 'image', caption: 'caption.de'},
    prepare({media, caption}) {
      return {title: 'Großes Foto', subtitle: caption, media}
    },
  },
})
