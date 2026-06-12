import type { GlobalConfig } from 'payload'

export const HomeConfig: GlobalConfig = {
  slug: 'home-config',
  label: 'Home Config',
  access: {
    read: () => true,
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
      name: 'featuredTravel',
      type: 'relationship',
      relationTo: 'travel-projects',
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
