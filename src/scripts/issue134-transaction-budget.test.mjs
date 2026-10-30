import assert from 'node:assert/strict'
import {EventEmitter} from 'node:events'
import test from 'node:test'
import {createIssue134PostgresIo} from './issue134-transaction-io.mjs'

class Client {
  constructor() { this.processID = 991; this.connection = new EventEmitter() }
  query(input, callback) {
    const command = (typeof input === 'string' ? input : input.text).split(' ')[0]
    this.connection.emit('message', { name: 'commandComplete', text: command, length: 12 })
    this.connection.emit('message', { name: 'readyForQuery', length: 5 })
    const result = { rows: [] }
    if (callback) return callback(null, result)
    return Promise.resolve(result)
  }
}

test('work deadline reserves observed ROLLBACK and read-back within the same hard deadline', async () => {
  let workExpired = false, hardExpired = false
  const io = createIssue134PostgresIo({ Client, counters: { queries: 0, roundTrips: 0 },
    limits: { queryBudget: 10, roundTripBudget: 10, rowCap: 20, responseByteCap: 65536 },
    recoveryReserve: { queries: 3, roundTrips: 3 }, getStage: () => 'fresh-state-admission',
    guard: () => { assert(!workExpired, 'work deadline') },
    recoveryGuard: () => { assert(!hardExpired, 'hard deadline') } })
  try {
    const client = new Client()
    await client.query('BEGIN')
    workExpired = true
    assert.throws(() => client.query('SELECT 1'), /work deadline/)
    await client.query('ROLLBACK')
    assert.equal(io.snapshotFor(client).transactionControls.rollback.confirmed, 1)
    await io.withRecoveryReadback(client, () => client.query('SELECT 1'))
    assert.equal(io.snapshot().budget.recoveryQueriesUsed, 2)
    hardExpired = true
    await assert.rejects(io.withRecoveryReadback(client, () => client.query('SELECT 1')), /hard deadline/)
    await assert.rejects(io.withRecoveryReadback(client, () => client.query('UPDATE forbidden')), /SELECT only/)
  } finally { io.restore() }
})

test('callback queries deliver a post-response guard failure through the callback', async () => {
  let checks = 0, received
  const io = createIssue134PostgresIo({ Client, counters: { queries: 0, roundTrips: 0 },
    limits: { queryBudget: 10, roundTripBudget: 10, rowCap: 20, responseByteCap: 65536 },
    getStage: () => 'fresh-state-admission', guard: () => { if (++checks > 1) throw new Error('deadline') } })
  try {
    assert.doesNotThrow(() => new Client().query('SELECT 1', (error) => { received = error }))
    assert.equal(received.message, 'deadline')
  } finally { io.restore() }
})
