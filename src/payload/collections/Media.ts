import type { CollectionConfig, TextFieldSingleValidation } from 'payload'

const youtubeUrlPattern =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)[A-Za-z0-9_-]{6,}/

const validateYoutubeUrl: TextFieldSingleValidation = (value) => {
  if (!value) {
    return true
  }

  return youtubeUrlPattern.test(value) || 'Please enter a valid YouTube URL.'
}

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'altText',
    defaultColumns: ['altText', 'type', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
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
      name: 'relatedTravel',
      type: 'relationship',
      relationTo: 'travel-projects',
      required: false,
    },
  ],
  upload: {
    staticDir: 'media',
    filesRequiredOnCreate: false,
    mimeTypes: ['image/*'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 400,
        position: 'centre',
      },
      {
        name: 'medium',
        width: 800,
        height: 800,
        position: 'centre',
      },
      {
        name: 'large',
        width: 1600,
        height: 1200,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
  },
}
