import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

export const c0ProductionTarget = Object.freeze({ hostHash: '3ad9f1768815', database: '/postgres' })

// Does not connect. Target override is for synthetic tests; CLI must use the
// exported production target and never accept a target from user CLI arguments.
export function c0ConnectionOptions(env, target = c0ProductionTarget) {
  assert.equal(env.NODE_ENV, 'production', 'BLOCK: NODE_ENV')
  assert.equal(env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH, 'false', 'BLOCK: schema push')
  let url
  try { url = new URL(env.DATABASE_URI) } catch { throw new Error('BLOCK: database URL') }
  assert(['postgres:', 'postgresql:'].includes(url.protocol), 'BLOCK: database protocol')
  assert.equal(createHash('sha256').update(url.hostname).digest('hex').slice(0, 12), target.hostHash, 'BLOCK: database host')
  assert.equal(url.pathname, target.database, 'BLOCK: database name')
  assert(url.username && url.password && !url.hash, 'BLOCK: database credentials or fragment')
  assert(!url.searchParams.has('options'), 'BLOCK: inherited connection options')
  // Alternate host/db/user parameters could override the audited URL authority.
  for (const key of url.searchParams.keys()) assert(['sslmode', 'ssl', 'channel_binding', 'pgbouncer'].includes(key), 'BLOCK: unexpected connection parameter')
  // Defense in depth only: the Production pooler does not preserve these as
  // session defaults. Every executor must still use READ ONLY and SET LOCAL.
  url.searchParams.set('options', '-c default_transaction_read_only=on -c statement_timeout=15000')
  return { connectionString: url.toString(), connectionTimeoutMillis: 10000, query_timeout: 20000,
    application_name: 'phase21-c0-readonly' }
}
