import type { CollectionConfig } from 'payload'

import { canManageContent } from '../access/is-admin'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
  },
  access: {
    create: ({ req }) => canManageContent({ user: req.user }),
    read: () => true,
    update: ({ req }) => canManageContent({ user: req.user }),
    delete: ({ req }) => canManageContent({ user: req.user }),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'description',
      type: 'textarea',
      required: false,
      localized: true,
    },
  ],
}
