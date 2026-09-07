import assert from 'node:assert/strict'
import { readFile, mkdtemp } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { c0QueryFiles } from './phase21-c0-package.mjs'
import { createC0Evidence } from './phase21-c0-evidence.mjs'
import { executeC0 } from './phase21-c0-execute.mjs'

assert.equal(process.version, 'v20.20.2')
assert.equal(process.env.DATABASE_URI, undefined, 'No inherited credentials permitted')
assert.deepEqual(process.argv.slice(2), ['--local-synthetic-only'])
const require = createRequire(import.meta.resolve('@payloadcms/db-postgres'))
const { Client } = require('pg')
const connectionString = 'postgresql://postgres:synthetic@127.0.0.1:55441/postgres'
const setup = new Client({ connectionString, connectionTimeoutMillis: 3000, query_timeout: 10000 })
await setup.connect()
let tables
try {
  assert.equal((await setup.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'")).rows[0].n, 0, 'Disposable database must be empty')
  const fixture = (await readFile('src/scripts/phase21-c0-mapping-rehearsal.sql', 'utf8')).split('-- C0_QUERY_FUNCTION')[0]
    .replace(/^\\.*$/gm, '').replace(/^BEGIN;$/m, '').replaceAll('CREATE TEMP TABLE', 'CREATE TABLE')
  await setup.query(fixture)
  await setup.query("CREATE ROLE anon; CREATE ROLE authenticated; CREATE TABLE payload_migrations(id integer PRIMARY KEY,name text,batch integer); INSERT INTO payload_migrations VALUES (1,'dev',-1),(2,'synthetic',1)")
  tables = (await setup.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows.map((r) => r.tablename)
  for (const table of tables) {
    assert(/^[a-z_]+$/.test(table))
    await setup.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`)
  }
} finally { await setup.end() }
const queries = Object.fromEntries(await Promise.all(Object.entries(c0QueryFiles).map(async ([key,file]) => [key,await readFile(`docs/phase-artifacts/phase-21/${file}`, 'utf8')])))
const parent = await mkdtemp(join(tmpdir(), 'phase21-c0-pg-'))
const evidence = await createC0Evidence(parent, 'c0-20260905T010203004Z')
const client = new Client({ connectionString, options: '-c default_transaction_read_only=on -c statement_timeout=15000', connectionTimeoutMillis: 3000, query_timeout: 20000 })
const result = await executeC0(client, queries, { tables, migrations: ['synthetic'] }, evidence)
assert.equal(result.status, 'C0_INVENTORY_READBACK_PASS_NOT_CLEANUP_APPROVAL')
const snapshot = JSON.parse(await readFile(result.receipt.file, 'utf8'))
assert.equal(snapshot.parents.length, 3)
assert.equal(snapshot.highlights.length, 2)
assert(snapshot.highlights.every((row) => row.mapping_status === 'UNMAPPED_NO_STABLE_LINK'))
assert.equal(snapshot.itinerary.length, 5)
console.log(JSON.stringify({ status: 'C0_REAL_PG_LIFECYCLE_PASS', productionConnections: 0, queryCount: result.queryCount, privateSyntheticReceipt: result.receipt.file }))
