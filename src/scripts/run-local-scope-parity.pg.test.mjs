import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

import { scopeParity } from './run-local-scope-parity.mjs'

const enabled = process.env.ISSUE105_PG_REHEARSAL === '1'
const url = enabled ? new URL(process.env.DATABASE_URI ?? '') : null
if (enabled) {
  assert.equal(url.hostname, '127.0.0.1')
  assert.equal(url.port, '55444')
  assert.equal(url.pathname, '/issue105')
  assert.equal(process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH, 'false')
}

test('independent full scans retain optimized protection scope across drift', { skip: !enabled }, async (t) => {
  const require = createRequire(import.meta.resolve('@payloadcms/db-postgres'))
  const { Client } = require('pg')
  const client = new Client({ connectionString: url.toString() })
  await client.connect()
  const baseline = await scopeParity(client)
  assert.deepEqual(baseline.rowCounts, { targetRows: 4, protectedRows: 3, canonicalRows: 2, legacyRows: 2 })
  const change = async (name, setup, cleanup, verify) => t.test(name, async () => {
    await client.query(setup)
    try { await verify(await scopeParity(client)) }
    finally { await client.query(cleanup) }
  })
  try {
    await change('new target outside backup',
      "INSERT INTO travel_memories_rels VALUES (999,1,'itineraryImages',999)",
      'DELETE FROM travel_memories_rels WHERE id=999',
      (report) => assert.equal(report.rowCounts.targetRows, 5))
    await change('path moved from target into protected scope',
      "UPDATE travel_memories_rels SET path='galleryImages' WHERE id=101",
      "UPDATE travel_memories_rels SET path='itineraryImages' WHERE id=101",
      (report) => assert.deepEqual([report.rowCounts.targetRows, report.rowCounts.protectedRows], [3, 4]))
    await change('non-target content changed',
      "UPDATE travel_memories_rels SET path='otherProtectedPath' WHERE id=103",
      "UPDATE travel_memories_rels SET path='galleryImages' WHERE id=103",
      (report) => assert.notEqual(report.rowHashes.protectedRows, baseline.rowHashes.protectedRows))
    await change('canonical content changed',
      "UPDATE travel_memories SET title='Changed' WHERE id=1",
      "UPDATE travel_memories SET title='海南記憶' WHERE id=1",
      (report) => assert.notEqual(report.rowHashes.canonicalRows, baseline.rowHashes.canonicalRows))
    await change('schema membership changed',
      'CREATE INDEX issue105_scope_idx ON travel_memories_daily_highlights(day)',
      'DROP INDEX issue105_scope_idx',
      (report) => assert.equal(report.metadataCounts.indexes, baseline.metadataCounts.indexes + 1))
    await change('security membership changed',
      'REVOKE SELECT ON travel_memories_daily_highlights FROM retirement_reader',
      'GRANT SELECT ON travel_memories_daily_highlights TO retirement_reader',
      (report) => assert.equal(report.metadataCounts.grants, baseline.metadataCounts.grants - 1))
    await t.test('baseline restored after independent comparisons', async () => {
      assert.deepEqual(await scopeParity(client), baseline)
    })
  } finally { await client.end() }
})
