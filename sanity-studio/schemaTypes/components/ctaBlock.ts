import {defineType, defineField} from 'sanity'

// Call-to-Action am Ende eines Tests, z. B. „Mehr Infos unter nicolai-bicycles.com".
export const ctaBlock = defineType({
  name: 'ctaBlock',
  title: 'Call-to-Action',
  type: 'object',
  fields: [
    defineField({name: 'headline', title: 'Überschrift', type: 'localeString'}),
    defineField({
      name: 'buttonLabel',
      title: 'Button-Text',
      type: 'localeString',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'targetUrl',
      title: 'Ziel-URL',
      type: 'url',
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: {label: 'buttonLabel.de', url: 'targetUrl'},
    prepare({label, url}) {
      return {title: 'Call-to-Action', subtitle: label || url}
    },
  },
})
