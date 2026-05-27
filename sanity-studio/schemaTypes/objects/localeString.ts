import {defineType, defineField} from 'sanity'

// Unterstützte Sprachen — Spanisch lässt sich später ergänzen, ohne das Schema umzubauen.
export const supportedLanguages = [
  {id: 'de', title: 'Deutsch', isDefault: true},
  {id: 'en', title: 'English'},
]

// Einzeiliger Text in DE + EN nebeneinander (field-level i18n).
export const localeString = defineType({
  name: 'localeString',
  title: 'Text (DE/EN)',
  type: 'object',
  fieldsets: [
    {name: 'translations', title: 'Übersetzungen', options: {collapsible: true, collapsed: false}},
  ],
  fields: supportedLanguages.map((lang) =>
    defineField({
      name: lang.id,
      title: lang.title,
      type: 'string',
      fieldset: lang.isDefault ? undefined : 'translations',
    }),
  ),
})
