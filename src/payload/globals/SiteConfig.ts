import type { GlobalConfig } from 'payload'

import { canManageContent } from '../access/is-admin'

export const SiteConfig: GlobalConfig = {
  slug: 'site-config',
  label: 'Site Config',
  access: {
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => canManageContent({ user: req.user }),
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Web Li',
    },
    {
      name: 'siteDescription',
      type: 'textarea',
      required: false,
      localized: true,
    },
    {
      name: 'contactPhone',
      type: 'text',
      required: false,
    },
    {
      name: 'contactEmail',
      type: 'email',
      required: false,
    },
    {
      name: 'contactAddress',
      type: 'textarea',
      required: false,
      localized: true,
    },
    {
      name: 'socialLinks',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'GitHub', value: 'github' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'Other', value: 'other' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
