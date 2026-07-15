import type { CollectionConfig } from 'payload'

import {
  commonTravelFields,
  linksField,
  mediaItemsField,
  sourceMetadataField,
  travelCollectionAccess,
  travelCollectionVersions,
  validateUniqueAnchors,
} from './travel-shared-fields'
import {
  preventCrossTravelSlugCollision,
  removeTravelRouteIdentity,
  syncTravelRouteIdentity,
} from './travel-slug-guard'

export const TravelMemories: CollectionConfig = {
  slug: 'travel-memories',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'startDate', 'endDate', 'originPlan', 'isPrivate', '_status'],
    description: 'Post-travel records, stories, photos, and sharing.',
  },
  access: travelCollectionAccess,
  hooks: {
    afterChange: [syncTravelRouteIdentity('travel-memories')],
    beforeDelete: [removeTravelRouteIdentity('travel-memories')],
    beforeValidate: [preventCrossTravelSlugCollision('travel-plans')],
  },
  versions: travelCollectionVersions,
  fields: [
    ...commonTravelFields('participants'),
    {
      name: 'originPlan',
      type: 'relationship',
      relationTo: 'travel-plans',
      required: false,
      index: true,
      admin: {
        description:
          'Optional provenance link. Creating a memory never changes or removes its source plan.',
      },
    },
    {
      name: 'galleryImages',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
      required: false,
    },
    {
      name: 'dailyHighlights',
      type: 'array',
      required: false,
      fields: [
        { name: 'day', type: 'number', required: false, min: 1 },
        { name: 'date', type: 'date', required: false },
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'story', type: 'textarea', required: false, localized: true },
        mediaItemsField(),
      ],
    },
    {
      name: 'travelLedger',
      type: 'group',
      required: false,
      fields: [
        {
          name: 'flights',
          type: 'array',
          required: false,
          fields: [
            { name: 'date', type: 'date', required: false },
            { name: 'airline', type: 'text', required: false, localized: true },
            { name: 'flightNumber', type: 'text', required: false },
            { name: 'route', type: 'text', required: false, localized: true },
            { name: 'departureTime', type: 'text', required: false },
            { name: 'arrivalTime', type: 'text', required: false },
            { name: 'notes', type: 'textarea', required: false, localized: true },
          ],
        },
        {
          name: 'lodgings',
          type: 'array',
          required: false,
          fields: [
            { name: 'startDate', type: 'date', required: false },
            { name: 'endDate', type: 'date', required: false },
            { name: 'hotel', type: 'text', required: true, localized: true },
            { name: 'city', type: 'text', required: false, localized: true },
            { name: 'notes', type: 'textarea', required: false, localized: true },
          ],
        },
      ],
    },
    {
      name: 'storySections',
      type: 'array',
      required: false,
      validate: validateUniqueAnchors,
      fields: [
        {
          name: 'kind',
          type: 'select',
          required: true,
          defaultValue: 'freeform',
          options: [
            { label: 'Overview', value: 'overview' },
            { label: 'Day', value: 'day' },
            { label: 'Reflection', value: 'reflection' },
            { label: 'Food', value: 'food' },
            { label: 'Freeform', value: 'freeform' },
          ],
        },
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'anchor', type: 'text', required: true },
        { name: 'body', type: 'textarea', required: true, localized: true },
        linksField(),
        mediaItemsField(),
      ],
    },
    {
      name: 'externalVideos',
      type: 'array',
      required: false,
      fields: [
        { name: 'title', type: 'text', required: false, localized: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
    sourceMetadataField(),
  ],
}
