import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

const enabled = process.env.ISSUE105_PG_REHEARSAL === '1'
const url = enabled ? new URL(process.env.DATABASE_URI ?? '') : null
if (enabled) {
  assert.equal(url.hostname, '127.0.0.1')
  assert.equal(url.port, '55444')
  assert.equal(url.pathname, '/issue105')
  assert.equal(process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH, 'false')
}

test('disposable PostgreSQL rehearsal and drift matrix', { skip: !enabled }, async (t) => {
  const require = createRequire(import.meta.resolve('@payloadcms/db-postgres'))
  const { Client } = require('pg')
  const client = new Client({ connectionString: url.toString(), connectionTimeoutMillis: 5000, query_timeout: 15000 })
  await client.connect()
  const root = process.cwd()
  const runCase = async (name, expected) => {
    const directory = await mkdtemp(path.join(tmpdir(), `issue105-${name}-`))
    const runId = `issue-105-slice2-${name}`
    const make = spawnSync(process.execPath, ['src/scripts/run-executor-fixture-manifest.mjs', directory, runId],
      { cwd: root, encoding: 'utf8' })
    assert.equal(make.status, 0, make.stderr)
    const result = spawnSync(process.execPath, ['src/scripts/run-executor-session.mjs', directory],
      { cwd: root, encoding: 'utf8', env: process.env, timeout: 130000 })
    const receipt = JSON.parse(await readFile(path.join(directory, 'receipt.json'), 'utf8'))
    const terminal = JSON.parse(await readFile(path.join(directory, 'terminal-exit.json'), 'utf8'))
    assert.equal(result.status, expected === 'PASS' ? 0 : 1, result.stderr)
    assert.equal(terminal.actualExitCode, result.status === 0 ? 0 : 1)
    assert.equal(expected === 'PASS' ? receipt.status : receipt.code, expected)
    assert.equal(receipt.automaticRetry, false)
    assert.equal(receipt.sessionId.startsWith(`${runId}:`), true)
    return receipt
  }
  const change = async (name, setup, cleanup, code) => t.test(name, async () => {
    await client.query(setup)
    try {
      const result = await runCase(name, code)
      assert.equal(result.stage, 'preflight')
      assert.equal(result.commitState, 'ROLLED_BACK')
    } finally { await client.query(cleanup) }
  })
  try {
    await t.test('normal apply, read-back and full restore', async () => {
      const result = await runCase('normal', 'PASS')
      assert.equal(result.commitState, 'COMMITTED')
      assert.equal(result.restoreState, 'RESTORED')
      assert(result.queries <= 150 && result.roundTrips <= 160)
      assert(result.responseBytes > 0)
    })
    await change('outside-backup',
      "INSERT INTO travel_memories_rels VALUES (999,1,'itineraryImages',999)",
      'DELETE FROM travel_memories_rels WHERE id=999', 'TARGET_ADDED_OUTSIDE_BACKUP')
    await change('changed-path',
      "UPDATE travel_memories_rels SET path='dailyHighlights.1.mediaItems' WHERE id=101",
      "UPDATE travel_memories_rels SET path='itineraryImages' WHERE id=101", 'TARGET_PATH_CHANGED')
    await change('missing-row',
      'DELETE FROM travel_memories_rels WHERE id=102',
      "INSERT INTO travel_memories_rels VALUES (102,1,'dailyHighlights.0.mediaItems',502)", 'TARGET_MISSING')
    await change('non-target',
      "UPDATE travel_memories_rels SET path='galleryImagesChanged' WHERE id=103",
      "UPDATE travel_memories_rels SET path='galleryImages' WHERE id=103", 'NON_TARGET_RELATION_DRIFT')
    await change('canonical-content',
      "UPDATE travel_memories SET title='Changed' WHERE id=1",
      "UPDATE travel_memories SET title='海南記憶' WHERE id=1", 'CANONICAL_CONTENT_DRIFT')
    await change('schema-drift',
      'CREATE INDEX issue105_drift_idx ON travel_memories_daily_highlights(day)',
      'DROP INDEX issue105_drift_idx', 'SCHEMA_DRIFT')
    await change('fk-drift',
      'ALTER TABLE travel_memories_daily_highlights DROP CONSTRAINT travel_memories_daily_highlights__parent_id_fkey',
      'ALTER TABLE travel_memories_daily_highlights ADD CONSTRAINT travel_memories_daily_highlights__parent_id_fkey FOREIGN KEY (_parent_id) REFERENCES travel_memories(id)', 'SCHEMA_DRIFT')
    await change('sequence-drift',
      'ALTER SEQUENCE travel_memories_daily_highlights_id_seq INCREMENT BY 2',
      'ALTER SEQUENCE travel_memories_daily_highlights_id_seq INCREMENT BY 1', 'SCHEMA_DRIFT')
    await change('security-drift',
      'ALTER TABLE travel_memories_daily_highlights DISABLE ROW LEVEL SECURITY',
      'ALTER TABLE travel_memories_daily_highlights ENABLE ROW LEVEL SECURITY', 'SECURITY_DRIFT')
    await change('grant-drift',
      'REVOKE SELECT ON travel_memories_daily_highlights FROM retirement_reader',
      'GRANT SELECT ON travel_memories_daily_highlights TO retirement_reader', 'SECURITY_DRIFT')
    await change('policy-drift',
      'ALTER POLICY retirement_read ON travel_memories_daily_highlights USING (false)',
      'ALTER POLICY retirement_read ON travel_memories_daily_highlights USING (true)', 'SECURITY_DRIFT')
    await t.test('baseline still restores exactly after drift cases', async () => {
      const result = await runCase('final-normal', 'PASS')
      assert.equal(result.restoreState, 'RESTORED')
    })
  } finally { await client.end() }
})
