import {defineType, defineField} from 'sanity'

// Reihe von Tester-Porträts mit Mini-Bio. Zieht Name/Rolle/Bio/Porträt aus den `person`-Docs —
// derselbe Tester (Bene, Lars, Peter …) wird EINMAL gepflegt und in jedem Vergleichstest
// referenziert. Genau hier zahlt sich die person-Entität aus (i18n-/Daten-Argument).
export const testerCarousel = defineType({
  name: 'testerCarousel',
  title: 'Tester-Porträts',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'localeString',
      description: 'Optional, z. B. „Das Test-Team".',
    }),
    defineField({
      name: 'testers',
      title: 'Tester',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'person'}]}],
      validation: (r) => r.required().min(1),
    }),
  ],
  preview: {
    select: {title: 'title.de', testers: 'testers'},
    prepare({title, testers}) {
      const n = Array.isArray(testers) ? testers.length : 0
      return {title: title || 'Tester-Porträts', subtitle: `${n} Tester`}
    },
  },
})
