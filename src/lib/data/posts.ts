import type { Post } from '@/payload/payload-types'
import { getPayloadClient } from './payload'

const DEFAULT_LIMIT = 6

export async function getLatestPosts(limit = DEFAULT_LIMIT): Promise<Post[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'posts',
    depth: 1,
    limit,
    overrideAccess: false,
    sort: '-publishedDate',
  })

  return result.docs
}
