import type { CollectionConfig } from 'payload'

import { canManageContent } from '../access/is-admin'

export const TimelineEvents: CollectionConfig = {
  slug: 'timeline-events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'eventDate', 'sourceType', 'isPrivate'],
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
    create: ({ req }) => canManageContent({ user: req.user }),
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
      name: 'eventDate',
      type: 'date',
      required: true,
      index: true,
    },
    {
      name: 'year',
      type: 'number',
      required: true,
      index: true,
    },
    {
      name: 'summary',
      type: 'textarea',
      required: false,
      localized: true,
    },
    {
      name: 'description',
      type: 'textarea',
      required: false,
      localized: true,
    },
    {
      name: 'images',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
      required: false,
    },
    {
      name: 'relatedTravelRecord',
      type: 'relationship',
      relationTo: ['travel-plans', 'travel-memories'],
      required: false,
    },
    {
      name: 'relatedPost',
      type: 'relationship',
      relationTo: 'posts',
      required: false,
    },
    {
      name: 'relatedMembers',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      required: false,
    },
    {
      name: 'sourceType',
      type: 'select',
      required: true,
      defaultValue: 'manual',
      options: [
        { label: 'Manual', value: 'manual' },
        { label: 'Bucket Item', value: 'bucket-item' },
        { label: 'Travel', value: 'travel' },
        { label: 'Post', value: 'post' },
      ],
    },
    {
      name: 'isPrivate',
      type: 'checkbox',
      required: false,
      defaultValue: true,
    },
    {
      name: 'sortOrder',
      type: 'number',
      required: false,
      defaultValue: 0,
    },
  ],
}
