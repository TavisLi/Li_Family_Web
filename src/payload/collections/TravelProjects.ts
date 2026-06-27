import type { CollectionConfig } from 'payload'

import { canManageContent } from '../access/is-admin'

export const TravelProjects: CollectionConfig = {
  slug: 'travel-projects',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'startDate', 'endDate'],
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
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { label: 'Planning', value: 'planning' },
        { label: 'Completed', value: 'completed' },
      ],
    },
    {
      name: 'isPrivate',
      type: 'checkbox',
      required: false,
      defaultValue: true,
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
    },
    {
      name: 'endDate',
      type: 'date',
      required: true,
    },
    {
      name: 'externalDocIdentifier',
      type: 'text',
      required: false,
      admin: {
        description: 'Matches a file under content-source/travels for future seed import.',
      },
    },
    {
      name: 'coverImage',
      type: 'relationship',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'galleryImages',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
      required: false,
    },
    {
      name: 'itineraryImages',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
      required: false,
      admin: {
        description:
          'Seeded from content-source/assets/travels/[slug]/itinerary and replaceable in Payload Admin.',
      },
    },
    {
      name: 'members',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      required: false,
    },
    {
      name: 'summary',
      type: 'textarea',
      required: false,
      localized: true,
    },
    {
      name: 'party',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'name',
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
      name: 'flights',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'date',
          type: 'text',
          required: false,
        },
        {
          name: 'airline',
          type: 'text',
          required: false,
          localized: true,
        },
        {
          name: 'flightNumber',
          type: 'text',
          required: true,
        },
        {
          name: 'route',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'passengers',
          type: 'text',
          required: false,
          localized: true,
        },
        {
          name: 'departureTime',
          type: 'text',
          required: false,
        },
        {
          name: 'arrivalTime',
          type: 'text',
          required: false,
        },
        {
          name: 'terminal',
          type: 'text',
          required: false,
        },
        {
          name: 'notes',
          type: 'textarea',
          required: false,
          localized: true,
        },
      ],
    },
    {
      name: 'railSegments',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'date',
          type: 'text',
          required: false,
        },
        {
          name: 'trainNumber',
          type: 'text',
          required: true,
        },
        {
          name: 'route',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'departureTime',
          type: 'text',
          required: false,
        },
        {
          name: 'arrivalTime',
          type: 'text',
          required: false,
        },
        {
          name: 'duration',
          type: 'text',
          required: false,
          localized: true,
        },
        {
          name: 'fare',
          type: 'text',
          required: false,
          localized: true,
        },
      ],
    },
    {
      name: 'lodgings',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'dateRange',
          type: 'text',
          required: true,
        },
        {
          name: 'city',
          type: 'text',
          required: false,
          localized: true,
        },
        {
          name: 'hotel',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'address',
          type: 'text',
          required: false,
          localized: true,
        },
        {
          name: 'roomType',
          type: 'text',
          required: false,
          localized: true,
        },
        {
          name: 'bookingChannel',
          type: 'text',
          required: false,
          localized: true,
        },
        {
          name: 'price',
          type: 'text',
          required: false,
          localized: true,
        },
        {
          name: 'highlights',
          type: 'textarea',
          required: false,
          localized: true,
        },
      ],
    },
    {
      name: 'cabinAssignments',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'cabin',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'passengers',
          type: 'text',
          required: true,
          localized: true,
        },
      ],
    },
    {
      name: 'dailyItinerary',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'day',
          type: 'number',
          required: true,
          min: 1,
        },
        {
          name: 'date',
          type: 'text',
          required: false,
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'theme',
          type: 'text',
          required: false,
          localized: true,
        },
        {
          name: 'segments',
          type: 'array',
          required: false,
          fields: [
            {
              name: 'time',
              type: 'text',
              required: false,
            },
            {
              name: 'activity',
              type: 'textarea',
              required: true,
              localized: true,
            },
            {
              name: 'transport',
              type: 'text',
              required: false,
              localized: true,
            },
            {
              name: 'notes',
              type: 'textarea',
              required: false,
              localized: true,
            },
          ],
        },
        {
          name: 'meals',
          type: 'group',
          fields: [
            {
              name: 'breakfast',
              type: 'text',
              required: false,
              localized: true,
            },
            {
              name: 'lunch',
              type: 'text',
              required: false,
              localized: true,
            },
            {
              name: 'dinner',
              type: 'text',
              required: false,
              localized: true,
            },
          ],
        },
        {
          name: 'lodging',
          type: 'text',
          required: false,
          localized: true,
        },
      ],
    },
    {
      name: 'foodRecommendations',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'category',
          type: 'text',
          required: false,
          localized: true,
        },
        {
          name: 'name',
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
          name: 'suitableFor',
          type: 'text',
          required: false,
          localized: true,
        },
      ],
    },
    {
      name: 'costItems',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'category',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'item',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'unitPrice',
          type: 'text',
          required: false,
          localized: true,
        },
        {
          name: 'quantity',
          type: 'text',
          required: false,
        },
        {
          name: 'subtotal',
          type: 'text',
          required: false,
          localized: true,
        },
        {
          name: 'notes',
          type: 'textarea',
          required: false,
          localized: true,
        },
      ],
    },
    {
      name: 'optionalActivities',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'city',
          type: 'text',
          required: false,
          localized: true,
        },
        {
          name: 'name',
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
          name: 'price',
          type: 'text',
          required: false,
          localized: true,
        },
        {
          name: 'riskLevel',
          type: 'text',
          required: false,
          localized: true,
        },
        {
          name: 'notes',
          type: 'textarea',
          required: false,
          localized: true,
        },
      ],
    },
    {
      name: 'reminders',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'category',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'items',
          type: 'array',
          required: false,
          fields: [
            {
              name: 'text',
              type: 'textarea',
              required: true,
              localized: true,
            },
          ],
        },
      ],
    },
    {
      name: 'sourceSections',
      type: 'array',
      required: false,
      admin: {
        description:
          'Faithful Markdown source sections imported from content-source/travels for full-page coverage.',
      },
      fields: [
        {
          name: 'level',
          type: 'number',
          required: true,
          min: 1,
          max: 3,
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'anchor',
          type: 'text',
          required: true,
        },
        {
          name: 'body',
          type: 'textarea',
          required: true,
          localized: true,
        },
        {
          name: 'links',
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
              name: 'url',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
    {
      name: 'externalVideos',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'youtubeUrl',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
