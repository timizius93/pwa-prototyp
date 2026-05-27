import {defineType, defineField} from 'sanity'

// Standard-Fließtextblock mit Zwischenüberschriften, Listen, Zitaten (DE/EN).
export const articleText = defineType({
  name: 'articleText',
  title: 'Fließtext',
  type: 'object',
  fields: [
    defineField({name: 'content', title: 'Inhalt', type: 'localeBlockContent'}),
  ],
  preview: {
    select: {blocks: 'content.de'},
    prepare({blocks}) {
      const first = Array.isArray(blocks)
        ? blocks.find((b: {_type?: string}) => b._type === 'block')
        : undefined
      const text = first?.children
        ?.map((c: {text?: string}) => c.text)
        .join('')
      return {title: 'Fließtext', subtitle: text || '(leer)'}
    },
  },
})
