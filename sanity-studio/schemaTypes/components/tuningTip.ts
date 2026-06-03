import {defineType, defineField} from 'sanity'

// Hervorgehobener Einzeiler-Tipp (z. B. „Dropper mit mehr Hub verbauen").
export const tuningTip = defineType({
  name: 'tuningTip',
  title: 'Tuning-Tipp',
  type: 'object',
  fields: [
    defineField({
      name: 'tip',
      title: 'Tipp',
      type: 'localeString',
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: {tip: 'tip.de'},
    prepare({tip}) {
      return {title: 'Tuning-Tipp', subtitle: tip}
    },
  },
})
