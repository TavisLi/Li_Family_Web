import type { CollectionConfig } from 'payload'

export const WrappedSnapshots: CollectionConfig = {
  slug: 'wrapped-snapshots',
  admin: {
    useAsTitle: 'year',
    defaultColumns: ['year', 'status', 'publishedAt', 'isPrivate'],
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
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'year',
      type: 'number',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: false,
    },
    {
      name: 'heroMedia',
      type: 'relationship',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'summary',
      type: 'textarea',
      required: false,
      localized: true,
    },
    {
      name: 'stats',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'value',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'note',
          type: 'text',
          required: false,
          localized: true,
        },
      ],
    },
    {
      name: 'blocks',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'kind',
          type: 'select',
          required: true,
          defaultValue: 'memory',
          options: [
            { label: 'Memory', value: 'memory' },
            { label: 'Travel', value: 'travel' },
            { label: 'Blog', value: 'blog' },
            { label: 'Wish', value: 'wish' },
          ],
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'body',
          type: 'textarea',
          required: false,
          localized: true,
        },
        {
          name: 'accent',
          type: 'text',
          required: false,
        },
      ],
    },
    {
      name: 'isPrivate',
      type: 'checkbox',
      required: false,
      defaultValue: true,
    },
  ],
}
