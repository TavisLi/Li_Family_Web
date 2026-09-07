import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { lstat, mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { retirementRelationReads } from './phase21-retirement-scope.mjs'

assert.equal(process.version, 'v20.20.2', 'BLOCK: Node')
assert.equal(process.env.NODE_ENV, 'production', 'BLOCK: NODE_ENV')
assert.equal(process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH, 'false', 'BLOCK: schema push')
assert.deepEqual(process.argv.slice(2), ['--approved-readonly-preflight'], 'BLOCK: mode')
const backupPath = '.phase21-private/retirement-backup-2026-09-07T09-19-11-293Z/backup.json'
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
assert.equal(backup.status, 'SCOPED_RETIREMENT_BACKUP_PASS_NOT_CLEANUP_APPROVAL')
const runId = `retirement-final-preflight-${new Date().toISOString().replace(/[:.]/g, '-')}`
const dir = `.phase21-private/${runId}`
await mkdir(dir, { recursive: true, mode: 0o700 })
assert.equal((await lstat(dir)).mode & 0o777, 0o700)
const require = createRequire(import.meta.resolve('@payloadcms/db-postgres'))
const { Client } = require('pg')
const url = new URL(process.env.DATABASE_URI ?? '')
assert(['postgres:', 'postgresql:'].includes(url.protocol) && url.username && url.password && !url.hash && !url.searchParams.has('options'), 'BLOCK: DATABASE_URI')
url.searchParams.set('options', '-c default_transaction_read_only=on -c statement_timeout=15000')
const db = new Client({ connectionString: url.toString(), connectionTimeoutMillis: 10000, query_timeout: 20000, application_name: 'phase21-101-final-preflight' })
let queryCount = 0
const q = async (text, values = []) => { queryCount += 1; return db.query(text, values) }
const expectedRelations = backup.snapshot.allRows.rels
let stage = 'connect'
try {
  await db.connect()
  stage = 'transaction'
  await q('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
  try {
    stage = 'settings'
    await q("SET LOCAL statement_timeout = '15000'")
    assert.deepEqual((await q("SELECT current_setting('transaction_read_only') readonly,current_setting('statement_timeout') timeout")).rows[0], { readonly: 'on', timeout: '15s' }, 'BLOCK: transaction settings')
    stage = 'table-counts'
    const counts = Object.fromEntries(await Promise.all(legacyTables.map(async table => [table, Number((await q(`SELECT count(*)::int n FROM public."${table}"`)).rows[0].n)])))
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
    assert.deepEqual(counts, expectedCounts, 'BLOCK: legacy table row scope drift')
    stage = 'relations'
    const relations = {}
    for (const statement of retirementRelationReads(expectedRelations)) relations[statement.table] = (await q(statement.text, statement.values)).rows
    assert.equal(digest(relations), digest(expectedRelations), 'BLOCK: exact relation envelope drift')
    stage = 'metadata'
    const columns = (await q(`SELECT table_name,column_name,ordinal_position,data_type,udt_name,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name=ANY($1::text[]) ORDER BY table_name,ordinal_position`, [[...legacyTables, ...relationTables]])).rows
    const security = (await q(`SELECT c.relname,c.relrowsecurity,c.relforcerowsecurity,c.relacl::text,pg_get_userbyid(c.relowner) owner FROM pg_class c WHERE c.relnamespace='public'::regnamespace AND c.relname=ANY($1::text[]) ORDER BY c.relname`, [[...legacyTables, ...relationTables]])).rows
    const grants = (await q(`SELECT table_name,grantee,privilege_type,is_grantable FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name=ANY($1::text[]) ORDER BY table_name,grantee,privilege_type`, [[...legacyTables, ...relationTables]])).rows
    const policies = (await q("SELECT * FROM pg_policies WHERE schemaname='public' AND tablename=ANY($1::text[]) ORDER BY tablename,policyname", [[...legacyTables, ...relationTables]])).rows
    for (const [key, value] of Object.entries({ columns, security, grants, policies })) assert.equal(digest(value), digest(backup.snapshot.metadata[key]), `BLOCK: ${key} drift`)
    stage = 'ddl-metadata'
    const constraints = (await q(`SELECT s.relname source,c.conname name,c.contype type,t.relname target,pg_get_constraintdef(c.oid) definition FROM pg_constraint c JOIN pg_class s ON s.oid=c.conrelid LEFT JOIN pg_class t ON t.oid=c.confrelid WHERE s.relnamespace='public'::regnamespace AND (s.relname=ANY($1::text[]) OR t.relname=ANY($1::text[])) ORDER BY s.relname,c.conname`, [legacyTables])).rows
    const indexes = (await q("SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename=ANY($1::text[]) ORDER BY tablename,indexname", [legacyTables])).rows
    const sequences = (await q(`SELECT sequence_name,last_value::text FROM information_schema.sequences s JOIN pg_sequences q ON q.schemaname=s.sequence_schema AND q.sequencename=s.sequence_name WHERE s.sequence_schema='public' AND sequence_name LIKE ANY($1::text[]) ORDER BY sequence_name`, [legacyTables.map(table => `${table}_id_seq`)])).rows
    assert(constraints.every(row => ['p', 'u', 'f'].includes(row.type)), 'BLOCK: unexpected constraint type')
    const result = { status: 'FINAL_RETIREMENT_PREFLIGHT_PASS_NOT_CLEANUP_APPROVAL', runId, backupSha256: backup.backupSha256, productionWrites: 0, statementTimeoutMs: 15000, queryCount, counts, relations, metadata: { columns, security, grants, policies, constraints, indexes, sequences } }
    stage = 'receipt'
    await writeFile(`${dir}/preflight.json`, JSON.stringify(result), { flag: 'wx', mode: 0o600 })
    assert.equal((await lstat(`${dir}/preflight.json`)).mode & 0o777, 0o600)
    console.log(JSON.stringify({ status: result.status, runId, backupSha256: result.backupSha256, productionWrites: 0, queryCount, constraints: constraints.length, indexes: indexes.length, sequences: sequences.length, path: `${dir}/preflight.json` }))
  } finally { await q('ROLLBACK') }
} catch (error) {
  const message = error instanceof Error ? error.message.split('\n')[0] : 'Unknown error'
  await writeFile(`${dir}/block.json`, JSON.stringify({ status: 'FINAL_RETIREMENT_PREFLIGHT_BLOCK_NO_RETRY', stage, queryCount, productionWrites: 0, reason: message }, null, 2), { flag: 'wx', mode: 0o600 }).catch(() => undefined)
  console.error(JSON.stringify({ status: 'FINAL_RETIREMENT_PREFLIGHT_BLOCK_NO_RETRY', stage, queryCount, productionWrites: 0, reason: message }))
  process.exitCode = 1
} finally { await db.end() }
