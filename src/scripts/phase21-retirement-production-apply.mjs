import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { lstat, mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { buildRetirementCleanupPlan } from './phase21-retirement-cleanup-plan.mjs'
import { retirementRelationReads } from './phase21-retirement-scope.mjs'

assert.equal(process.version, 'v20.20.2', 'BLOCK: Node')
assert.equal(process.env.NODE_ENV, 'production', 'BLOCK: NODE_ENV')
assert.equal(process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH, 'false', 'BLOCK: schema push')
assert.deepEqual(process.argv.slice(2), ['--approved-production-apply', process.argv[3]], 'BLOCK: mode')

const preflightPath = process.argv[3]
const backupPath = '.phase21-private/retirement-backup-2026-09-07T09-19-11-293Z/backup.json'
const expectedBackupSha = '7f6041a1a0caf3b3b7b0dccbb575d3b3a3a6c4aa56b648fcc879a2e23b52e46b'
const legacyTables = [
  'travel_memories_daily_highlights_segments_locales', 'travel_memories_daily_highlights_segments',
  'travel_memories_daily_highlights_locales', 'travel_memories_daily_highlights',
  '_travel_memories_v_version_daily_highlights_segments_locales', '_travel_memories_v_version_daily_highlights_segments',
  '_travel_memories_v_version_daily_highlights_locales', '_travel_memories_v_version_daily_highlights',
]
const relationTables = ['travel_memories_rels', '_travel_memories_v_rels']
const stable = value => Array.isArray(value) ? `[${value.map(stable).sort().join(',')}]` : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}` : JSON.stringify(value)
const digest = value => createHash('sha256').update(stable(value)).digest('hex')
const backup = JSON.parse(await readFile(backupPath, 'utf8'))
const preflight = JSON.parse(await readFile(preflightPath, 'utf8'))
assert.equal(backup.status, 'SCOPED_RETIREMENT_BACKUP_PASS_NOT_CLEANUP_APPROVAL')
assert.equal(backup.backupSha256, expectedBackupSha, 'BLOCK: backup checksum')
assert.equal(preflight.backupSha256, expectedBackupSha, 'BLOCK: preflight checksum')
assert.equal(preflight.status, 'FINAL_RETIREMENT_PREFLIGHT_PASS_NOT_CLEANUP_APPROVAL')
assert.equal(preflight.statementTimeoutMs, 15000)
assert.equal(preflight.metadata.constraints.length, 16)
assert.equal(preflight.metadata.indexes.length, 20)
assert.equal(preflight.metadata.sequences.length, 5)
const plan = buildRetirementCleanupPlan({ backupSha256: expectedBackupSha, relations: backup.snapshot.allRows.rels })
assert.equal(plan.invariant.relationDeleteCount, 1857, 'BLOCK: relation delete scope')
assert.equal(plan.invariant.relationDeleteStatements, 2, 'BLOCK: relation delete statement scope')
assert.equal(plan.drops.length, 8, 'BLOCK: drop scope')
assert(plan.drops.every(statement => statement.endsWith(' RESTRICT') && !statement.includes('CASCADE')))

const runId = `retirement-production-apply-${new Date().toISOString().replace(/[:.]/g, '-')}`
const dir = `.phase21-private/${runId}`
await mkdir(dir, { recursive: true, mode: 0o700 })
assert.equal((await lstat(dir)).mode & 0o777, 0o700)
const writeReceipt = async (name, value) => writeFile(`${dir}/${name}`, JSON.stringify(value, null, 2), { flag: 'wx', mode: 0o600 })
const require = createRequire(import.meta.resolve('@payloadcms/db-postgres'))
const { Client } = require('pg')
const url = new URL(process.env.DATABASE_URI ?? '')
assert(['postgres:', 'postgresql:'].includes(url.protocol) && url.username && url.password && !url.hash && !url.searchParams.has('options'), 'BLOCK: DATABASE_URI')
const db = new Client({ connectionString: url.toString(), connectionTimeoutMillis: 10000, query_timeout: 20000, application_name: 'phase21-101-production-cleanup-apply' })
let queryCount = 0
let stage = 'connect'
let committed = false
const q = async (text, values = []) => { queryCount += 1; return db.query(text, values) }
const expectedRelations = backup.snapshot.allRows.rels
const expectedCounts = {
  travel_memories_daily_highlights: backup.snapshot.allRows.highlights.length,
  travel_memories_daily_highlights_segments: backup.snapshot.allRows.segments.length,
  travel_memories_daily_highlights_locales: backup.snapshot.allRows.highlightLocales.length,
  travel_memories_daily_highlights_segments_locales: backup.snapshot.allRows.segmentLocales.length,
  _travel_memories_v_version_daily_highlights: backup.snapshot.allRows.versionHighlights.length,
  _travel_memories_v_version_daily_highlights_segments: backup.snapshot.allRows.versionSegments.length,
  _travel_memories_v_version_daily_highlights_locales: backup.snapshot.allRows.versionHighlightLocales.length,
  _travel_memories_v_version_daily_highlights_segments_locales: backup.snapshot.allRows.versionSegmentLocales.length,
}
const metadataQuery = async () => {
  const columns = (await q(`SELECT table_name,column_name,ordinal_position,data_type,udt_name,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name=ANY($1::text[]) ORDER BY table_name,ordinal_position`, [[...legacyTables, ...relationTables]])).rows
  const security = (await q(`SELECT c.relname,c.relrowsecurity,c.relforcerowsecurity,c.relacl::text,pg_get_userbyid(c.relowner) owner FROM pg_class c WHERE c.relnamespace='public'::regnamespace AND c.relname=ANY($1::text[]) ORDER BY c.relname`, [[...legacyTables, ...relationTables]])).rows
  const grants = (await q(`SELECT table_name,grantee,privilege_type,is_grantable FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name=ANY($1::text[]) ORDER BY table_name,grantee,privilege_type`, [[...legacyTables, ...relationTables]])).rows
  const policies = (await q("SELECT * FROM pg_policies WHERE schemaname='public' AND tablename=ANY($1::text[]) ORDER BY tablename,policyname", [[...legacyTables, ...relationTables]])).rows
  const constraints = (await q(`SELECT s.relname source,c.conname name,c.contype type,t.relname target,pg_get_constraintdef(c.oid) definition FROM pg_constraint c JOIN pg_class s ON s.oid=c.conrelid LEFT JOIN pg_class t ON t.oid=c.confrelid WHERE s.relnamespace='public'::regnamespace AND (s.relname=ANY($1::text[]) OR t.relname=ANY($1::text[])) ORDER BY s.relname,c.conname`, [legacyTables])).rows
  const indexes = (await q("SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename=ANY($1::text[]) ORDER BY tablename,indexname", [legacyTables])).rows
  const sequences = (await q(`SELECT sequence_name,last_value::text FROM information_schema.sequences s JOIN pg_sequences q ON q.schemaname=s.sequence_schema AND q.sequencename=s.sequence_name WHERE s.sequence_schema='public' AND sequence_name LIKE ANY($1::text[]) ORDER BY sequence_name`, [legacyTables.map(table => `${table}_id_seq`)])).rows
  return { columns, security, grants, policies, constraints, indexes, sequences }
}
try {
  await db.connect()
  stage = 'transaction'
  await q('BEGIN ISOLATION LEVEL REPEATABLE READ')
  try {
    stage = 'settings'
    await q("SET LOCAL statement_timeout = '15000'")
    const settings = (await q("SELECT current_setting('transaction_read_only') readonly,current_setting('statement_timeout') timeout")).rows[0]
    assert.deepEqual(settings, { readonly: 'off', timeout: '15s' }, 'BLOCK: transaction settings')
    stage = 'scope'
    const counts = {}
    for (const table of legacyTables) counts[table] = Number((await q(`SELECT count(*)::int n FROM public."${table}"`)).rows[0].n)
    assert.deepEqual(counts, expectedCounts, 'BLOCK: legacy table row scope drift')
    const relations = {}
    for (const statement of retirementRelationReads(expectedRelations)) relations[statement.table] = [...(relations[statement.table] ?? []), ...(await q(statement.text, statement.values)).rows]
    assert.equal(digest(relations), digest(expectedRelations), 'BLOCK: exact relation envelope drift')
    stage = 'metadata'
    const metadata = await metadataQuery()
    for (const key of ['columns', 'security', 'grants', 'policies']) assert.equal(digest(metadata[key]), digest(backup.snapshot.metadata[key]), `BLOCK: ${key} drift`)
    for (const key of ['constraints', 'indexes', 'sequences']) assert.equal(digest(metadata[key]), digest(preflight.metadata[key]), `BLOCK: ${key} drift`)
    assert.equal(metadata.constraints.length, 16)
    stage = 'apply'
    for (const statement of plan.relationDeletes) assert.equal((await q(statement.text, statement.values)).rowCount, JSON.parse(statement.values[0]).length, 'BLOCK: relation delete cardinality')
    for (const statement of plan.drops) await q(statement)
    await q('COMMIT')
    committed = true
    stage = 'readback'
    const readback = new Client({ connectionString: url.toString(), connectionTimeoutMillis: 10000, query_timeout: 20000, application_name: 'phase21-101-production-cleanup-readback' })
    await readback.connect()
    try {
      await readback.query("SET statement_timeout = '15000'")
      const missing = (await readback.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name=ANY($1::text[]) ORDER BY table_name`, [legacyTables])).rows
      assert.equal(missing.length, 0, 'BLOCK: dropped table read-back')
      for (const statement of retirementRelationReads(expectedRelations)) assert.equal((await readback.query(statement.text, statement.values)).rowCount, 0, 'BLOCK: legacy relation read-back')
      for (const table of ['travel_memories', '_travel_memories_v']) assert.equal((await readback.query(`SELECT to_regclass($1) reg`, [`public.${table}`])).rows[0].reg, table, `BLOCK: canonical relation read-back`)
    } finally { await readback.end() }
    await writeReceipt('apply.json', { status: 'FINAL_RETIREMENT_PRODUCTION_APPLY_PASS', runId, backupSha256: expectedBackupSha, statementTimeoutMs: 15000, relationDeletes: plan.invariant.relationDeleteCount, relationDeleteStatements: plan.invariant.relationDeleteStatements, drops: plan.drops.length, dropMode: 'RESTRICT', readback: 'PASS', queryCount })
    console.log(JSON.stringify({ status: 'FINAL_RETIREMENT_PRODUCTION_APPLY_PASS', runId, backupSha256: expectedBackupSha, relationDeletes: plan.invariant.relationDeleteCount, relationDeleteStatements: plan.invariant.relationDeleteStatements, drops: plan.drops.length, readback: 'PASS', path: `${dir}/apply.json` }))
  } catch (error) {
    if (!committed) await q('ROLLBACK').catch(() => undefined)
    throw error
  }
} catch (error) {
  const message = error instanceof Error ? error.message.split('\n')[0] : 'Unknown error'
  await writeReceipt('block.json', { status: committed ? 'FINAL_RETIREMENT_POST_COMMIT_READBACK_BLOCK_NO_RETRY' : 'FINAL_RETIREMENT_PRODUCTION_APPLY_BLOCK_NO_RETRY', runId, stage, queryCount, productionWrites: committed ? 'COMMITTED_UNKNOWN_READBACK' : 0, reason: message }).catch(() => undefined)
  console.error(JSON.stringify({ status: committed ? 'FINAL_RETIREMENT_POST_COMMIT_READBACK_BLOCK_NO_RETRY' : 'FINAL_RETIREMENT_PRODUCTION_APPLY_BLOCK_NO_RETRY', runId, stage, queryCount, productionWrites: committed ? 'COMMITTED_UNKNOWN_READBACK' : 0, reason: message }))
  process.exitCode = 1
} finally { await db.end() }
