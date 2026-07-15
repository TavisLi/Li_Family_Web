import type { CollectionConfig } from 'payload'

export const TravelRouteIdentities: CollectionConfig = {
  slug: 'travel-route-identities',
  admin: {
    hidden: true,
    useAsTitle: 'slug',
    description: 'Internal registry enforcing one canonical route owner across travel collections.',
  },
  access: {
    create: () => false,
    read: () => false,
    update: () => false,
    delete: () => false,
  },
  lockDocuments: false,
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'ownerKey',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: ['travel-plans', 'travel-memories'],
      required: true,
      index: true,
    },
  ],
}
