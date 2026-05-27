import {defineType, defineField} from 'sanity'
import {supportedLanguages} from './localeString'

// Mehrzeiliger Text in DE + EN (z. B. Lead-Absatz, Signatur).
export const localeText = defineType({
  name: 'localeText',
  title: 'Textblock (DE/EN)',
  type: 'object',
  fieldsets: [
    {name: 'translations', title: 'Übersetzungen', options: {collapsible: true, collapsed: false}},
  ],
  fields: supportedLanguages.map((lang) =>
    defineField({
      name: lang.id,
      title: lang.title,
      type: 'text',
      rows: 3,
      fieldset: lang.isDefault ? undefined : 'translations',
    }),
  ),
})
