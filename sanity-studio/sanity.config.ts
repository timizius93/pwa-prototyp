import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {media} from 'sanity-plugin-media'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

export default defineConfig({
  name: 'default',
  title: '41 Magazin Pilot',

  projectId: '5ul5gufv',
  dataset: 'production',

  plugins: [structureTool({structure}), media(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
