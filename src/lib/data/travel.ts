import type { TravelProject } from '@/payload/payload-types'
import { getPayloadClient } from './payload'

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
