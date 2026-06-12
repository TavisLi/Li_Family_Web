import type { User } from '@/payload/payload-types'
import { getPayloadClient } from './payload'

export async function getMemberBySlug(slug: string): Promise<User | null> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'users',
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
