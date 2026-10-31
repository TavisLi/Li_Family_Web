import assert from 'node:assert/strict'
import { sql } from '@payloadcms/db-postgres'
import { lockTravelGeoRequest, lockTravelGeoWrites } from './travel-geo-lock'

let fallbackCalls = 0
const noTransaction = {
  payload: { db: {
    sessions: {},
    drizzle: { execute: async () => { fallbackCalls++ } },
  } },
}

for (const operation of ['read', 'count', 'countVersions', 'readDistinct']) {
  const args = { req: noTransaction }
  assert.equal(await lockTravelGeoWrites({ args, operation } as never), args)
}
assert.equal(fallbackCalls, 0, 'reads must not use a transaction or fallback connection')

await assert.rejects(() => lockTravelGeoRequest(noTransaction as never), /active transaction/)
await assert.rejects(() => lockTravelGeoRequest({
  ...noTransaction, transactionID: 'expired',
} as never), /active transaction/)
for (const operation of ['create', 'update', 'delete', 'restoreVersion']) {
  await assert.rejects(() => Promise.resolve(lockTravelGeoWrites({
    args: { req: noTransaction }, operation, overrideAccess: true,
  } as never)), /active transaction/)
}
assert.equal(fallbackCalls, 0, 'writes without an active transaction must never fall back')

for (const result of [
  { rows: [{ locked: false, isolation: 'read committed' }] },
  { rows: [{ locked: null, isolation: 'read committed' }] },
  { rows: [{ isolation: 'read committed' }] },
  { rows: [{ locked: true, isolation: 'repeatable read' }] },
  { rows: [{ locked: true, isolation: 'serializable' }] },
  { rows: [{ locked: true }] },
  { rows: [] }, {}, null, undefined,
]) {
  let attempts = 0
  await assert.rejects(() => lockTravelGeoRequest({
    transactionID: 'tx', payload: { db: {
      sessions: { tx: { db: { execute: async () => { attempts++; return result } } } },
      drizzle: { execute: async () => { fallbackCalls++ } },
    } },
  } as never), /conflict/i)
  assert.equal(attempts, 1, 'busy, unknown or unsupported isolation rejects without retry')
}
assert.equal(fallbackCalls, 0)

for (const slug of ['travel-plans', 'travel-memories', 'travel-memory-days']) {
  for (const operation of ['create', 'update', 'delete', 'restoreVersion']) {
    const statements: unknown[] = []
    const req = {
      transactionID: Promise.resolve('travel-transaction'),
      payload: { db: {
        sessions: { 'travel-transaction': { db: {
          execute: async (statement: unknown) => { statements.push(statement); return { rows: [{ locked: true, isolation: 'read committed' }] } },
        } } },
        drizzle: { execute: async () => { fallbackCalls++ } },
      } },
    }
    const args = { req, collection: { config: { slug } } }
    assert.equal(await lockTravelGeoWrites({ args, operation } as never), args)
    assert.deepEqual(statements, [sql`select pg_try_advisory_xact_lock(180, 1) as locked, current_setting('transaction_isolation') as isolation`])
  }
}
assert.equal(fallbackCalls, 0)

const lockFailure = new Error('synthetic lock failure')
await assert.rejects(() => lockTravelGeoRequest({
  transactionID: 'tx', payload: { db: { sessions: { tx: { db: {
    execute: async () => { throw lockFailure },
  } } } } },
} as never), error => error === lockFailure)

console.log('Travel geo transaction lock tests PASS (synthetic transaction boundary)')
