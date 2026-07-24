import type { CollectionConfig } from 'payload'

import { canAccessAdmin, canManageContent } from '../access/is-admin'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'familyRole', 'profileVisibility', 'updatedAt'],
  },
  access: {
    admin: ({ req }) => canAccessAdmin({ user: req.user }),
    create: ({ req }) => canManageContent({ user: req.user }),
    read: ({ req }) => {
      if (req.user) {
        return true
      }

      return {
        profileVisibility: {
          equals: 'public',
        },
      }
    },
    update: ({ req }) => canManageContent({ user: req.user }),
    delete: ({ req }) => canManageContent({ user: req.user }),
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'family',
      options: [
        { label: 'Administrator', value: 'admin' },
        { label: 'Family member', value: 'family' },
      ],
    },
    {
      name: 'displayName',
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
      name: 'familyRole',
      type: 'select',
      required: true,
      options: [
        { label: 'Father', value: 'father' },
        { label: 'Mother', value: 'mother' },
        { label: 'Daughter', value: 'daughter' },
        { label: 'Son', value: 'son' },
        { label: 'Grandmother', value: 'grandmother' },
        { label: 'Family', value: 'family' },
      ],
    },
    {
      name: 'profileVisibility',
      type: 'select',
      required: true,
      defaultValue: 'public',
      options: [
        { label: 'Public', value: 'public' },
        { label: 'Family Only', value: 'family' },
      ],
    },
    {
      name: 'avatar',
      type: 'relationship',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'heroImage',
      type: 'relationship',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'cardImage',
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
      name: 'resumeMilestoneImages',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
      required: false,
    },
    {
      name: 'publicContact',
      type: 'group',
      admin: {
        description: 'Controls the public footer contact block on this member profile.',
      },
      fields: [
        {
          name: 'siteTitle',
          type: 'text',
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
          name: 'email',
          type: 'email',
          required: false,
        },
        {
          name: 'phone',
          type: 'text',
          required: false,
        },
      ],
    },
    {
      name: 'theme',
      type: 'group',
      fields: [
        {
          name: 'persona',
          type: 'select',
          required: true,
          defaultValue: 'neutral',
          options: [
            { label: 'Neutral Glass', value: 'neutral' },
            { label: 'Tavis Tech Blue', value: 'tavis' },
            { label: 'Lynn Morandi Warmth', value: 'lynn' },
            { label: 'Leo Geek Green', value: 'leo' },
            { label: 'Soft Academy', value: 'academy' },
            { label: 'Chinese Warmth', value: 'heritage' },
          ],
        },
        {
          name: 'primaryColor',
          type: 'text',
          required: false,
        },
        {
          name: 'accentColor',
          type: 'text',
          required: false,
        },
      ],
    },
    {
      name: 'status',
      type: 'text',
      required: false,
      localized: true,
    },
    {
      name: 'typewriter',
      type: 'group',
      fields: [
        {
          name: 'prefix',
          type: 'text',
          required: false,
          localized: true,
        },
        {
          name: 'rotatingWords',
          type: 'array',
          required: false,
          fields: [
            {
              name: 'word',
              type: 'text',
              required: true,
              localized: true,
            },
          ],
        },
        {
          name: 'suffix',
          type: 'text',
          required: false,
          localized: true,
        },
      ],
    },
    {
      name: 'bio',
      type: 'textarea',
      required: false,
      localized: true,
    },
    {
      name: 'beliefs',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
          localized: true,
        },
      ],
    },
    {
      name: 'interests',
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
          name: 'description',
          type: 'textarea',
          required: false,
          localized: true,
        },
      ],
    },
    {
      name: 'education',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'school',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'degree',
          type: 'text',
          required: false,
          localized: true,
        },
        {
          name: 'major',
          type: 'text',
          required: false,
          localized: true,
        },
        {
          name: 'year',
          type: 'text',
          required: false,
        },
      ],
    },
    {
      name: 'careerTimeline',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'organization',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'role',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'location',
          type: 'text',
          required: false,
          localized: true,
        },
        {
          name: 'start',
          type: 'text',
          required: false,
        },
        {
          name: 'end',
          type: 'text',
          required: false,
        },
        {
          name: 'summary',
          type: 'textarea',
          required: false,
          localized: true,
        },
        {
          name: 'milestoneMedia',
          type: 'relationship',
          relationTo: 'media',
          hasMany: true,
          required: false,
          admin: {
            description: 'Optional media shown for this career milestone. Leave empty to show no milestone media.',
          },
        },
        {
          name: 'highlights',
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
      name: 'professionalTimelineIntro',
      type: 'textarea',
      required: false,
      localized: true,
      admin: {
        description: 'Intro copy shown beside the Professional Timeline heading on the public member profile.',
      },
    },
    {
      name: 'skillRadar',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'skill',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'score',
          type: 'number',
          required: true,
          min: 0,
          max: 100,
        },
        {
          name: 'evidence',
          type: 'textarea',
          required: false,
          localized: true,
        },
      ],
    },
    {
      name: 'sourceDocIdentifier',
      type: 'text',
      required: false,
      admin: {
        description: 'Matches a file under content-source/profiles for future seed import.',
      },
    },
  ],
}
