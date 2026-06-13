import type { User } from '@/payload/payload-types'
import { getPayloadClient } from './payload'

const DEFAULT_LIMIT = 20

export async function getMembers(limit = DEFAULT_LIMIT): Promise<User[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'users',
    depth: 1,
    limit,
    overrideAccess: false,
    sort: 'createdAt',
  })

  return result.docs
}

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
