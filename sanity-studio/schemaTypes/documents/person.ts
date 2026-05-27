import {defineType, defineField} from 'sanity'

// Eine Person, die mehrfach auftaucht (Autor, Fotograf, Lektor, Übersetzer, Tester).
export const person = defineType({
  name: 'person',
  title: 'Person',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'roleDefault',
      title: 'Standard-Rolle',
      type: 'string',
      description: 'z. B. Autor, Fotograf, Tester',
    }),
    defineField({name: 'bio', title: 'Mini-Biografie', type: 'localeText'}),
    defineField({name: 'portrait', title: 'Porträt', type: 'image', options: {hotspot: true}}),
  ],
  preview: {
    select: {title: 'name', subtitle: 'roleDefault', media: 'portrait'},
  },
})
