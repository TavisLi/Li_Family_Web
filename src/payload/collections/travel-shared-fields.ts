import type { CollectionConfig, Field, Where } from 'payload'

import { canManageContent } from '../access/is-admin'

export const travelCollectionAccess: CollectionConfig['access'] = {
  create: ({ req }) => canManageContent({ user: req.user }),
  read: ({ req }) => {
    if (canManageContent({ user: req.user })) {
      return true
    }

    const publishedFilter: Where = { _status: { equals: 'published' } }

    if (req.user) {
      return publishedFilter
    }

    const publicFilter: Where = {
      and: [
        { isPrivate: { equals: false } },
        publishedFilter,
      ],
    }

    return publicFilter
  },
  readVersions: ({ req }) => canManageContent({ user: req.user }),
  update: ({ req }) => canManageContent({ user: req.user }),
  delete: ({ req }) => canManageContent({ user: req.user }),
}

export const travelCollectionVersions: CollectionConfig['versions'] = {
  drafts: {
    autosave: {
      interval: 2000,
    },
  },
  maxPerDoc: 30,
}

export function commonTravelFields(
  participantFieldName: 'members' | 'participants',
  endDateDescription?: string,
): Field[] {
  return [
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
      hooks: {
        beforeValidate: [({ value }) => normalizeTravelSlug(value)],
      },
      validate: validateTravelSlug,
      admin: {
        description:
          'Canonical travel identity. It must not collide with a slug in the other travel collection.',
      },
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
      index: true,
    },
    {
      name: 'endDate',
      type: 'date',
      required: true,
      index: true,
      admin: endDateDescription ? { description: endDateDescription } : undefined,
    },
    {
      name: 'summary',
      type: 'textarea',
      required: false,
      localized: true,
    },
    {
      name: 'coverImage',
      type: 'relationship',
      relationTo: 'media',
      required: false,
    },
    {
      name: participantFieldName,
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      required: false,
    },
    {
      name: 'guestParticipants',
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
  ]
}

export function sourceMetadataField(): Field {
  return {
    name: 'sourceMetadata',
    type: 'group',
    required: false,
    admin: {
      description:
        'Seed reconciliation metadata. Managed by the travel seed workflow; editors should not change it manually.',
      readOnly: true,
    },
    fields: [
      { name: 'sourceFile', type: 'text', required: false },
      { name: 'sourceHash', type: 'text', required: false },
      { name: 'parserVersion', type: 'text', required: false },
      { name: 'lastImportedAt', type: 'date', required: false },
      {
        name: 'baseProjection',
        type: 'json',
        required: false,
        admin: {
          description: 'Last accepted seed projection used as Base for three-way reconciliation.',
        },
      },
    ],
  }
}

export function normalizeTravelSlug(value: unknown): string | null | undefined {
  if (value === null || value === undefined) {
    return value
  }

  return typeof value === 'string' ? value.trim().toLowerCase() : undefined
}

export function validateTravelSlug(value: unknown): true | string {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
    ? true
    : 'Use lowercase letters, numbers, and single hyphens only.'
}

export function mediaItemsField(): Field {
  return {
    name: 'mediaItems',
    type: 'relationship',
    relationTo: 'media',
    hasMany: true,
    required: false,
  }
}

export function linksField(): Field {
  return {
    name: 'links',
    type: 'array',
    required: false,
    fields: [
      { name: 'label', type: 'text', required: false, localized: true },
      { name: 'url', type: 'text', required: true },
    ],
  }
}

export function validateUniqueAnchors(value: unknown): true | string {
  if (!Array.isArray(value)) {
    return true
  }

  const anchors = value.flatMap((item) => {
    if (typeof item !== 'object' || item === null || !('anchor' in item)) {
      return []
    }

    return typeof item.anchor === 'string' && item.anchor.trim() ? [item.anchor.trim()] : []
  })

  return new Set(anchors).size === anchors.length
    ? true
    : 'Section anchors must be unique within a travel document.'
}
