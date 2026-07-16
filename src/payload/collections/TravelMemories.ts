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
      name: 'itineraryImages',
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
        { name: 'dateLabel', type: 'text', required: false },
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'theme', type: 'text', required: false, localized: true },
        { name: 'story', type: 'textarea', required: false, localized: true },
        {
          name: 'segments',
          type: 'array',
          required: false,
          fields: [
            { name: 'time', type: 'text', required: false },
            { name: 'activity', type: 'textarea', required: true, localized: true },
            { name: 'transport', type: 'text', required: false, localized: true },
            { name: 'notes', type: 'textarea', required: false, localized: true },
          ],
        },
        {
          name: 'meals',
          type: 'group',
          required: false,
          fields: [
            { name: 'breakfast', type: 'text', required: false, localized: true },
            { name: 'lunch', type: 'text', required: false, localized: true },
            { name: 'dinner', type: 'text', required: false, localized: true },
          ],
        },
        { name: 'lodging', type: 'text', required: false, localized: true },
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
            { name: 'dateLabel', type: 'text', required: false },
            { name: 'airline', type: 'text', required: false, localized: true },
            { name: 'flightNumber', type: 'text', required: false },
            { name: 'route', type: 'text', required: false, localized: true },
            { name: 'passengers', type: 'text', required: false, localized: true },
            { name: 'departureTime', type: 'text', required: false },
            { name: 'arrivalTime', type: 'text', required: false },
            { name: 'terminal', type: 'text', required: false },
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
            { name: 'dateRange', type: 'text', required: false },
            { name: 'hotel', type: 'text', required: true, localized: true },
            { name: 'city', type: 'text', required: false, localized: true },
            { name: 'address', type: 'text', required: false, localized: true },
            { name: 'roomType', type: 'text', required: false, localized: true },
            { name: 'bookingChannel', type: 'text', required: false, localized: true },
            { name: 'price', type: 'text', required: false, localized: true },
            { name: 'highlights', type: 'textarea', required: false, localized: true },
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
          name: 'level',
          type: 'number',
          required: true,
          defaultValue: 2,
          min: 1,
          max: 3,
        },
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'anchor', type: 'text', required: true },
        { name: 'displayDay', type: 'text', required: false, localized: true },
        { name: 'displayDate', type: 'text', required: false, localized: true },
        { name: 'displaySubtitle', type: 'text', required: false, localized: true },
        { name: 'body', type: 'textarea', required: true, localized: true },
        linksField(),
        mediaItemsField(),
        {
          name: 'interactions',
          type: 'group',
          required: false,
          fields: [
            { name: 'commentsEnabled', type: 'checkbox', defaultValue: true, required: false },
            { name: 'thumbsUpEnabled', type: 'checkbox', defaultValue: true, required: false },
            { name: 'thumbsDownEnabled', type: 'checkbox', defaultValue: true, required: false },
          ],
        },
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
    {
      name: 'reminders',
      type: 'array',
      required: false,
      fields: [
        { name: 'category', type: 'text', required: true, localized: true },
        {
          name: 'items',
          type: 'array',
          required: false,
          fields: [{ name: 'text', type: 'textarea', required: true, localized: true }],
        },
      ],
    },
    sourceMetadataField(),
  ],
}
