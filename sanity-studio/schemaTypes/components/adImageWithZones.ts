import {defineType, defineField, defineArrayMember} from 'sanity'
import {ClickZonePositioner, NumberedZoneItem} from '../../components/ClickZonePositioner'

// Ein Anzeigen-„Screen" mit rechteckigen Klick-Zonen. Wird in `advertisement` als Baustein
// im `images[]`-Array genutzt (mehrere = vertikal scrollbar).
//
// Zwei Orientierungs-Varianten je Screen:
//   - `image` (Querformat, 3840×2160) + `clickZones`        → Desktop / quer
//   - `imageMobile` (Hochformat, optional) + `clickZonesMobile` → Hochkant-Phone
// Der Reader schaltet per Orientierung um. Beide Varianten haben EIGENE Zonen, weil das
// Layout (und damit die Positionen von Logo/CTA/Galerie-Schriftzug) sich unterscheidet.
// Positionen sind relativ (0–1) → skalieren auf jede Display-Breite.
//
// Der ClickZonePositioner liest sein Backdrop-Foto aus dem Feld, dessen Name sich aus dem
// Array-Feldnamen ergibt: `clickZones` → `image`, `clickZonesMobile` → `imageMobile`.

// Wiederverwendbarer Klick-Zonen-Member (identisch für quer + hoch).
const clickZoneMember = defineArrayMember({
  name: 'clickZone',
  title: 'Klick-Zone',
  type: 'object',
  components: {item: NumberedZoneItem},
  fields: [
    defineField({
      name: 'x',
      title: 'X (0–1, linke Kante)',
      type: 'number',
      validation: (r) => r.required().min(0).max(1),
    }),
    defineField({
      name: 'y',
      title: 'Y (0–1, obere Kante)',
      type: 'number',
      validation: (r) => r.required().min(0).max(1),
    }),
    defineField({
      name: 'w',
      title: 'Breite (0–1)',
      type: 'number',
      validation: (r) => r.required().min(0.01).max(1),
    }),
    defineField({
      name: 'h',
      title: 'Höhe (0–1)',
      type: 'number',
      validation: (r) => r.required().min(0.01).max(1),
    }),
    defineField({
      name: 'linkTarget',
      title: 'Aktion bei Klick',
      type: 'string',
      options: {
        list: [
          {title: 'Externer Link (URL / Bitly)', value: 'url'},
          {title: 'Bildergalerie / Slideshow öffnen', value: 'gallery'},
        ],
        layout: 'radio',
      },
      initialValue: 'url',
      description:
        '„Galerie" öffnet die unten gepflegte Lightbox-Galerie als Slideshow ' +
        '(z. B. Zone über den gedruckten „Bildergalerie"-Schriftzug legen).',
    }),
    defineField({
      name: 'url',
      title: 'Ziel-URL (z. B. Bitly-Link)',
      type: 'url',
      hidden: ({parent}) => parent?.linkTarget === 'gallery',
      validation: (r) =>
        r.uri({allowRelative: false, scheme: ['http', 'https']}).custom((val, ctx) => {
          const target = (ctx.parent as {linkTarget?: string})?.linkTarget
          if (target !== 'gallery' && !val)
            return 'URL erforderlich — oder Aktion auf „Bildergalerie" stellen.'
          return true
        }),
    }),
    defineField({
      name: 'label',
      title: 'Beschreibung (intern)',
      type: 'string',
      description: 'Nur fürs Studio — z. B. „Logo oben links", „Bildergalerie-Schriftzug"',
    }),
  ],
  preview: {
    select: {label: 'label', url: 'url', linkTarget: 'linkTarget'},
    prepare({label, url, linkTarget}) {
      const sub = linkTarget === 'gallery' ? '→ Bildergalerie/Slideshow' : url
      return {title: label || 'Klick-Zone', subtitle: sub}
    },
  },
})

export const adImageWithZones = defineType({
  name: 'adImageWithZones',
  title: 'Anzeigen-Bild mit Klick-Zonen',
  type: 'object',
  // Breiter Bearbeiten-Dialog — der Klick-Zonen-Placer braucht Platz fürs Foto.
  // In Sanity v5 ist `width` eine PIXEL-Zahl (kein 'small'/'large'-Keyword mehr).
  options: {
    modal: {type: 'dialog', width: 1200},
  },
  fields: [
    // ── Querformat (Pflicht) ──────────────────────────────────────────
    defineField({
      name: 'image',
      title: 'Anzeigen-Bild · Querformat (3840 × 2160)',
      type: 'image',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'altText',
      title: 'Alt-Text (Barrierefreiheit)',
      type: 'string',
      description: 'Wofür wirbt das Bild? Wird von Screenreadern vorgelesen.',
    }),
    defineField({
      name: 'clickZones',
      title: 'Klick-Zonen (Querformat)',
      type: 'array',
      components: {input: ClickZonePositioner},
      of: [clickZoneMember],
    }),

    // ── Hochformat (optional, für Hochkant-Phones) ────────────────────
    defineField({
      name: 'imageMobile',
      title: 'Hochformat-Variante (mobil, optional · 2160 × 3840)',
      type: 'image',
      description:
        'Optionales hochformatiges Layout fürs Phone. Wird im Hochformat statt des ' +
        'Querbilds gezeigt. Ohne diese Variante zeigt das Phone das Querbild (Letterbox).',
    }),
    defineField({
      name: 'clickZonesMobile',
      title: 'Klick-Zonen (Hochformat)',
      type: 'array',
      components: {input: ClickZonePositioner},
      of: [clickZoneMember],
      hidden: ({parent}) => !(parent as {imageMobile?: unknown})?.imageMobile,
    }),
  ],
  preview: {
    select: {media: 'image', zones: 'clickZones', mobile: 'imageMobile'},
    prepare({media, zones, mobile}) {
      const count = Array.isArray(zones) ? zones.length : 0
      const mob = mobile ? ' · +Hochformat' : ''
      return {title: 'Anzeigen-Bild', subtitle: `${count} Klick-Zonen${mob}`, media}
    },
  },
})
