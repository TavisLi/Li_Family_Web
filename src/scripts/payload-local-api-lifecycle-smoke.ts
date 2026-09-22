import assert from 'node:assert/strict'
import { getPayload } from 'payload'

import config from '../payload/payload.config'

function assertDisposableLocalDatabase(databaseUri: string | undefined) {
  assert.equal(
    process.env.NODE_ENV,
    'production',
    'The lifecycle smoke test uses production mode to prevent generated-file writes.',
  )
  assert.equal(
    process.env.PAYLOAD_LIFECYCLE_SMOKE_LOCAL_DATABASE,
    'true',
    'Set PAYLOAD_LIFECYCLE_SMOKE_LOCAL_DATABASE=true only for a disposable local database.',
  )
  assert.equal(
    process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH,
    'false',
    'The lifecycle smoke test must not push schema changes.',
  )

  const hostname = new URL(databaseUri ?? '').hostname
  assert(
    ['127.0.0.1', '::1', 'localhost'].includes(hostname),
    `The lifecycle smoke test only accepts a local database, received ${hostname || 'no hostname'}.`,
  )
}

assertDisposableLocalDatabase(process.env.DATABASE_URI)

const payload = await getPayload({ config })
const pool = payload.db.pool

try {
  assert.equal(
    pool.totalCount - pool.idleCount,
    0,
    'Payload initialization must return its PostgreSQL connectivity-check client to the pool.',
  )

  const result = await payload.find({
    collection: 'users',
    limit: 1,
    overrideAccess: false,
  })
  assert(Array.isArray(result.docs))
} finally {
  // Payload owns its internal lifecycle state. This short-lived smoke command owns
  // the process-scoped pool and closes it after Payload cleanup has completed.
  try {
    await payload.destroy()
  } finally {
    await pool.end()
  }
}

assert.equal(pool.ended, true)
assert.equal(pool.totalCount, 0)

console.log(
  JSON.stringify({
    localApi: 'PASS',
    node: process.version,
    payloadCleanup: 'PASS',
    poolCleanup: 'PASS',
  }),
)
