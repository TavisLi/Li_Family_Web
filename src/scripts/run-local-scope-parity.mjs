import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

import { retirementPlan } from './run-executor-retirement-plan.mjs'

const tables = ['travel_memories_rels', '_travel_memories_v_rels']
const allTables = [...tables, 'travel_memories_daily_highlights', 'travel_memories']
const legacy = /^(version\.)?(itineraryImages|dailyHighlights\.[0-9]+\.mediaItems)$/
const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex')

export async function scopeParity(client) {
  const readPages = async (_name, sql, values, cursorOf) => {
    const rows = []
    let cursor = null
    do {
      const result = await client.query(sql, values(cursor, 20))
      assert(result.rows.length <= 20)
      assert(Buffer.byteLength(JSON.stringify({ rows: result.rows, rowCount: result.rowCount })) <= 65536)
      if (!result.rows.length) break
      const next = cursorOf(result.rows.at(-1))
      assert(cursor === null || next > cursor)
      rows.push(...result.rows)
      cursor = next
      if (result.rows.length < 20) break
    } while (true)
    return rows
  }
  const optimized = await retirementPlan.snapshot({ readPages })
  const reference = { targetRows: [], protectedRows: [], canonicalRows: [], legacyRows: [] }
  for (const table of tables) {
    const rows = (await client.query(`SELECT '${table}' AS table,id,parent_id,path,to_jsonb(t) body
      FROM public."${table}" t ORDER BY id`)).rows
    for (const row of rows) (legacy.test(row.path) ? reference.targetRows : reference.protectedRows).push(row)
  }
  reference.canonicalRows = (await client.query('SELECT id,to_jsonb(t) body FROM travel_memories t ORDER BY id')).rows
  reference.legacyRows = (await client.query(
    'SELECT id,to_jsonb(t) body FROM travel_memories_daily_highlights t ORDER BY id')).rows
  for (const key of ['targetRows', 'protectedRows', 'canonicalRows', 'legacyRows']) {
    assert.deepEqual(optimized[key], reference[key], `BLOCK: ${key} coverage changed`)
  }
  const catalogs = {
    columns: `SELECT table_name||'.'||lpad(ordinal_position::text,4,'0') id FROM information_schema.columns
      WHERE table_schema='public' AND table_name=ANY($1::text[]) ORDER BY id`,
    constraints: `SELECT c.relname||'.'||k.conname id FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid
      WHERE c.relnamespace='public'::regnamespace AND c.relname=ANY($1::text[]) ORDER BY id`,
    indexes: `SELECT tablename||'.'||indexname id FROM pg_indexes
      WHERE schemaname='public' AND tablename=ANY($1::text[]) ORDER BY id`,
    sequences: `SELECT sequencename id FROM pg_sequences WHERE schemaname='public'
      AND sequencename='travel_memories_daily_highlights_id_seq' ORDER BY id`,
    rls: `SELECT relname id FROM pg_class WHERE relnamespace='public'::regnamespace
      AND relname=ANY($1::text[]) ORDER BY id`,
    grants: `SELECT table_name||'.'||grantee||'.'||privilege_type id FROM information_schema.role_table_grants
      WHERE table_schema='public' AND table_name=ANY($1::text[]) ORDER BY id`,
    policies: `SELECT tablename||'.'||policyname id FROM pg_policies
      WHERE schemaname='public' AND tablename=ANY($1::text[]) ORDER BY id`,
  }
  const metadataCounts = {}
  for (const [name, sql] of Object.entries(catalogs)) {
    const ids = (await client.query(sql, sql.includes('$1') ? [allTables] : [])).rows.map((row) => row.id)
    assert.deepEqual(optimized.metadata[name].map((row) => row.id), ids,
      `BLOCK: ${name} catalog coverage changed`)
    metadataCounts[name] = ids.length
  }
  return { status: 'PASS', reference: 'independent full scans and catalog ID queries',
    rowCounts: Object.fromEntries(['targetRows', 'protectedRows', 'canonicalRows', 'legacyRows']
      .map((key) => [key, reference[key].length])),
    rowHashes: Object.fromEntries(['targetRows', 'protectedRows', 'canonicalRows', 'legacyRows']
      .map((key) => [key, digest(reference[key])])), metadataCounts }
}

if (process.argv[1]?.endsWith('/run-local-scope-parity.mjs')) {
  const destination = process.argv[2]
  assert(destination && process.argv.length === 3)
  assert.equal(process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH, 'false')
  const url = new URL(process.env.DATABASE_URI ?? '')
  assert.equal(url.hostname, '127.0.0.1')
  assert.equal(url.port, '55444')
  assert.equal(url.pathname, '/issue105')
  const require = createRequire(import.meta.resolve('@payloadcms/db-postgres'))
  const { Client } = require('pg')
  const client = new Client({ connectionString: url.toString(), connectionTimeoutMillis: 5000 })
  await client.connect()
  try {
    const report = await scopeParity(client)
    const backup = JSON.parse(await readFile('docs/phase-artifacts/issue-105/slice-2-example/backup.json', 'utf8'))
    assert.deepEqual(report.rowCounts, {
      targetRows: backup.snapshot.targetRows.length, protectedRows: backup.snapshot.protectedRows.length,
      canonicalRows: backup.snapshot.canonicalRows.length, legacyRows: backup.snapshot.legacyRows.length,
    }, 'BLOCK: baseline row counts changed')
    await writeFile(destination, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' })
    console.log(JSON.stringify({ status: report.status, destination, rowCounts: report.rowCounts }))
  } finally { await client.end() }
}
