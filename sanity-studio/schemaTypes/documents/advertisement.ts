import {defineType, defineField} from 'sanity'
import {validateIssueMatchesMagazine} from '../lib/validateIssueMagazine'

// Werbe-Anzeige als eigener Dokumenttyp. Mischt sich im Reader-Carousel zwischen die Artikel
// derselben Ausgabe — Sortierung über das gemeinsame `position`-Feld (kleine Zahl = früher).
//
// Zwei Modi:
//   - standard  → bestehender Print-Workflow: ein oder mehrere Anzeigen-Bilder gestapelt,
//                 darüber liegen rechteckige Klick-Zonen mit Bitly-Links (heutige Praxis 1:1).
//                 Optionale Galerie für Lightbox-Bilder.
//   - custom    → individuell programmiertes React-Modul (Parallax, Reveal, Konfigurator, …).
//                 Reader lädt die Komponente per `componentId` aus der Ad-Registry —
//                 NEUE Premium-Werbeklasse, die im Heft und in der nativen App technisch
//                 unmöglich ist. Refinanzierungs-Argument für Max & Robin.
//
// Kennzeichnung „AD" trägt nur die Kiosk-/Übersichtskarte, die Anzeige selbst nicht
// (genau wie heute in der nativen App).
export const advertisement = defineType({
  name: 'advertisement',
  title: 'Anzeige',
  type: 'document',
  groups: [
    {name: 'content', title: 'Inhalt', default: true},
    {name: 'meta', title: 'Meta & Platzierung'},
  ],
  fields: [
    defineField({
      name: 'sponsor',
      title: 'Sponsor / Werbekunde',
      type: 'string',
      group: 'content',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'mode',
      title: 'Anzeigen-Typ',
      type: 'string',
      group: 'content',
      options: {
        list: [
          {title: 'Standard (Print-Bild + Klick-Zonen)', value: 'standard'},
          {title: 'Custom (interaktives Modul)', value: 'custom'},
        ],
        layout: 'radio',
      },
      initialValue: 'standard',
      validation: (r) => r.required(),
    }),

    // ─── STANDARD-MODUS ─────────────────────────────────────────────
    defineField({
      name: 'images',
      title: 'Anzeigen-Bilder (Screens, untereinander gescrollt)',
      type: 'array',
      group: 'content',
      description:
        'LIEFER-FORMAT je Screen: Querformat 3840 × 2160 px (16:9), RGB, JPG/PNG. ' +
        'Ein Bild = ein Screen. Mehrere Bilder = vertikal scrollbare Anzeige (im Querformat ' +
        'rastet jeder Screen ein, wie das „Umblättern" in der bisherigen App). Jeden Screen ' +
        'als EIGENES Bild hochladen (nicht eine durchgehende 4320er-Datei) — dann sitzt das ' +
        'Snapping sauber. Wichtige Elemente (Logo, CTA) je Screen in den inneren ~80 % halten. ' +
        'Klick-Zonen werden pro Bild gesetzt.',
      of: [{type: 'adImageWithZones'}],
      hidden: ({parent}) => parent?.mode !== 'standard',
    }),
    defineField({
      name: 'gallery',
      title: 'Optionale Lightbox-Galerie',
      type: 'array',
      group: 'content',
      description: 'Zusätzliche Bilder, die in einer Lightbox geöffnet werden (z. B. Detailansichten).',
      of: [{type: 'image', options: {hotspot: true}}],
      hidden: ({parent}) => parent?.mode !== 'standard',
    }),

    // ─── CUSTOM-MODUS ───────────────────────────────────────────────
    defineField({
      name: 'componentId',
      title: 'Komponenten-ID',
      type: 'string',
      group: 'content',
      description:
        'Verweist auf eine React-Komponente unter `pwa-prototyp/components/ads/<id>.tsx`. ' +
        'Beispiel: „specialized-levo-4". Aufwand pro Modul = Stunden bis Tage, ' +
        'nur für 1–2 Top-Kunden pro Ausgabe sinnvoll.',
      hidden: ({parent}) => parent?.mode !== 'custom',
    }),

    // ─── META & PLATZIERUNG ─────────────────────────────────────────
    defineField({
      name: 'magazine',
      title: 'Magazin',
      type: 'reference',
      to: [{type: 'magazine'}],
      group: 'meta',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'issue',
      title: 'Ausgabe',
      type: 'reference',
      to: [{type: 'issue'}],
      group: 'meta',
      validation: (r) => r.required().custom(validateIssueMatchesMagazine()),
    }),
    defineField({
      name: 'position',
      title: 'Position in der Ausgabe',
      type: 'number',
      group: 'meta',
      description:
        'Frei platzierbar — gemeinsame Sortierung mit den Artikeln derselben Ausgabe. ' +
        'Kleinere Zahl = früher im Carousel. Tipp: Schritte von 10 lassen Platz für spätere Einfügungen.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'language',
      title: 'Sprache(n)',
      type: 'string',
      group: 'meta',
      options: {
        list: [
          {title: 'Deutsch', value: 'de'},
          {title: 'Englisch', value: 'en'},
          {title: 'Beide (DE + EN)', value: 'both'},
        ],
        layout: 'radio',
      },
      initialValue: 'both',
    }),
  ],
  preview: {
    select: {
      sponsor: 'sponsor',
      mode: 'mode',
      position: 'position',
      firstImage: 'images.0.image',
    },
    prepare({sponsor, mode, position, firstImage}) {
      const tag = mode === 'custom' ? 'CUSTOM' : 'STANDARD'
      const pos = typeof position === 'number' ? `#${position}` : '—'
      return {
        title: sponsor || 'Anzeige',
        subtitle: `AD · ${tag} · Pos ${pos}`,
        media: firstImage,
      }
    },
  },
})
