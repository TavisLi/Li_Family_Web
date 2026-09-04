import { randomUUID } from 'node:crypto'

import type { CollectionBeforeValidateHook, CollectionConfig, Where } from 'payload'

import { canManageContent } from '../access/is-admin'
import { sourceMetadataField, travelCollectionVersions } from './travel-shared-fields'

const dayKeyPattern = /^day-(0[1-9]|[1-9][0-9])$/

const setDayIdentity: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  const memory = relationshipId(data?.memory ?? originalDoc?.memory)
  const dayKey = normalizeDayKey(data?.dayKey ?? originalDoc?.dayKey)

  if (!memory || !dayKey) return withGeneratedTravelMemoryKeys(data)

  return withGeneratedTravelMemoryKeys({
    ...data,
    dayIdentity: `${memory}:${dayKey}`,
    dayKey,
  })
}

export const TravelMemoryDays: CollectionConfig = {
  slug: 'travel-memory-days',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'memory', 'dayKey', 'date', '_status'],
    description: 'Independently editable daily chapters owned by one Travel Memory.',
  },
  access: {
    create: ({ req }) => canManageContent({ user: req.user }),
    read: ({ req }) => {
      if (canManageContent({ user: req.user })) return true

      const published: Where[] = [
        { _status: { equals: 'published' } },
        { 'memory._status': { equals: 'published' } },
      ]

      if (!req.user) {
        published.push({ 'memory.isPrivate': { equals: false } })
      }

      return { and: published }
    },
    readVersions: ({ req }) => canManageContent({ user: req.user }),
    update: ({ req }) => canManageContent({ user: req.user }),
    delete: ({ req }) => canManageContent({ user: req.user }),
  },
  hooks: {
    beforeValidate: [setDayIdentity],
  },
  versions: travelCollectionVersions,
  fields: [
    {
      name: 'memory',
      type: 'relationship',
      relationTo: 'travel-memories',
      required: true,
    },
    {
      name: 'dayIdentity',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { hidden: true, readOnly: true },
    },
    {
      name: 'dayKey',
      type: 'text',
      required: true,
      index: true,
      hooks: {
        beforeValidate: [({ value }) => normalizeDayKey(value)],
      },
      validate: (value: unknown) =>
        typeof value === 'string' && dayKeyPattern.test(value)
          ? true
          : 'Use day-01 style stable day keys.',
    },
    { name: 'day', type: 'number', required: true, min: 1 },
    { name: 'date', type: 'date', required: false, index: true },
    { name: 'dateLabel', type: 'text', required: false, localized: true },
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'theme', type: 'text', required: false, localized: true },
    { name: 'story', type: 'textarea', required: false, localized: true },
    {
      name: 'moments',
      type: 'array',
      required: false,
      validate: uniqueKey('momentKey', 'Moment keys must be unique within a day.'),
      fields: [
        {
          name: 'momentKey',
          type: 'text',
          required: true,
          admin: {
            description: 'Stable identity generated automatically for Admin-created moments.',
            readOnly: true,
          },
        },
        { name: 'time', type: 'text', required: false },
        { name: 'location', type: 'text', required: false, localized: true },
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'body', type: 'textarea', required: false, localized: true },
        { name: 'transport', type: 'text', required: false, localized: true },
        {
          name: 'placements',
          type: 'array',
          required: false,
          validate: uniqueKey(
            'placementKey',
            'Placement keys must be unique within a moment.',
          ),
          fields: [
            {
              name: 'placementKey',
              type: 'text',
              required: true,
              admin: {
                description:
                  'Stable usage identity generated automatically for Admin-created placements.',
                readOnly: true,
              },
            },
            {
              name: 'type',
              type: 'select',
              required: true,
              options: [
                { label: 'Photo', value: 'photo' },
                { label: 'YouTube', value: 'youtube' },
              ],
            },
            {
              name: 'role',
              type: 'select',
              required: false,
              defaultValue: 'inline',
              options: [
                { label: 'Hero', value: 'hero' },
                { label: 'Inline', value: 'inline' },
                { label: 'Gallery', value: 'gallery' },
              ],
            },
            { name: 'media', type: 'relationship', relationTo: 'media', required: false },
            { name: 'youtubeUrl', type: 'text', required: false },
            { name: 'caption', type: 'textarea', required: false, localized: true },
          ],
        },
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
    sourceMetadataField(),
  ],
}

export function withGeneratedTravelMemoryKeys<T>(value: T): T {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  const data = value as Record<string, unknown>
  if (!Array.isArray(data.moments)) return value

  return {
    ...data,
    moments: data.moments.map((candidate) => {
      if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
        return candidate
      }
      const moment = candidate as Record<string, unknown>
      return {
        ...moment,
        momentKey: stableKey(moment.momentKey, 'moment'),
        ...(Array.isArray(moment.placements)
          ? {
              placements: moment.placements.map((placementCandidate) => {
                if (
                  !placementCandidate ||
                  typeof placementCandidate !== 'object' ||
                  Array.isArray(placementCandidate)
                ) return placementCandidate
                const placement = placementCandidate as Record<string, unknown>
                return {
                  ...placement,
                  placementKey: stableKey(placement.placementKey, 'placement'),
                }
              }),
            }
          : {}),
      }
    }),
  } as T
}

function stableKey(value: unknown, prefix: 'moment' | 'placement'): string {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : `${prefix}:${randomUUID()}`
}

function normalizeDayKey(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return value
  return typeof value === 'string' ? value.trim().toLowerCase() : undefined
}

function relationshipId(value: unknown): string | number | null {
  if (typeof value === 'string' || typeof value === 'number') return value
  if (typeof value === 'object' && value && 'id' in value) {
    const id = value.id
    return typeof id === 'string' || typeof id === 'number' ? id : null
  }
  return null
}

function uniqueKey(key: string, message: string) {
  return (value: unknown): true | string => {
    if (!Array.isArray(value)) return true
    const keys = value.flatMap((item) => {
      if (typeof item !== 'object' || item === null || !(key in item)) return []
      const candidate = item[key]
      return typeof candidate === 'string' && candidate.trim() ? [candidate.trim()] : []
    })
    return new Set(keys).size === keys.length ? true : message
  }
}
