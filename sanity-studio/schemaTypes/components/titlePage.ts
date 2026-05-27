import {defineType, defineField} from 'sanity'

// Titelseite des Artikels — beim Editorial bewusst einfach: Hintergrundfoto + Titel-Typo.
export const titlePage = defineType({
  name: 'titlePage',
  title: 'Titelseite',
  type: 'object',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow / Kategorie',
      type: 'localeString',
      description: 'Kleiner Text über dem Titel, z. B. „EDITORIAL"',
    }),
    defineField({name: 'title', title: 'Titel', type: 'localeString'}),
    defineField({name: 'subtitle', title: 'Untertitel', type: 'localeString'}),
    defineField({
      name: 'backgroundImage',
      title: 'Hintergrundfoto',
      type: 'image',
      options: {hotspot: true},
    }),
  ],
  preview: {
    select: {title: 'title.de', media: 'backgroundImage'},
    prepare({title, media}) {
      return {title: title || 'Titelseite', subtitle: 'Titelseite', media}
    },
  },
})
