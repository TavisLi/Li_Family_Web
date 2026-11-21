import type { CollectionConfig, TextFieldSingleValidation } from 'payload'

import { canManageContent } from '../access/is-admin'
import { isFamilyAssetKey, photoSizes, projectFamilyMediaUrls, protectFamilyMediaStorage } from '../family-media'

const youtubeUrlPattern =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)[A-Za-z0-9_-]{6,}/

const validateYoutubeUrl: TextFieldSingleValidation = (value) => {
  if (!value) {
    return true
  }

  return youtubeUrlPattern.test(value) || 'Please enter a valid YouTube URL.'
}

const validateFamilyAssetKey: TextFieldSingleValidation = (value) =>
  value == null || isFamilyAssetKey(value) || 'Invalid family photo identity'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'altText',
    defaultColumns: ['altText', 'type', 'updatedAt'],
  },
  access: {
    create: ({ req }) => canManageContent({ user: req.user }),
    read: ({ req }) => req.user ? true : { familyAssetKey: { exists: false } },
    update: ({ req }) => canManageContent({ user: req.user }),
    delete: ({ req }) => canManageContent({ user: req.user }),
  },
  hooks: {
    beforeValidate: [protectFamilyMediaStorage],
    afterRead: [projectFamilyMediaUrls],
  },
  fields: [
    {
      name: 'familyAssetKey',
      type: 'text',
      unique: true,
      admin: { hidden: true },
      validate: validateFamilyAssetKey,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'photo',
      options: [
        { label: 'Photo', value: 'photo' },
        { label: 'YouTube Video', value: 'video' },
      ],
    },
    {
      name: 'youtubeUrl',
      type: 'text',
      required: false,
      admin: {
        condition: (_, siblingData) => siblingData.type === 'video',
      },
      validate: validateYoutubeUrl,
    },
    {
      name: 'altText',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'sourcePath',
      type: 'text',
      required: false,
      unique: true,
      index: true,
      admin: {
        description:
          'Relative content-source path used only for idempotent seed imports. Admin users can replace the uploaded file later.',
      },
    },
    {
      name: 'tags',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
          localized: true,
        },
      ],
    },
    {
      name: 'relatedMembers',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      required: false,
    },
    {
      name: 'relatedTravelRecord',
      type: 'relationship',
      relationTo: ['travel-plans', 'travel-memories'],
      required: false,
    },
  ],
  upload: {
    staticDir: 'media',
    filesRequiredOnCreate: false,
    mimeTypes: ['image/*'],
    imageSizes: photoSizes.map(size => ({ ...size })),
    adminThumbnail: 'thumbnail',
  },
}
