import {defineType, defineField} from 'sanity'

// Großes, optisch hervorgehobenes Zitat.
export const pullQuote = defineType({
  name: 'pullQuote',
  title: 'Zitat (hervorgehoben)',
  type: 'object',
  fields: [
    defineField({
      name: 'text',
      title: 'Zitat',
      type: 'localeText',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'attribution',
      title: 'Quelle',
      type: 'string',
      description: 'Wer hat es gesagt (optional)',
    }),
  ],
  preview: {
    select: {text: 'text.de', attribution: 'attribution'},
    prepare({text, attribution}) {
      return {title: text ? `„${text}"` : 'Zitat', subtitle: attribution}
    },
  },
})
