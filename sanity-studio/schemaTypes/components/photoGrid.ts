import {defineType, defineField} from 'sanity'

// Mehrere Bilder nebeneinander in einem Grid (2er / 3er / 4er).
export const photoGrid = defineType({
  name: 'photoGrid',
  title: 'Foto-Grid',
  type: 'object',
  fields: [
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          {title: '2 nebeneinander', value: '2_horizontal'},
          {title: '2 übereinander', value: '2_vertical'},
          {title: '3 nebeneinander', value: '3_horizontal'},
          {title: '4er-Raster', value: '4_grid'},
        ],
      },
      initialValue: '2_horizontal',
    }),
    defineField({
      name: 'images',
      title: 'Bilder',
      type: 'array',
      // Bild + optionale Unterschrift pro Kachel. Mehrere Dateien lassen sich weiterhin in einem
      // Rutsch reinziehen (ein Drop = mehrere Items); die Caption bleibt leer, wenn nicht gebraucht
      // (z. B. im Editorial). Bestehende Grids ohne Caption bleiben gültig.
      of: [
        {
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({name: 'caption', title: 'Bildunterschrift', type: 'localeString'}),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {layout: 'layout', images: 'images'},
    prepare({layout, images}) {
      const count = Array.isArray(images) ? images.length : 0
      return {title: 'Foto-Grid', subtitle: `${count} Bilder · ${layout ?? ''}`}
    },
  },
})
