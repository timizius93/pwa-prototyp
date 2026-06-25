import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentationTool, defineLocations, defineDocuments} from 'sanity/presentation'
import {visionTool} from '@sanity/vision'
import {media} from 'sanity-plugin-media'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

// Wohin der Reader (für die Live-Preview) läuft. Lokaler Dev-Reader auf :3000.
// Fürs Pilot-Setup reicht das (Studio läuft lokal); ein deploytes Studio bräuchte
// hier die Vercel-Origin.
const READER_ORIGIN = process.env.SANITY_STUDIO_PREVIEW_ORIGIN || 'http://localhost:3000'

// Mapping Artikel-Dokument → Reader-Seite(n). Damit springt die Presentation-Vorschau
// beim Öffnen eines Artikels automatisch auf die richtige URL (/artikel/<slug>) und
// bietet zusätzlich den Sprung zum Kiosk an. Greift für beide Artikel-Typen identisch.
const articleLocations = defineLocations({
  select: {title: 'title_mag.de', slug: 'slug.current'},
  resolve: (doc) => ({
    locations: [
      {title: doc?.title || 'Artikel', href: `/artikel/${doc?.slug}`},
      {title: 'Kiosk (Übersicht)', href: '/'},
    ],
  }),
})

export default defineConfig({
  name: 'default',
  title: '41 Magazin Pilot',

  projectId: '5ul5gufv',
  dataset: 'production',

  plugins: [
    structureTool({structure}),
    // Live-Preview: Studio links, echter Reader rechts (zeigt den Draft-Stand).
    presentationTool({
      previewUrl: {origin: READER_ORIGIN},
      resolve: {
        // URL → Dokument: füllt „Documents on this page". Die Artikel-Route /artikel/<slug>
        // mappt auf den Artikel mit diesem Slug (beide Artikel-Typen).
        mainDocuments: defineDocuments([
          {
            route: '/artikel/:slug',
            filter: '_type in ["article", "articleEditorial"] && slug.current == $slug',
          },
        ]),
        // Dokument → URL: für „Used on"-Hinweise + den Vorschau-Sprung beim Öffnen.
        locations: {
          article: articleLocations,
          articleEditorial: articleLocations,
        },
      },
    }),
    media(),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})
