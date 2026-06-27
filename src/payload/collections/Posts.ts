import type { CollectionConfig } from 'payload'

import { canManageContent } from '../access/is-admin'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'isPrivate', 'publishedDate'],
  },
  access: {
    create: ({ req }) => canManageContent({ user: req.user }),
    read: ({ req }) => {
      if (req.user) {
        return true
      }

      return {
        isPrivate: {
          equals: false,
        },
      }
    },
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
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      required: false,
    },
    {
      name: 'isPrivate',
      type: 'checkbox',
      required: false,
      defaultValue: true,
    },
    {
      name: 'publishedDate',
      type: 'date',
      required: true,
    },
    {
      name: 'coverImage',
      type: 'relationship',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      localized: true,
    },
    {
      name: 'tags',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
          localized: true,
        },
      ],
    },
  ],
}
