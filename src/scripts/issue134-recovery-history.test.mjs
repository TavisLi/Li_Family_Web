import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import test from 'node:test'
import { createIssue134PostgresIo } from './issue134-transaction-io.mjs'
import { issue134HistorySummaryQuery } from './issue134-additive-history.mjs'

test('real I/O wrapper admits only the exact parameterized history CTE after confirmed rollback', async () => {
  class Client {
    constructor() { this.connection = new EventEmitter(); this.connection._send = () => {}; this.processID = 5300 }
    async query(config) {
      const text = typeof config === 'string' ? config : config.text
      const command = /^(BEGIN|ROLLBACK)$/.exec(text)?.[1] ?? 'SELECT'
      this.connection._send(Buffer.from(text))
      this.connection.emit('message', { name: 'commandComplete', text: command, length: 10 })
      this.connection.emit('message', { name: 'readyForQuery', length: 5 })
      return { rows: [] }
    }
  }
  const counters = { queries: 0, roundTrips: 0, requestBytes: 0, responseBytes: 0 }
  const io = createIssue134PostgresIo({ Client, counters,
    limits: { rowCap: 20, responseByteCap: 65536, queryBudget: 30, roundTripBudget: 30 },
    guard() {}, getStage: () => 'recovery-integration' })
  try {
    const client = new Client()
    await client.query('BEGIN'); await client.query('ROLLBACK')
    const expected = { text: issue134HistorySummaryQuery('_travel_memory_days_v'), values: [[1, 2], 25001] }
    for (const table of ['_travel_memory_days_v', '_travel_memory_days_v_locales',
      '_travel_memory_days_v_version_moments', '_travel_memory_days_v_version_moments_locales',
      '_travel_memory_days_v_version_moments_placements', '_travel_memory_days_v_version_moments_placements_locales']) {
      await io.withRecoveryReadback(client, () => client.query({ ...expected, text: issue134HistorySummaryQuery(table) }))
    }
    const before = io.snapshot().queries
    for (const query of [
      { ...expected, text: expected.text + '; DELETE FROM public.travel_memory_days' },
      { ...expected, text: expected.text.replace('SELECT count(*)', 'SELECT pg_sleep(1), count(*)') },
      { ...expected, values: [[1, 1], 25001] }, { ...expected, values: [[1], 25002] },
      { ...expected, values: [['1;DELETE'], 25001] },
      { text: 'WITH x AS (DELETE FROM public.travel_memory_days RETURNING *) SELECT * FROM x' },
      { text: 'WITH x AS (SELECT 1) SELECT * FROM x' },
      { text: 'SELECT 1; DELETE FROM public.travel_memory_days' }, { text: 'UPDATE public.travel_memory_days SET day=1' },
    ]) await assert.rejects(io.withRecoveryReadback(client, () => client.query(query)),
      { code: 'RECOVERY_QUERY_NOT_READ_ONLY' })
    assert.equal(io.snapshot().queries, before, 'rejected recovery SQL must not be dispatched')
  } finally { io.restore() }
})
