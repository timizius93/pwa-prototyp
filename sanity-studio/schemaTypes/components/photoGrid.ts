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
      // Reine Bild-Liste: ermöglicht das Reinziehen mehrerer Dateien auf einmal (ein Drop = mehrere Items).
      // Per-Bild-Unterschrift/Fotograf bewusst weggelassen (im Editorial nicht gebraucht).
      // Falls ein späterer Artikel Captions pro Grid-Bild braucht, hier als Objekt-Variante wieder einführbar.
      of: [{type: 'image', options: {hotspot: true}}],
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
