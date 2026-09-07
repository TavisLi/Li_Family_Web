import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { lstat, mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

assert.equal(process.version, 'v20.20.2', 'BLOCK: Node')
assert.equal(process.env.NODE_ENV, 'production', 'BLOCK: NODE_ENV')
assert.equal(process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH, 'false', 'BLOCK: schema push')
assert.deepEqual(process.argv.slice(2), ['--approved-readonly-backup'], 'BLOCK: mode')
const targetSlugs = ['201307-hainan', '202308-east-australia', '202602-thailand-phuket']
const legacyTables = [
  'travel_memories_daily_highlights_segments_locales', 'travel_memories_daily_highlights_segments',
  'travel_memories_daily_highlights_locales', 'travel_memories_daily_highlights',
  '_travel_memories_v_version_daily_highlights_segments_locales', '_travel_memories_v_version_daily_highlights_segments',
  '_travel_memories_v_version_daily_highlights_locales', '_travel_memories_v_version_daily_highlights',
]
const relationTables = ['travel_memories_rels', '_travel_memories_v_rels']
const pathPattern = /^(version\.)?(itineraryImages|dailyHighlights\.[0-9]+\.mediaItems)$/
const privateRoot = '.phase21-private'
const runId = `retirement-backup-${new Date().toISOString().replace(/[:.]/g, '-')}`
const dir = `${privateRoot}/${runId}`
const digest = value => createHash('sha256').update(value).digest('hex')
const require = createRequire(import.meta.resolve('@payloadcms/db-postgres'))
const { Client } = require('pg')
const url = new URL(process.env.DATABASE_URI ?? '')
assert(['postgres:', 'postgresql:'].includes(url.protocol) && url.username && url.password && !url.hash, 'BLOCK: DATABASE_URI')
assert(!url.searchParams.has('options'), 'BLOCK: inherited options')
url.searchParams.set('options', '-c default_transaction_read_only=on -c statement_timeout=15000')
await mkdir(dir, { recursive: true, mode: 0o700 })
assert.equal((await lstat(dir)).mode & 0o777, 0o700)
const db = new Client({ connectionString: url.toString(), connectionTimeoutMillis: 10000, query_timeout: 20000, application_name: 'phase21-101-readonly-backup' })
let queryCount = 0
const q = async (text, values = []) => { queryCount += 1; return db.query(text, values) }
const snapshot = async () => {
  await q('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
  try {
    // Pooler startup options are not authoritative; enforce the approved bound
    // within this transaction before the first scoped query.
    await q("SET LOCAL statement_timeout = '15000'")
    const settings = (await q("SELECT current_setting('transaction_read_only') readonly,current_setting('statement_timeout') timeout")).rows[0]
    assert.deepEqual(settings, { readonly: 'on', timeout: '15s' }, 'BLOCK: transaction settings')
    const parents = (await q('SELECT id,slug,updated_at,created_at,_status FROM travel_memories WHERE slug = ANY($1::text[]) ORDER BY id', [targetSlugs])).rows
    assert.deepEqual(parents.map(row => row.slug).sort(), [...targetSlugs].sort(), 'BLOCK: parent scope')
    const parentIds = parents.map(row => row.id)
    const versions = (await q('SELECT id,parent_id,latest,autosave,snapshot,version__status,created_at,updated_at FROM _travel_memories_v WHERE parent_id = ANY($1::int[]) ORDER BY id', [parentIds])).rows
    const versionIds = versions.map(row => row.id)
    const highlights = (await q('SELECT * FROM travel_memories_daily_highlights WHERE _parent_id = ANY($1::int[]) ORDER BY _parent_id,_order,id', [parentIds])).rows
    const highlightIds = highlights.map(row => row.id)
    const segments = (await q('SELECT * FROM travel_memories_daily_highlights_segments WHERE _parent_id = ANY($1::text[]) ORDER BY _parent_id,_order,id', [highlightIds])).rows
    const versionHighlights = (await q('SELECT * FROM _travel_memories_v_version_daily_highlights WHERE _parent_id = ANY($1::int[]) ORDER BY _parent_id,_order,id', [versionIds])).rows
    const versionHighlightIds = versionHighlights.map(row => row.id)
    const versionSegments = (await q('SELECT * FROM _travel_memories_v_version_daily_highlights_segments WHERE _parent_id = ANY($1::int[]) ORDER BY _parent_id,_order,id', [versionHighlightIds])).rows
    const highlightLocales = (await q('SELECT * FROM travel_memories_daily_highlights_locales WHERE _parent_id = ANY($1::text[]) ORDER BY _parent_id,id', [highlightIds])).rows
    const segmentLocales = (await q('SELECT * FROM travel_memories_daily_highlights_segments_locales WHERE _parent_id = ANY($1::text[]) ORDER BY _parent_id,id', [segments.map(row => row.id)])).rows
    const versionHighlightLocales = (await q('SELECT * FROM _travel_memories_v_version_daily_highlights_locales WHERE _parent_id = ANY($1::int[]) ORDER BY _parent_id,id', [versionHighlightIds])).rows
    const versionSegmentLocales = (await q('SELECT * FROM _travel_memories_v_version_daily_highlights_segments_locales WHERE _parent_id = ANY($1::int[]) ORDER BY _parent_id,id', [versionSegments.map(row => row.id)])).rows
    const rels = {}
    for (const table of relationTables) {
      rels[table] = (await q(`SELECT * FROM public."${table}" WHERE path ~ $1 AND parent_id = ANY($2::int[]) ORDER BY id`, ['^(version\\.)?(itineraryImages|dailyHighlights\\.[0-9]+\\.mediaItems)$', table === relationTables[0] ? parentIds : versionIds])).rows
      assert(rels[table].every(row => pathPattern.test(row.path)), 'BLOCK: relation path')
    }
    const allRows = { parents, versions, highlights, segments, highlightLocales, segmentLocales, versionHighlights, versionSegments, versionHighlightLocales, versionSegmentLocales, rels }
    const columns = (await q(`SELECT table_name,column_name,ordinal_position,data_type,udt_name,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name = ANY($1::text[]) ORDER BY table_name,ordinal_position`, [[...legacyTables, ...relationTables]])).rows
    const security = (await q(`SELECT c.relname,c.relrowsecurity,c.relforcerowsecurity,c.relacl::text,pg_get_userbyid(c.relowner) owner FROM pg_class c WHERE c.relnamespace='public'::regnamespace AND c.relname = ANY($1::text[]) ORDER BY c.relname`, [[...legacyTables, ...relationTables]])).rows
    const grants = (await q(`SELECT table_name,grantee,privilege_type,is_grantable FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name = ANY($1::text[]) ORDER BY table_name,grantee,privilege_type`, [[...legacyTables, ...relationTables]])).rows
    const policies = (await q('SELECT * FROM pg_policies WHERE schemaname=\'public\' AND tablename = ANY($1::text[]) ORDER BY tablename,policyname', [[...legacyTables, ...relationTables]])).rows
    assert(security.length === legacyTables.length + relationTables.length, 'BLOCK: missing security metadata')
    assert(security.every(row => row.relrowsecurity === true), 'BLOCK: RLS disabled')
    assert(!grants.some(row => ['anon', 'authenticated', 'PUBLIC'].includes(String(row.grantee))), 'BLOCK: public grant')
    return { targetSlugs, parents, versions, allRows, metadata: { columns, security, grants, policies } }
  } finally { await q('ROLLBACK') }
}
try {
  await db.connect()
  const before = await snapshot()
  const after = await snapshot()
  const beforeText = JSON.stringify(before)
  const afterText = JSON.stringify(after)
  assert.equal(digest(beforeText), digest(afterText), 'BLOCK: snapshot drift; no retry')
  const bytes = Buffer.byteLength(beforeText)
  assert(bytes <= 32 * 1024 * 1024, 'BLOCK: backup byte cap')
  const payload = JSON.stringify({ status: 'SCOPED_RETIREMENT_BACKUP_PASS_NOT_CLEANUP_APPROVAL', runId, observedAt: new Date().toISOString(), productionWrites: 0, statementTimeoutMs: 15000, backupBytes: bytes, backupSha256: digest(beforeText), snapshot: before })
  await writeFile(`${dir}/backup.json`, payload, { flag: 'wx', mode: 0o600 })
  assert.equal((await lstat(`${dir}/backup.json`)).mode & 0o777, 0o600)
  await writeFile(`${dir}/receipt.json`, JSON.stringify({ status: 'SCOPED_RETIREMENT_BACKUP_PASS_NOT_CLEANUP_APPROVAL', runId, backupSha256: digest(beforeText), backupBytes: bytes, tables: legacyTables, relationRows: Object.fromEntries(Object.entries(before.allRows.rels).map(([k, rows]) => [k, rows.length])), queryCount, restoreDrill: 'PENDING_DISPOSABLE_POSTGRESQL' }, null, 2), { flag: 'wx', mode: 0o600 })
  console.log(JSON.stringify({ status: 'SCOPED_RETIREMENT_BACKUP_PASS_NOT_CLEANUP_APPROVAL', runId, backupSha256: digest(beforeText), backupBytes: bytes, queryCount, productionWrites: 0, path: `${dir}/backup.json` }))
} finally { await db.end() }
