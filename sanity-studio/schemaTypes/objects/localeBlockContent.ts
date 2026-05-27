import {defineType, defineField} from 'sanity'
import {supportedLanguages} from './localeString'

// Formatierter Fließtext (Portable Text) in DE + EN — H2/H3, Listen, Zitate, Links.
export const localeBlockContent = defineType({
  name: 'localeBlockContent',
  title: 'Fließtext (DE/EN)',
  type: 'object',
  fieldsets: [
    {name: 'translations', title: 'Übersetzungen', options: {collapsible: true, collapsed: false}},
  ],
  fields: supportedLanguages.map((lang) =>
    defineField({
      name: lang.id,
      title: lang.title,
      type: 'array',
      fieldset: lang.isDefault ? undefined : 'translations',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Absatz', value: 'normal'},
            {title: 'Überschrift 2', value: 'h2'},
            {title: 'Überschrift 3', value: 'h3'},
            {title: 'Zitat', value: 'blockquote'},
          ],
          lists: [
            {title: 'Aufzählung', value: 'bullet'},
            {title: 'Nummeriert', value: 'number'},
          ],
          marks: {
            decorators: [
              {title: 'Fett', value: 'strong'},
              {title: 'Kursiv', value: 'em'},
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [{name: 'href', type: 'url', title: 'URL'}],
              },
            ],
          },
        },
      ],
    }),
  ),
})
