import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { lstat, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

assert.equal(process.version, 'v20.20.2')
assert.equal(process.env.DATABASE_URI, undefined, 'Production credentials prohibited')
assert.equal(process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH, 'false')
const [flag, backupPath] = process.argv.slice(2)
assert.equal(flag, '--local-private-backup')
assert(/^\.phase21-private\/retirement-backup-[0-9T-]+Z\/backup\.json$/.test(backupPath), 'BLOCK: private backup path')
const info = await lstat(backupPath)
assert(info.isFile() && !info.isSymbolicLink() && (info.mode & 0o777) === 0o600, 'BLOCK: private backup file')
const backup = JSON.parse(await readFile(backupPath, 'utf8'))
assert.equal(backup.status, 'SCOPED_RETIREMENT_BACKUP_PASS_NOT_CLEANUP_APPROVAL')
const columnMetadata = backup.snapshot.metadata.columns
const tableNames = [...new Set(columnMetadata.map(row => row.table_name))].sort()
assert.equal(tableNames.length, 10)
const safeName = value => { assert(/^[a-z_]+$/.test(value), 'BLOCK: identifier'); return `"${value}"` }
const sqlType = row => {
  if (row.data_type === 'USER-DEFINED') { assert.equal(row.udt_name, '_locales'); return '"_locales"' }
  assert(['integer', 'character varying', 'numeric', 'timestamp with time zone'].includes(row.data_type), 'BLOCK: column type')
  return row.data_type
}
const stable = value => Array.isArray(value)
  ? `[${value.map(stable).sort().join(',')}]`
  : value && typeof value === 'object'
    ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`
    : JSON.stringify(value)
const hashRows = (table, rows) => {
  // pg returns NUMERIC as a string via a direct row query, while to_jsonb
  // restores it as a JSON number. Normalize only declared NUMERIC columns.
  const numeric = new Set(columnMetadata.filter(row => row.table_name === table && row.data_type === 'numeric').map(row => row.column_name))
  return createHash('sha256').update(stable(rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, numeric.has(key) && value !== null ? String(value) : value]))))).digest('hex')
}
const require = createRequire(import.meta.resolve('@payloadcms/db-postgres'))
const { Client } = require('pg')
const db = new Client({ connectionString: 'postgresql://postgres:synthetic@127.0.0.1:55443/postgres', connectionTimeoutMillis: 3000, query_timeout: 15000 })
await db.connect()
try {
  await db.query("CREATE TYPE \"_locales\" AS ENUM ('zh-TW','en')")
  for (const table of tableNames) {
    const columns = columnMetadata.filter(row => row.table_name === table).sort((a, b) => a.ordinal_position - b.ordinal_position)
    await db.query(`CREATE TABLE ${safeName(table)} (${columns.map(row => `${safeName(row.column_name)} ${sqlType(row)}`).join(', ')})`)
  }
  const sourceRows = {
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
  for (const table of tableNames) {
    const rows = sourceRows[table]
    assert(Array.isArray(rows), `BLOCK: missing ${table}`)
    if (rows.length) await db.query(`INSERT INTO ${safeName(table)} SELECT * FROM json_populate_recordset(NULL::${safeName(table)}, $1::json)`, [JSON.stringify(rows)])
    const restored = (await db.query(`SELECT to_jsonb(t) row FROM ${safeName(table)} t`)).rows.map(row => row.row)
    assert.equal(hashRows(table, restored), hashRows(table, rows), `BLOCK: restore row hash ${table}`)
  }
  console.log(JSON.stringify({ status: 'SCOPED_RETIREMENT_BACKUP_LOCAL_ROWS_RESTORE_PASS', sourceBackupSha256: backup.backupSha256, tables: tableNames.length, rows: Object.values(sourceRows).reduce((total, rows) => total + rows.length, 0), productionConnections: 0, limits: 'synthetic-local-schema-row-content-only' }))
} finally { await db.end() }
