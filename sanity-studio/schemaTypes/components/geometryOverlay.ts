import {defineType, defineField} from 'sanity'
import {GeometryWizard} from '../../components/GeometryWizard'

const SIZES = ['S', 'M', 'L', 'XL', 'XXL']

// Interaktive Geometrie-Ansicht: Bike-Foto + Maßlinien-/Pfeil-Overlay + Größen-Switcher.
// Pfeile werden visuell auf dem Foto platziert (GeometryArrowPlacer, Reuse vom Hotspot-Muster mit
// zwei Punkten je Pfeil). Die Werte an den Pfeilen kommen aus der Größen-Tabelle und schalten live
// um. Trade-off (ein Foto): die Pfeil-POSITIONEN passen zur fotografierten Größe; bei Größenwechsel
// ändern sich nur die Zahlen → Hinweis „Foto Größe M".
//
// DAS kann Button Publish fundamental nicht (dort: statisches PNG einer Größe).
export const geometryOverlay = defineType({
  name: 'geometryOverlay',
  title: 'Geometrie (interaktiv)',
  type: 'object',
  fields: [
    defineField({
      name: 'bikePhoto',
      title: 'Bike-Foto (Seitenansicht)',
      type: 'image',
      options: {hotspot: true},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'photographedSize',
      title: 'Fotografierte Größe',
      type: 'string',
      description: 'Welche Größe ist auf dem Foto zu sehen (für den Hinweis + Pfeil-Positionen)?',
      options: {list: SIZES, layout: 'radio', direction: 'horizontal'},
      initialValue: 'M',
    }),
    defineField({
      name: 'annotations',
      title: 'Maßlinien / Pfeile',
      type: 'array',
      components: {input: GeometryWizard},
      of: [
        defineField({
          name: 'geoAnnotation',
          title: 'Maßlinie',
          type: 'object',
          fields: [
            defineField({
              name: 'metric',
              title: 'Maß',
              type: 'string',
              options: {
                list: [
                  {title: 'Reach', value: 'reach'},
                  {title: 'Stack', value: 'stack'},
                  {title: 'Radstand', value: 'wheelbase'},
                  {title: 'Kettenstrebe', value: 'chainstay'},
                  {title: 'Oberrohr', value: 'topTube'},
                  {title: 'Steuerrohr', value: 'headTube'},
                  {title: 'Sitzrohr', value: 'seatTube'},
                  {title: 'Lenkwinkel', value: 'headAngle'},
                  {title: 'Sitzwinkel', value: 'seatAngle'},
                  {title: 'Freier Text (z. B. Laufradgröße)', value: 'custom'},
                ],
              },
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'customLabel',
              title: 'Freier Text',
              type: 'string',
              description: 'Nur bei „Freier Text" — z. B. „29\"" oder „27,5\"".',
              hidden: ({parent}) => parent?.metric !== 'custom',
            }),
            // Pfeil-Endpunkte (0–1, relativ zum Foto). Per Placer gesetzt/gezogen.
            defineField({name: 'x1', title: 'Start X', type: 'number', validation: (r) => r.min(0).max(1)}),
            defineField({name: 'y1', title: 'Start Y', type: 'number', validation: (r) => r.min(0).max(1)}),
            defineField({name: 'x2', title: 'Ende X', type: 'number', validation: (r) => r.min(0).max(1)}),
            defineField({name: 'y2', title: 'Ende Y', type: 'number', validation: (r) => r.min(0).max(1)}),
          ],
          preview: {
            select: {metric: 'metric', customLabel: 'customLabel'},
            prepare({metric, customLabel}) {
              const labels: Record<string, string> = {
                reach: 'Reach', stack: 'Stack', wheelbase: 'Radstand', chainstay: 'Kettenstrebe',
                topTube: 'Oberrohr', headTube: 'Steuerrohr', seatTube: 'Sitzrohr',
                headAngle: 'Lenkwinkel', seatAngle: 'Sitzwinkel', custom: customLabel || 'Freier Text',
              }
              return {title: labels[metric] || metric || 'Maßlinie'}
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'measurements',
      title: 'Geometrie-Werte (pro Größe eine Zeile)',
      type: 'array',
      of: [
        defineField({
          name: 'sizeRow',
          title: 'Größe',
          type: 'object',
          fields: [
            defineField({
              name: 'size',
              title: 'Größe',
              type: 'string',
              options: {list: SIZES, layout: 'radio', direction: 'horizontal'},
              validation: (r) => r.required(),
            }),
            defineField({name: 'reach_mm', title: 'Reach (mm)', type: 'number'}),
            defineField({name: 'stack_mm', title: 'Stack (mm)', type: 'number'}),
            defineField({name: 'headAngle_deg', title: 'Lenkwinkel (°)', type: 'number'}),
            defineField({name: 'seatAngle_deg', title: 'Sitzwinkel (°)', type: 'number'}),
            defineField({name: 'chainstay_mm', title: 'Kettenstrebe (mm)', type: 'number'}),
            defineField({name: 'wheelbase_mm', title: 'Radstand (mm)', type: 'number'}),
            defineField({name: 'topTube_mm', title: 'Oberrohr (mm)', type: 'number'}),
            defineField({name: 'headTube_mm', title: 'Steuerrohr (mm)', type: 'number'}),
            defineField({name: 'seatTube_mm', title: 'Sitzrohr (mm)', type: 'number'}),
          ],
          preview: {
            select: {size: 'size', reach: 'reach_mm', stack: 'stack_mm'},
            prepare({size, reach, stack}) {
              return {
                title: `Größe ${size ?? '?'}`,
                subtitle: [reach && `Reach ${reach}`, stack && `Stack ${stack}`].filter(Boolean).join(' · '),
              }
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'disclaimer',
      title: 'Hinweis',
      type: 'localeString',
      description: 'z. B. „Foto in Größe M – Maße siehe Pfeile."',
    }),
  ],
  preview: {
    select: {media: 'bikePhoto', measurements: 'measurements', annotations: 'annotations'},
    prepare({media, measurements, annotations}) {
      const m = Array.isArray(measurements) ? measurements.length : 0
      const a = Array.isArray(annotations) ? annotations.length : 0
      return {title: 'Geometrie (interaktiv)', subtitle: `${m} Größen · ${a} Maßlinien`, media}
    },
  },
})
