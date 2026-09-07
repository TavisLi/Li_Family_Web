import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { buildRetirementCleanupPlan } from './phase21-retirement-cleanup-plan.mjs'

assert.equal(process.version, 'v20.20.2')
assert.equal(process.env.DATABASE_URI, undefined, 'Production credentials prohibited')
assert.equal(process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH, 'false')
assert.deepEqual(process.argv.slice(2), ['--local-final-preflight', process.argv[3]], 'BLOCK: mode')
const preflightPath = process.argv[3]
const preflight = JSON.parse(await readFile(preflightPath, 'utf8'))
const backup = JSON.parse(await readFile('.phase21-private/retirement-backup-2026-09-07T09-19-11-293Z/backup.json', 'utf8'))
assert.equal(preflight.backupSha256, backup.backupSha256)
const metadata = preflight.metadata
const tables = [...new Set(metadata.columns.map(row => row.table_name))].sort()
const safe = value => { assert(/^[a-z_]+$/.test(value)); return `"${value}"` }
const type = row => row.data_type === 'USER-DEFINED' ? '"_locales"' : row.data_type
const require = createRequire(import.meta.resolve('@payloadcms/db-postgres'))
const { Client } = require('pg')
const db = new Client({ connectionString: 'postgresql://postgres:synthetic@127.0.0.1:55444/postgres', connectionTimeoutMillis: 3000, query_timeout: 15000 })
const rows = {
  travel_memories_daily_highlights: backup.snapshot.allRows.highlights,
  travel_memories_daily_highlights_segments: backup.snapshot.allRows.segments,
  travel_memories_daily_highlights_locales: backup.snapshot.allRows.highlightLocales,
  travel_memories_daily_highlights_segments_locales: backup.snapshot.allRows.segmentLocales,
  _travel_memories_v_version_daily_highlights: backup.snapshot.allRows.versionHighlights,
  _travel_memories_v_version_daily_highlights_segments: backup.snapshot.allRows.versionSegments,
  _travel_memories_v_version_daily_highlights_locales: backup.snapshot.allRows.versionHighlightLocales,
  _travel_memories_v_version_daily_highlights_segments_locales: backup.snapshot.allRows.versionSegmentLocales,
  ...backup.snapshot.allRows.rels,
}
const plan = buildRetirementCleanupPlan({ backupSha256: backup.backupSha256, relations: backup.snapshot.allRows.rels })
await db.connect()
try {
  await db.query('CREATE TYPE "_locales" AS ENUM (\'zh-TW\',\'en\')')
  await db.query('CREATE TABLE travel_memories (id integer PRIMARY KEY)')
  await db.query('CREATE TABLE _travel_memories_v (id integer PRIMARY KEY)')
  await db.query('INSERT INTO travel_memories(id) SELECT DISTINCT (value->>\'id\')::int FROM jsonb_array_elements($1::jsonb) value', [JSON.stringify(backup.snapshot.parents)])
  await db.query('INSERT INTO _travel_memories_v(id) SELECT DISTINCT (value->>\'id\')::int FROM jsonb_array_elements($1::jsonb) value', [JSON.stringify(backup.snapshot.versions)])
  for (const table of tables) {
    const columns = metadata.columns.filter(row => row.table_name === table).sort((a, b) => a.ordinal_position - b.ordinal_position)
    await db.query(`CREATE TABLE ${safe(table)} (${columns.map(row => `${safe(row.column_name)} ${type(row)}`).join(', ')})`)
    if (rows[table].length) await db.query(`INSERT INTO ${safe(table)} SELECT * FROM json_populate_recordset(NULL::${safe(table)},$1::json)`, [JSON.stringify(rows[table])])
  }
  await db.query("INSERT INTO travel_memories_rels (id,parent_id,path) VALUES (900001,1,'galleryImages'),(900002,2,'galleryImages')")
  await db.query("INSERT INTO _travel_memories_v_rels (id,parent_id,path) VALUES (900003,1,'galleryImages'),(900004,2,'galleryImages')")
  for (const constraint of metadata.constraints.filter(row => row.type === 'p')) await db.query(`ALTER TABLE ${safe(constraint.source)} ADD CONSTRAINT ${safe(constraint.name)} ${constraint.definition}`)
  for (const constraint of metadata.constraints.filter(row => row.type === 'f')) await db.query(`ALTER TABLE ${safe(constraint.source)} ADD CONSTRAINT ${safe(constraint.name)} ${constraint.definition}`)
  const before = {}
  for (const table of ['travel_memories_rels', '_travel_memories_v_rels', ...plan.invariant.tables]) before[table] = (await db.query(`SELECT to_jsonb(t) row FROM ${safe(table)} t`)).rows.map(row => row.row)
  const apply = async () => {
    for (const statement of plan.relationDeletes) assert.equal((await db.query(statement.text, statement.values)).rowCount, 1)
    for (const statement of plan.drops) await db.query(statement)
  }
  await db.query('BEGIN')
  await apply()
  await db.query('ROLLBACK')
  for (const table of plan.invariant.tables) assert.equal((await db.query(`SELECT to_regclass('public.${table}') reg`)).rows[0].reg, table, `rollback restored ${table}`)
  assert.equal((await db.query('SELECT count(*)::int n FROM travel_memories_rels WHERE path=\'galleryImages\'')).rows[0].n, 2)
  await db.query('BEGIN')
  await apply()
  await db.query('COMMIT')
  for (const table of plan.invariant.tables) assert.equal((await db.query(`SELECT to_regclass('public.${table}') reg`)).rows[0].reg, null, `drop missing ${table}`)
  assert.equal((await db.query('SELECT count(*)::int n FROM travel_memories_rels WHERE path=\'galleryImages\'')).rows[0].n, 2)
  assert.equal((await db.query('SELECT count(*)::int n FROM _travel_memories_v_rels WHERE path=\'galleryImages\'')).rows[0].n, 2)
  console.log(JSON.stringify({ status: 'FINAL_RETIREMENT_ACTUAL_DDL_REHEARSAL_PASS_NOT_PRODUCTION_APPLY', productionConnections: 0, backupSha256: backup.backupSha256, relationDeletes: plan.relationDeletes.length, drops: plan.drops.length, dropMode: 'RESTRICT', rollback: 'PASS', preservedNonTargetRelations: 4 }))
} finally { await db.end() }
