import assert from 'node:assert/strict'
import { countOperation, findOperation } from 'payload'
import configPromise from '../payload.config'

// Exercise Payload's actual query pipeline without connecting to any database.
const config = await configPromise
const collections = Object.fromEntries(config.collections.map(collection => [collection.slug, { config: collection }]))
let databaseCalls = 0
const db = {
  find: async () => { databaseCalls++; throw new Error('DB_REACHED') },
  count: async () => { databaseCalls++; throw new Error('DB_REACHED') },
}
for (const user of [null, { role: 'family' }]) {
  const req = { user, locale: 'en', context: {}, payload: { config, collections, db }, t: (key: string) => key }
  for (const collection of ['travel-plans', 'travel-memories', 'travel-memory-days']) {
    const common = { collection: collections[collection], req, overrideAccess: false }
    const where = { 'sourceMetadata.baseProjection': { exists: true } }
    await assert.rejects(findOperation({ ...common, where } as never), { name: 'QueryError' })
    await assert.rejects(countOperation({ ...common, where } as never), { name: 'QueryError' })
    await assert.rejects(findOperation({ ...common, sort: 'sourceMetadata.sourceFile' } as never), { name: 'QueryError' })
  }
  const common = { collection: collections['travel-memory-days'], req, overrideAccess: false }
  await assert.rejects(findOperation({ ...common, where: { 'memory.sourceMetadata.baseProjection': { exists: true } } } as never), { name: 'QueryError' })
}
assert.equal(databaseCalls, 0, 'protected queries must be rejected before any database operation')
const req = { user: { role: 'admin' }, locale: 'en', context: {}, payload: { config, collections, db }, t: (key: string) => key }
await assert.rejects(findOperation({ collection: collections['travel-memories'], req, overrideAccess: false, where: { 'sourceMetadata.baseProjection': { exists: true } } } as never), /DB_REACHED/)
assert.equal(databaseCalls, 1, 'the same query remains available to an administrator')
console.log('Travel source metadata query guards PASS')
