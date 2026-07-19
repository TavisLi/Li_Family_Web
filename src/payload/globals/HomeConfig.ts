import type { GlobalConfig } from 'payload'

import { canManageContent } from '../access/is-admin'

export const HomeConfig: GlobalConfig = {
  slug: 'home-config',
  label: 'Home Config',
  access: {
    read: () => true,
    update: ({ req }) => canManageContent({ user: req.user }),
  },
  fields: [
    {
      name: 'heroTitle',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Welcome to Web Li',
    },
    {
      name: 'heroSubtitle',
      type: 'textarea',
      required: false,
      localized: true,
    },
    {
      name: 'heroBackground',
      type: 'relationship',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'featuredTravelRecord',
      type: 'relationship',
      relationTo: ['travel-plans', 'travel-memories'],
      required: false,
    },
    {
      name: 'announcement',
      type: 'textarea',
      required: false,
      localized: true,
    },
  ],
}
