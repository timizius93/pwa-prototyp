import {defineType, defineField} from 'sanity'

// Titelseite des Artikels.
// Modus 1 — Editorial (schlank): backgroundImage + title/subtitle. Dim-Overlay sorgt für Text-Kontrast.
// Modus 2 — Print-Cover (3 Layer): backgroundImage ist bereits in Photoshop fertig durchdesignt
//   (Verläufe, Vignette, Color-Grading alles drin). Titel-Typografie liegt darüber als ECHTER Text
//   (responsive, EN/DE). foregroundImage ist das freigestellte Subject und liegt ganz oben — so
//   entsteht der „Person vor Schrift"-Effekt, ohne dass Text zu PNG wird.
// Modus 3 — Notausgang: customCoverImage ersetzt die ganze Titelseite durch EIN Bild. Nur einsetzen,
//   wenn das 3-Layer-Modell nicht reicht (Foto-in-Buchstaben-Stanzung o. Ä.). Dann ist der Text
//   nicht übersetzbar / nicht responsive — bewusste Ausnahme, nicht die Regel.
export const titlePage = defineType({
  name: 'titlePage',
  title: 'Titelseite',
  type: 'object',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow / Kategorie',
      type: 'localeString',
      description: 'Kleiner Text über dem Titel, z. B. „EDITORIAL"',
    }),
    defineField({name: 'title', title: 'Titel', type: 'localeString'}),
    defineField({name: 'subtitle', title: 'Untertitel', type: 'localeString'}),
    defineField({
      name: 'backgroundImage',
      title: 'Hintergrundfoto',
      type: 'image',
      description:
        'Bildbühne inkl. aller Foto-Effekte (Verläufe, Vignette, Abdunklung, Color-Grading). Effekte gehören INS Foto — nicht ins Studio.',
      options: {hotspot: true},
    }),
    defineField({
      name: 'foregroundImage',
      title: 'Vordergrund (freigestelltes Subject)',
      type: 'image',
      description:
        'Optional. PNG mit Alpha-Kanal, exakt deckungsgleicher Crop & Canvas-Größe wie das Hintergrundfoto. Liegt VOR der Titel-Typo („Person vor Schrift").',
    }),
    defineField({
      name: 'creditByline',
      title: 'Credit-Zeile',
      type: 'localeString',
      description:
        'Fußzeile am unteren Cover-Rand, z. B. „TEXT PATRICK GRUBER, BENEDIKT SCHMIDT — FOTO LARS ENGMANN". Optional.',
    }),
    defineField({
      name: 'coverArtwork',
      title: 'Cover-Artwork (Querformat)',
      type: 'image',
      description:
        'Das durchgestaltete Cover als ein Bild — Headline-Typo, Subtitle, Rahmen, freigestelltes Subject, alles drin. Wenn gefüllt: hat Vorrang vor 3-Layer (background/foreground/title/subtitle). Anlage in InDesign: 3840 × 2160 px (16:9), WebP Q85. Kritische Elemente innerhalb der zentralen 80 % halten.',
      options: {hotspot: true},
    }),
    defineField({
      name: 'coverArtworkMobile',
      title: 'Cover-Artwork (Hochformat, Mobile)',
      type: 'image',
      description:
        'Optional. Hochformat-Variante des Cover-Artworks für Smartphones. Anlage in InDesign: 2160 × 3840 px (9:16). Wenn leer, wird das Querformat auf Mobile gecropped (kann seitlich beschnitten werden).',
      options: {hotspot: true},
    }),
  ],
  preview: {
    select: {title: 'title.de', media: 'backgroundImage', cover: 'coverArtwork'},
    prepare({title, media, cover}) {
      return {title: title || 'Titelseite', subtitle: 'Titelseite', media: cover || media}
    },
  },
})
