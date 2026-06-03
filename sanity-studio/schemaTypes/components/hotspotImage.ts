import {defineType, defineField} from 'sanity'
import {HotspotPositioner, NumberedHotspotItem} from '../../components/HotspotPositioner'

// Foto mit frei platzierbaren +-Markern. Antippen öffnet ein Detail-Foto und/oder einen kurzen
// Text als Overlay. DAS interaktive Wow-Feature, das Button Publish fundamental nicht kann
// (dort ist alles an festen Pixel-Koordinaten fixiert; hier sind Position + Inhalt strukturierte,
// im Studio editierbare Daten).
//
// Positionen sind relativ (0–1) zur Bildgröße → skaliert auf jede Display-Breite. Im Studio setzt
// der Editor x/y heute über die zwei Zahlenfelder; ein klick-/ziehbarer Custom-Input wäre der
// nächste Komfort-Schritt (für den Spike bewusst noch nicht gebaut).
export const hotspotImage = defineType({
  name: 'hotspotImage',
  title: 'Interaktives Foto (Hotspots)',
  type: 'object',
  fields: [
    defineField({
      name: 'baseImage',
      title: 'Basis-Foto',
      type: 'image',
      options: {hotspot: true},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'hotspots',
      title: 'Hotspots',
      type: 'array',
      components: {input: HotspotPositioner},
      of: [
        defineField({
          name: 'hotspot',
          title: 'Hotspot',
          type: 'object',
          components: {item: NumberedHotspotItem},
          fields: [
            defineField({
              name: 'x',
              title: 'Position X (0–1, von links)',
              type: 'number',
              validation: (r) => r.required().min(0).max(1),
            }),
            defineField({
              name: 'y',
              title: 'Position Y (0–1, von oben)',
              type: 'number',
              validation: (r) => r.required().min(0).max(1),
            }),
            defineField({
              name: 'label',
              title: 'Beschriftung',
              type: 'localeString',
              description: 'Kurzer Titel, erscheint im geöffneten Hotspot',
            }),
            defineField({
              name: 'detailImage',
              title: 'Detail-Foto',
              type: 'image',
              options: {hotspot: true},
            }),
            defineField({
              name: 'detailText',
              title: 'Detail-Text',
              type: 'localeText',
            }),
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
  ],
  preview: {
    select: {media: 'baseImage', hotspots: 'hotspots'},
    prepare({media, hotspots}) {
      const count = Array.isArray(hotspots) ? hotspots.length : 0
      return {title: 'Interaktives Foto', subtitle: `${count} Hotspots`, media}
    },
  },
})
