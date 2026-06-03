import {defineType, defineField} from 'sanity'
import {HotspotPositioner, NumberedHotspotItem} from '../../components/HotspotPositioner'
import {GeometryWizard} from '../../components/GeometryWizard'

const SIZES = ['S', 'M', 'L', 'XL', 'XXL']

// Kombi-Baustein „Interaktives Bike": EIN Bike-Foto, im Reader per Umschalter zwei Modi —
// Details (Hotspots) und Geometrie (Maßlinien + Größen-Switcher). Führt die beiden Einzel-
// Bausteine hotspotImage + geometryOverlay auf einem gemeinsamen Foto zusammen (wie die native
// App). Beide visuellen Placer (Hotspot-Punkte + Geometrie-Pfeile) arbeiten auf `bikePhoto`.
// Die Einzel-Bausteine bleiben weiter verfügbar, falls man nur eins braucht.
export const interactiveBike = defineType({
  name: 'interactiveBike',
  title: 'Interaktives Bike (Details + Geometrie)',
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
      description: 'Welche Größe ist auf dem Foto zu sehen (Hinweis + Pfeil-Positionen)?',
      options: {list: SIZES, layout: 'radio', direction: 'horizontal'},
      initialValue: 'M',
    }),
    // --- Modus „Details": frei platzierte +-Marker mit Detail-Foto/-Text ---
    defineField({
      name: 'hotspots',
      title: 'Details-Hotspots',
      type: 'array',
      components: {input: HotspotPositioner},
      of: [
        defineField({
          name: 'hotspot',
          title: 'Hotspot',
          type: 'object',
          components: {item: NumberedHotspotItem},
          fields: [
            defineField({name: 'x', title: 'Position X (0–1, von links)', type: 'number', validation: (r) => r.required().min(0).max(1)}),
            defineField({name: 'y', title: 'Position Y (0–1, von oben)', type: 'number', validation: (r) => r.required().min(0).max(1)}),
            defineField({name: 'label', title: 'Beschriftung', type: 'localeString', description: 'Kurzer Titel im geöffneten Hotspot'}),
            defineField({name: 'detailImage', title: 'Detail-Foto', type: 'image', options: {hotspot: true}}),
            defineField({name: 'detailText', title: 'Detail-Text', type: 'localeText'}),
          ],
          preview: {
            select: {label: 'label.de', media: 'detailImage'},
            prepare({label, media}) {
              return {title: label || 'Hotspot', media}
            },
          },
        }),
      ],
    }),
    // --- Modus „Geometrie": Maßlinien/Pfeile + Werte-Tabelle pro Größe ---
    defineField({
      name: 'annotations',
      title: 'Geometrie-Maßlinien / Pfeile',
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
      title: 'Hinweis (Geometrie)',
      type: 'localeString',
      description: 'z. B. „Foto in Größe M – Maße siehe Pfeile."',
    }),
  ],
  preview: {
    select: {media: 'bikePhoto', hotspots: 'hotspots', measurements: 'measurements'},
    prepare({media, hotspots, measurements}) {
      const h = Array.isArray(hotspots) ? hotspots.length : 0
      const m = Array.isArray(measurements) ? measurements.length : 0
      return {title: 'Interaktives Bike', subtitle: `${h} Hotspots · ${m} Größen`, media}
    },
  },
})
