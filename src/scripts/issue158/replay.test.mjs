import assert from 'node:assert/strict'
import test from 'node:test'

import { validateTarget } from './replay.mjs'

test('replay accepts only PostgreSQL Unix socket or loopback targets and the default service database', () => {
  assert.equal(validateTarget({ host: '/private/tmp/pg.sock', port: 5432, user: 'postgres', database: 'postgres' }).transport,
    'unix-socket')
  assert.equal(validateTarget({ host: '127.0.0.1', port: '55444', user: 'postgres', database: 'postgres', ciService: true }).transport,
    'ci-loopback')
  assert.throws(() => validateTarget({ host: '127.0.0.1', port: 55444, user: 'postgres', database: 'postgres' }), /CI service/)
  for (const target of [
    { host: 'db.example.com', port: 5432, user: 'postgres', database: 'postgres' },
    { host: '127.0.0.1', port: 5432, user: 'postgres', database: 'production' },
    { host: '127.0.0.1', port: 5432, user: 'bad/user', database: 'postgres' },
  ]) assert.throws(() => validateTarget(target), /BLOCK:/)
})

test('CI service peer representations accept IPv4-mapped loopback while rejecting remote addresses', () => {
  assert.equal(validateTarget({ host: '127.0.0.1', port: 55444, user: 'postgres', database: 'postgres', ciService: true }).transport,
    'ci-loopback')
  assert.throws(() => validateTarget({ host: '10.0.0.2', port: 55444, user: 'postgres', database: 'postgres', ciService: true }), /loopback/)
})
