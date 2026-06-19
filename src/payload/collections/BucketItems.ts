import type { CollectionConfig } from 'payload'

export const BucketItems: CollectionConfig = {
  slug: 'bucket-items',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'priority', 'isPrivate'],
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'description',
      type: 'textarea',
      required: false,
      localized: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pool',
      options: [
        { label: 'Pool', value: 'pool' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'Completed', value: 'completed' },
      ],
    },
    {
      name: 'priority',
      type: 'number',
      required: false,
      defaultValue: 3,
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      required: false,
    },
    {
      name: 'completedBy',
      type: 'relationship',
      relationTo: 'users',
      required: false,
    },
    {
      name: 'completedAt',
      type: 'date',
      required: false,
    },
    {
      name: 'targetDate',
      type: 'date',
      required: false,
    },
    {
      name: 'coverImage',
      type: 'relationship',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'isPrivate',
      type: 'checkbox',
      required: false,
      defaultValue: true,
    },
    {
      name: 'timelineEvent',
      type: 'relationship',
      relationTo: 'timeline-events',
      required: false,
    },
  ],
}
