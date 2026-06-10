import {defineType, defineField} from 'sanity'

// Auszeichnung im Vergleichstest — „Best in Test", „Best Buy", „Editor's Choice".
// Pro Award: Sieger-Foto + Sieger-Name + Verdict. Das Award-Label rendert der Reader
// typografisch (kein Siegel-Bild nötig); ein optionales `badge` überlagert das echte
// Verlags-Siegel (z. B. das Test-Sieger-Siegel) auf dem Foto.
const AWARD_TYPES = [
  {title: 'Best in Test', value: 'best_in_test'},
  {title: 'Best Buy', value: 'best_buy'},
  {title: "Editor's Choice", value: 'editors_choice'},
  {title: 'Eigenes Label', value: 'custom'},
]

export const awardBox = defineType({
  name: 'awardBox',
  title: 'Auszeichnung (Vergleichstest)',
  type: 'object',
  fields: [
    defineField({
      name: 'awardType',
      title: 'Auszeichnung',
      type: 'string',
      options: {list: AWARD_TYPES, layout: 'radio'},
      initialValue: 'best_in_test',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'customLabel',
      title: 'Eigenes Label',
      type: 'localeString',
      hidden: ({parent}) => parent?.awardType !== 'custom',
      description: 'Nur bei „Eigenes Label" — sonst kommt das Label aus der Auszeichnung.',
    }),
    defineField({
      name: 'winnerName',
      title: 'Sieger',
      type: 'string',
      description: 'z. B. „Avinox M1"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'winnerImage',
      title: 'Sieger-Foto',
      type: 'image',
      options: {hotspot: true},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'badge',
      title: 'Verlags-Siegel (optional)',
      type: 'image',
      description: 'Optionales echtes Award-Siegel (PNG mit Transparenz) — wird auf das Foto gelegt.',
    }),
    defineField({
      name: 'verdict',
      title: 'Begründung / Fazit',
      type: 'localeText',
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: {awardType: 'awardType', winner: 'winnerName', media: 'winnerImage', custom: 'customLabel.de'},
    prepare({awardType, winner, media, custom}) {
      const label = awardType === 'custom' ? custom || 'Auszeichnung' : AWARD_TYPES.find((a) => a.value === awardType)?.title
      return {title: `🏆 ${label}`, subtitle: winner, media}
    },
  },
})
