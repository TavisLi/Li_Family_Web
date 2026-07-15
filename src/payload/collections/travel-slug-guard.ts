import {
  APIError,
  type CollectionAfterChangeHook,
  type CollectionBeforeDeleteHook,
  type CollectionBeforeValidateHook,
} from 'payload'

type TravelCollectionSlug = 'travel-memories' | 'travel-plans'

/**
 * PostgreSQL can enforce uniqueness inside each collection table. This hook
 * closes the application-level gap between the two independent tables.
 */
export function preventCrossTravelSlugCollision(
  otherCollection: TravelCollectionSlug,
): CollectionBeforeValidateHook {
  return async ({ data, originalDoc, req }) => {
    const candidate = data?.slug ?? originalDoc?.slug

    if (typeof candidate !== 'string' || !candidate.trim()) {
      return data
    }

    const collision = await req.payload.find({
      collection: otherCollection,
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req,
      where: {
        slug: {
          equals: candidate.trim(),
        },
      },
    })

    if (collision.totalDocs > 0) {
      throw new APIError(
        `Travel slug "${candidate.trim()}" is already owned by ${otherCollection}.`,
        400,
      )
    }

    return data
  }
}

export function syncTravelRouteIdentity(
  collection: TravelCollectionSlug,
): CollectionAfterChangeHook {
  return async ({ doc, req }) => {
    const id = documentId(doc)
    const slug = documentSlug(doc)

    if (id === null || slug === null) {
      return doc
    }

    const ownerKey = `${collection}:${id}`
    const existing = await req.payload.find({
      collection: 'travel-route-identities',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req,
      where: { ownerKey: { equals: ownerKey } },
    })
    const owner =
      collection === 'travel-plans'
        ? { relationTo: 'travel-plans' as const, value: id }
        : { relationTo: 'travel-memories' as const, value: id }
    const data = {
      owner,
      ownerKey,
      slug,
    }

    if (existing.docs[0]) {
      await req.payload.update({
        id: existing.docs[0].id,
        collection: 'travel-route-identities',
        data,
        overrideAccess: true,
        req,
      })
    } else {
      await req.payload.create({
        collection: 'travel-route-identities',
        data,
        overrideAccess: true,
        req,
      })
    }

    return doc
  }
}

export function removeTravelRouteIdentity(
  collection: TravelCollectionSlug,
): CollectionBeforeDeleteHook {
  return async ({ id, req }) => {
    await req.payload.delete({
      collection: 'travel-route-identities',
      overrideAccess: true,
      req,
      where: {
        ownerKey: {
          equals: `${collection}:${id}`,
        },
      },
    })
  }
}

function documentId(doc: unknown): number | null {
  if (typeof doc !== 'object' || doc === null || !('id' in doc)) {
    return null
  }

  return typeof doc.id === 'number' ? doc.id : null
}

function documentSlug(doc: unknown): string | null {
  if (typeof doc !== 'object' || doc === null || !('slug' in doc)) {
    return null
  }

  return typeof doc.slug === 'string' ? doc.slug : null
}
