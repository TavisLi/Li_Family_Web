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

export const TravelPlans: CollectionConfig = {
  slug: 'travel-plans',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'startDate', 'endDate', 'isPrivate', '_status'],
    description:
      'Planning workspaces. The end date controls Active Plans versus Archived Plans in the lobby.',
  },
  access: travelCollectionAccess,
  hooks: {
    afterChange: [syncTravelRouteIdentity('travel-plans')],
    beforeDelete: [removeTravelRouteIdentity('travel-plans')],
    beforeValidate: [preventCrossTravelSlugCollision('travel-memories')],
  },
  versions: travelCollectionVersions,
  fields: [
    ...commonTravelFields(
      'members',
      'The lobby derives Active Plans or Archived Plans from this date.',
    ),
    {
      name: 'planningSections',
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
        {
          name: 'anchor',
          type: 'text',
          required: true,
          admin: { description: 'Stable section identity used by reconciliation and deep links.' },
        },
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
      name: 'memories',
      type: 'join',
      collection: 'travel-memories',
      on: 'originPlan',
      admin: {
        description: 'Virtual reverse link; the relationship is stored only on the memory.',
      },
    },
    sourceMetadataField(),
  ],
}
