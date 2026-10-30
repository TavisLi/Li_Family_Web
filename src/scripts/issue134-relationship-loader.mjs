import { getDataLoader } from 'payload'

// Keep Payload's cache keys, access rules and population behavior. Dispatch only
// bounded groups to fresh Payload loaders so separate groups cannot coalesce.
export function installIssue134BoundedRelationshipLoader(req) {
  const original = req.payloadDataLoader
  const DataLoader = original.constructor
  const bounded = new DataLoader(async keys => {
    const values = []
    for (let offset = 0; offset < keys.length;) {
      // Rich parent documents use the same conservative page size as explicit reads.
      const size = keys.slice(offset, offset + 20).every(key => JSON.parse(key)[1] === 'media') ? 20 : 3
      const batch = keys.slice(offset, offset + size)
      const rows = await getDataLoader(req).loadMany(batch)
      const error = rows.find(row => row instanceof Error)
      if (error) throw error
      if (rows.length !== batch.length) throw new Error('BLOCK: incomplete relationship loader batch')
      values.push(...rows)
      offset += batch.length
    }
    return values
  })
  bounded.find = original.find
  req.payloadDataLoader = bounded
}
