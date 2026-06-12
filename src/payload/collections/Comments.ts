import type { CollectionConfig } from 'payload'

export const Comments: CollectionConfig = {
  slug: 'comments',
  admin: {
    useAsTitle: 'commentText',
    defaultColumns: ['associatedType', 'associatedId', 'reaction', 'createdAt'],
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'associatedType',
      type: 'select',
      required: true,
      options: [
        { label: 'Travel', value: 'travel' },
        { label: 'Timeline', value: 'timeline' },
        { label: 'Blog', value: 'blog' },
      ],
    },
    {
      name: 'associatedId',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'commentText',
      type: 'textarea',
      required: false,
      localized: true,
    },
    {
      name: 'reaction',
      type: 'select',
      required: false,
      defaultValue: 'none',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Thumb Up', value: 'up' },
        { label: 'Thumb Down', value: 'down' },
        { label: 'Heart', value: 'heart' },
        { label: 'Cool', value: 'cool' },
        { label: 'Applause', value: 'applause' },
      ],
    },
  ],
}
