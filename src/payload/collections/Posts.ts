import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'isPrivate', 'publishedDate'],
  },
  access: {
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
