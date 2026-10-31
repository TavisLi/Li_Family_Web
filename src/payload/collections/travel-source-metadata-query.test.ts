import assert from 'node:assert/strict'
import { countOperation, findOperation, findVersionsOperation } from 'payload'
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
  for (const [collection, paths] of [
    ['travel-plans', ['planningSections.geoStops', 'planningSections.geoStops.geo.latitude', 'planningSections.geoStops.geo.approval.snapshot', 'geoAccessRevision']],
    ['travel-memory-days', ['moments.geo.name', 'moments.geo.latitude', 'moments.geo.approval.snapshot', 'geoAccessRevision']],
  ] as const) {
    for (const path of paths) {
      const common = { collection: collections[collection], req, overrideAccess: false }
      await assert.rejects(findOperation({ ...common, where: { [path]: { exists: true } } } as never), { name: 'QueryError' })
      await assert.rejects(countOperation({ ...common, where: { [path]: { exists: true } } } as never), { name: 'QueryError' })
      await assert.rejects(findOperation({ ...common, sort: path } as never), { name: 'QueryError' })
    }
  }
  for (const collection of ['travel-plans', 'travel-memories', 'travel-memory-days']) {
    await assert.rejects(findVersionsOperation({ collection: collections[collection], req, overrideAccess: false } as never), { name: 'Forbidden' })
  }
  const common = { collection: collections['travel-memory-days'], req, overrideAccess: false }
  await assert.rejects(findOperation({ ...common, where: { 'memory.sourceMetadata.baseProjection': { exists: true } } } as never), { name: 'QueryError' })
}
assert.equal(databaseCalls, 0, 'protected queries must be rejected before any database operation')
const req = { user: { role: 'admin' }, locale: 'en', context: {}, payload: { config, collections, db }, t: (key: string) => key }
await assert.rejects(findOperation({ collection: collections['travel-memories'], req, overrideAccess: false, where: { 'sourceMetadata.baseProjection': { exists: true } } } as never), /DB_REACHED/)
assert.equal(databaseCalls, 1, 'the same query remains available to an administrator')
console.log('Travel source metadata query guards PASS')

// Real Payload response-field traversal over a synthetic database result. This
// does not claim HTTP/GraphQL or database-policy verification.
for (const user of [null, { role: 'family' }]) {
  for (const collection of ['travel-plans', 'travel-memories', 'travel-memory-days']) {
    const responses: unknown[] = []
    for (const hidden of [10, 80]) {
      const raw = { id: 1, _status: 'published', isPrivate: false, title: { en: 'Visible' },
        geoAccessRevision: `private-${hidden}`, sourceMetadata: { baseProjection: { latitude: hidden } },
        ...(collection === 'travel-plans' ? { planningSections: [{ id: 'section', anchor: 's', title: { en: 'Visible' }, body: { en: 'Text' }, geoStops: [{ stopKey: `secret-${hidden}`, geo: { name: { en: 'Hidden' }, latitude: hidden, longitude: hidden, approval: { snapshot: `private-${hidden}` } } }] }] } : {}),
        ...(collection === 'travel-memory-days' ? { memory: 1, dayKey: 'day-01', dayIdentity: '1:day-01', moments: [{ id: 'moment', momentKey: 'm', title: { en: 'Visible' }, geo: { name: { en: 'Hidden' }, latitude: hidden, longitude: hidden, approval: { snapshot: `private-${hidden}` } } }] } : {}),
      }
      const db = { find: async () => ({ docs: [structuredClone(raw)], hasNextPage: false, hasPrevPage: false, limit: 10, nextPage: null, page: 1, pagingCounter: 1, prevPage: null, totalDocs: 1, totalPages: 1 }) }
      const req = { user, locale: 'en', context: {}, payload: { config, collections, db }, t: (key: string) => key }
      responses.push(await findOperation({ collection: collections[collection], req, overrideAccess: false, depth: 0 } as never))
    }
    assert.deepEqual(responses[0], responses[1], 'hidden geo/Base changes cannot alter the non-Admin response')
    const json = JSON.stringify(responses[0])
    assert.ok(!/private-|Hidden|secret-|baseProjection|"latitude"|"snapshot"/.test(json), json)
  }
}
console.log('Payload synthetic response traversal masks all geo/Base copies PASS')
