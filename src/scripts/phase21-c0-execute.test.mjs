import test from 'node:test'
import assert from 'node:assert/strict'
import { executeC0 } from './phase21-c0-execute.mjs'

test('deadline closes a stalled connect once and prevents later work', async () => {
  let finishConnect
  let closes = 0
  let queries = 0
  let snapshots = 0
  const client = { connect: () => new Promise((resolve) => { finishConnect = resolve }),
    query: async () => { queries++; return { rows: [] } }, end: async () => { closes++ } }
  const evidence = { checkpoint: async () => {}, snapshot: async () => { snapshots++ } }
  await assert.rejects(executeC0(client, {}, {}, evidence, 10), /C0 deadline/)
  finishConnect()
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(closes, 1)
  assert.equal(queries, 0)
  assert.equal(snapshots, 0)
})
test('checkpoint failure prevents connection and still closes client', async () => {
  let connects = 0
  let closes = 0
  const client = { connect: async () => { connects++ }, end: async () => { closes++ } }
  await assert.rejects(executeC0(client, {}, {}, { checkpoint: async () => { throw new Error('disk unavailable') } }), /disk unavailable/)
  assert.equal(connects, 0)
  assert.equal(closes, 1)
})

test('cleanup failure cannot replace the original checkpoint failure', async () => {
  const client = { end: async () => { throw new Error('close failed') } }
  await assert.rejects(executeC0(client, {}, {}, { checkpoint: async () => { throw new Error('first failure') } }), /first failure/)
})
