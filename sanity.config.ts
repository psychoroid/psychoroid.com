'use client'

/**
 * This configuration is used to for the Sanity Studio that's mounted on the `/app/sanity/[[...index]]/page.tsx` route
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import {apiVersion, dataset, projectId} from './sanity/env'
import {schemaTypes} from './sanity/schemaTypes'
import {structure} from './sanity/structure'

export default defineConfig({
  basePath: '/sanity',
  projectId: 'iwxhqxkv',
  dataset: 'production',
  apiVersion: '2024-01-01',
  schema: {
    types: schemaTypes,
  },
  plugins: [
    deskTool({
      structure
    }),
    // Vision is for querying with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({defaultApiVersion: apiVersion}),
  ],
})
