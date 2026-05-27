import {defineType, defineField} from 'sanity'

// Eines der vier Magazine (ENDURO, E-MOUNTAINBIKE, GRAN FONDO, DOWNTOWN).
export const magazine = defineType({
  name: 'magazine',
  title: 'Magazin',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name'},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'primaryColor',
      title: 'Akzentfarbe',
      type: 'string',
      description: 'Hex-Wert, z. B. #00A8E8 (Branding-Akzent für die PWA)',
    }),
    defineField({name: 'logo', title: 'Logo', type: 'image'}),
    defineField({
      name: 'domain',
      title: 'Domain',
      type: 'string',
      description: 'z. B. mag.ebike-mtb.com',
    }),
  ],
})
