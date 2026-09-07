import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { c0ConnectionOptions } from './phase21-c0-connection.mjs'
const target = { hostHash: createHash('sha256').update('synthetic.invalid').digest('hex').slice(0,12), database: '/synthetic' }
const env = { NODE_ENV: 'production', PAYLOAD_ENABLE_DEV_SCHEMA_PUSH: 'false', DATABASE_URI: 'postgresql://synthetic:synthetic@synthetic.invalid/synthetic' }
test('locks read-only and query/connection timeouts without connecting', () => {
  const options = c0ConnectionOptions(env, target)
  assert.equal(new URL(options.connectionString).searchParams.get('options'), '-c default_transaction_read_only=on -c statement_timeout=15000')
  assert.equal(options.connectionTimeoutMillis, 10000)
  assert.equal(options.query_timeout, 20000)
})
test('preserves existing pgbouncer routing without accepting target overrides', () => {
  const options = c0ConnectionOptions({ ...env, DATABASE_URI: env.DATABASE_URI + '?pgbouncer=true' }, target)
  assert.equal(new URL(options.connectionString).searchParams.get('pgbouncer'), 'true')
})
test('rejects schema push and alternate target parameters', () => {
  assert.throws(() => c0ConnectionOptions({ ...env, PAYLOAD_ENABLE_DEV_SCHEMA_PUSH: 'true' },target), /schema push/)
  for (const suffix of ['?host=elsewhere','?options=unsafe','?database=elsewhere']) {
    assert.throws(() => c0ConnectionOptions({ ...env,DATABASE_URI: env.DATABASE_URI+suffix },target), /BLOCK/)
  }
  assert.throws(() => c0ConnectionOptions(env), /database host/)
})
