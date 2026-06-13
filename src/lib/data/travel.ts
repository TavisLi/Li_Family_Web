import type { TravelProject } from '@/payload/payload-types'
import { getPayloadClient } from './payload'

const DEFAULT_LIMIT = 6

export async function getFeaturedTravelProjects(limit = DEFAULT_LIMIT): Promise<TravelProject[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'travel-projects',
    depth: 1,
    limit,
    overrideAccess: false,
    sort: '-startDate',
  })

  return result.docs
}

export async function getTravelProjectBySlug(slug: string): Promise<TravelProject | null> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'travel-projects',
    depth: 1,
    limit: 1,
    overrideAccess: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs[0] ?? null
}
