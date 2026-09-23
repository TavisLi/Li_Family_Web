import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

import { backupFromSnapshot, bootstrapSql, retirementPlan } from './run-executor-retirement-plan.mjs'

const [runDirectory] = process.argv.slice(2)
assert(runDirectory && process.argv.length === 3, 'Usage: node src/scripts/run-executor-fixture.mjs <run-directory>')
assert.equal(process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH, 'false', 'BLOCK: schema push')
const url = new URL(process.env.DATABASE_URI ?? '')
assert.equal(url.hostname, '127.0.0.1', 'BLOCK: fixture must use loopback')
assert.equal(url.port, '55444', 'BLOCK: fixture port')
assert.equal(url.pathname, '/issue105', 'BLOCK: fixture database')
const require = createRequire(import.meta.resolve('@payloadcms/db-postgres'))
const { Client } = require('pg')
const client = new Client({ connectionString: url.toString(), connectionTimeoutMillis: 5000,
  query_timeout: 10000, application_name: 'issue105-disposable-fixture' })
await client.connect()
try {
  await client.query('BEGIN')
  await client.query(bootstrapSql)
  let count = 0
  const query = async (_name, sql, values) => {
    assert(++count <= 100, 'BLOCK: fixture query budget')
    const result = await client.query(sql, values)
    assert(result.rows.length <= 20, 'BLOCK: fixture row cap')
    assert(Buffer.byteLength(JSON.stringify({ rows: result.rows, rowCount: result.rowCount })) <= 65536,
      'BLOCK: fixture response byte cap')
    return result.rows
  }
  const readPages = async (name, sql, values, cursorOf) => {
    const rows = []
    let cursor = null
    do {
      const next = await query(name, sql, values(cursor, 20))
      if (!next.length) break
      const last = cursorOf(next.at(-1))
      assert(cursor === null || last > cursor, 'BLOCK: fixture cursor')
      rows.push(...next)
      cursor = last
      if (next.length < 20) break
    } while (true)
    return rows
  }
  const snapshot = await retirementPlan.snapshot({ query, readPages })
  const backup = backupFromSnapshot(snapshot)
  await writeFile(path.join(runDirectory, 'backup.json'), `${JSON.stringify(backup, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
  await client.query('COMMIT')
  console.log(JSON.stringify({ status: 'DISPOSABLE_FIXTURE_READY', queryCount: count,
    targetRows: snapshot.targetRows.length, protectedRows: snapshot.protectedRows.length,
    legacyRows: snapshot.legacyRows.length, canonicalRows: snapshot.canonicalRows.length,
    backupSha256: backup.snapshotSha256 }))
} catch (error) {
  await client.query('ROLLBACK').catch(() => {})
  throw error
} finally { await client.end() }
