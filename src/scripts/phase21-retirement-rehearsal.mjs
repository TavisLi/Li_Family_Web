import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, mkdtemp, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { retirementTables, retirementDeletes } from './phase21-retirement-scope.mjs'

// Intentionally no Production mode, env-file loading, migration registration,
// connection argument, container creation, or automatic retry.
assert.equal(process.version, 'v20.20.2')
assert.deepEqual(process.argv.slice(2), ['--local-synthetic-only'])
assert.equal(process.env.DATABASE_URI, undefined, 'Inherited DB credentials prohibited')
assert.equal(process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH, 'false')
const container = 'li-family-phase21-retirement-rehearsal'
const require = createRequire(import.meta.resolve('@payloadcms/db-postgres'))
const { Client } = require('pg')
const { requireDrizzleKit, defaultDrizzleSnapshot } = await import(require.resolve('@payloadcms/drizzle/postgres'))
const client = new Client({ connectionString: 'postgresql://postgres:synthetic@127.0.0.1:55442/postgres', connectionTimeoutMillis: 3000, query_timeout: 20000 })
const privateDir = await mkdtemp(join(tmpdir(), 'phase21-retirement-synthetic-'))
const hash = data => createHash('sha256').update(data).digest('hex')
await client.connect()
try {
  assert.equal((await client.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'")).rows[0].n, 0, 'Rehearsal requires an empty disposable DB')
  await client.query("SET statement_timeout='15s'; SET TIME ZONE 'UTC'")
  const snapshot = JSON.parse(await readFile('src/migrations/20260802_061812_phase_19_travel_memory_multi_page.json', 'utf8'))
  const ddl = await requireDrizzleKit().generateMigration(defaultDrizzleSnapshot, snapshot)
  await client.query(ddl.join('\n'))
  await client.query(`
    INSERT INTO travel_memories(id,slug) VALUES(1,'209901-synthetic-memory'),(2,'209902-preserved-memory');
    INSERT INTO _travel_memories_v(id,parent_id) VALUES(19,1),(20,2);
    CREATE ROLE retirement_reader;
  `)
  for (const version of [false, true]) {
    const prefix = version ? '_travel_memories_v_version' : 'travel_memories'
    const parentId = version ? 19 : 1
    const dayId = version ? 10 : 'synthetic-day'
    const segmentId = version ? 11 : 'synthetic-segment'
    await client.query(`INSERT INTO "${prefix}_daily_highlights" (_order,_parent_id,id,day) VALUES(1,$1,$2,1)`, [parentId, dayId])
    await client.query(`INSERT INTO "${prefix}_daily_highlights_segments" (_order,_parent_id,id,time) VALUES(1,$1,$2,'09:00')`, [dayId, segmentId])
    await client.query(`INSERT INTO "${prefix}_daily_highlights_locales" (_locale,_parent_id,title,story) VALUES('zh-TW',$1,'合成測試','不得上傳的合成正文'),('en',$1,'Synthetic','Synthetic story')`, [dayId])
    await client.query(`INSERT INTO "${prefix}_daily_highlights_segments_locales" (_locale,_parent_id,activity) VALUES('zh-TW',$1,'合成活動')`, [segmentId])
    const table = version ? '_travel_memories_v_rels' : 'travel_memories_rels'
    const pathPrefix = version ? 'version.' : ''
    await client.query(`INSERT INTO "${table}" (id,parent_id,path) VALUES (11,$1,$2),(12,$1,$3),(13,$1,$4),(14,$1,$5),(15,$6,$2)`, [parentId, pathPrefix + 'itineraryImages', pathPrefix + 'dailyHighlights.0.mediaItems', pathPrefix + 'galleryImages', pathPrefix + 'storySections.0.mediaItems', version ? 20 : 2])
  }
  for (const table of retirementTables) {
    await client.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY; GRANT SELECT ON "${table}" TO retirement_reader; CREATE POLICY synthetic_read ON "${table}" FOR SELECT TO retirement_reader USING (true)`)
  }
  const shared = ['travel_memories_rels', '_travel_memories_v_rels']
  const rows = async table => (await client.query(`SELECT to_jsonb(t) row FROM "${table}" t ORDER BY id`)).rows.map(r => r.row)
  const security = async () => (await client.query(`SELECT c.relname,c.relrowsecurity,c.relforcerowsecurity,c.relacl::text,
    (SELECT jsonb_agg(pg_get_constraintdef(oid) ORDER BY conname) FROM pg_constraint WHERE conrelid=c.oid) constraints,
    (SELECT jsonb_agg(jsonb_build_object('name',polname,'roles',polroles::text,'qual',pg_get_expr(polqual,polrelid)) ORDER BY polname) FROM pg_policy WHERE polrelid=c.oid) policies
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=ANY($1) ORDER BY c.relname`, [retirementTables])).rows
  const state = async () => {
    const records = {}
    for (const table of [...retirementTables, ...shared, 'travel_memories', '_travel_memories_v']) records[table] = await rows(table)
    const sequences = {}
    for (const table of retirementTables) {
      const name = (await client.query('SELECT pg_get_serial_sequence($1, $2) name', [table, 'id'])).rows[0].name
      if (name) {
        assert(/^public\.[a-z_]+$/.test(name))
        sequences[name] = (await client.query(`SELECT last_value::text,is_called FROM ${name}`)).rows[0]
      }
    }
    return { rows: records, security: await security(), sequences }
  }
  const before = await state()
  const selected = Object.fromEntries(shared.map(table => [table, before.rows[table].filter(row => [11, 12].includes(row.id))]))
  const dump = execFileSync('docker', ['exec', container, 'pg_dump', '-U', 'postgres', '--no-owner', ...retirementTables.flatMap(table => ['--table', `public.${table}`]), 'postgres'], { maxBuffer: 1024 * 1024, timeout: 30000 })
  await writeFile(join(privateDir, 'legacy.sql'), dump, { flag: 'wx', mode: 0o600 })
  await writeFile(join(privateDir, 'relations.json'), JSON.stringify(selected), { flag: 'wx', mode: 0o600 })
  const apply = async () => {
    for (const statement of retirementDeletes(selected)) assert.equal((await client.query(statement.text, statement.values)).rowCount, JSON.parse(statement.values[0]).length)
    for (const table of retirementTables) await client.query(`DROP TABLE public."${table}" RESTRICT`)
  }
  await client.query('BEGIN')
  await client.query('CREATE TABLE unexpected_consumer (legacy_id varchar REFERENCES travel_memories_daily_highlights(id))')
  await assert.rejects(apply(), error => error.code === '2BP01')
  await client.query('ROLLBACK')
  assert.deepEqual(await state(), before, 'Dependency failure escaped transaction rollback')
  // Rollback and non-target preservation are separate from dump restore.
  await client.query('BEGIN')
  await apply()
  await client.query('ROLLBACK')
  assert.deepEqual(await state(), before, 'Transaction rollback changed state')
  await client.query('BEGIN')
  await apply()
  await client.query('COMMIT')
  for (const table of shared) assert.deepEqual(await rows(table), before.rows[table].filter(row => ![11, 12].includes(row.id)), 'Unrelated relations changed')
  execFileSync('docker', ['exec', '-i', container, 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '--single-transaction', '-U', 'postgres', '-d', 'postgres'], { input: dump, maxBuffer: 1024 * 1024, timeout: 30000 })
  for (const table of shared) await client.query(`INSERT INTO "${table}" SELECT * FROM json_populate_recordset(NULL::"${table}",$1::json)`, [JSON.stringify(selected[table])])
  assert.deepEqual(await state(), before, 'Backup restore changed rows/FK/RLS/grants/policies')
  const receipt = { status: 'SYNTHETIC_RETIREMENT_RESTORE_PASS_NOT_PRODUCTION_BACKUP', productionConnections: 0,
    tables: retirementTables.length, relationRowsDeletedAndRestored: 4, preservedRelationRows: 6,
    backupSha256: hash(dump), beforeAfterSha256: hash(JSON.stringify(before)),
    checks: ['exact-row-delete', 'drop-restrict-dependency-failure', 'transaction-rollback', 'unrelated-relations', 'dump-restore', 'rows-fk-rls-grants-policies-sequences'],
    privateSyntheticEvidence: privateDir }
  await writeFile(join(privateDir, 'receipt.json'), JSON.stringify(receipt, null, 2), { flag: 'wx', mode: 0o600 })
  console.log(JSON.stringify(receipt))
} finally { await client.end() }
