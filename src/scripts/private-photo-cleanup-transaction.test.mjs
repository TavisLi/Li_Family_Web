import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { rehearseCompleteFixtureCleanup, rehearseFixtureCleanup } from './private-photo-cleanup-transaction.mjs'

const snapshot = JSON.parse(await readFile('src/migrations/20261120_112809_family_media_key.json', 'utf8'))
const refsSql = await readFile('src/scripts/private-photo-media-reference-counts.sql', 'utf8')
const expectedReferences = [...refsSql.matchAll(/SELECT '([^']+)'::text AS reference/g)].map(([, name]) => name)
const foreignKeys = []
for (const [name, table] of Object.entries(snapshot.tables)) for (const fk of Object.values(table.foreignKeys ?? {})) {
  if (fk.tableTo === 'media') foreignKeys.push({ source_schema: 'public', source_table: name.slice(7), source_columns: fk.columnsFrom,
    target_columns: fk.columnsTo, delete_action: { cascade: 'c', 'set null': 'n' }[fk.onDelete], validated: true })
}
const fixture = { mediaId: 7, familyAssetKey: 'a'.repeat(64), locale: 'zh-TW', altText: 'synthetic' }
const connectionParameters = { host: '/private/tmp/family-cleanup-int.fixture', port: 55494, database: 'postgres' }
function makeClient({ linked = false, commitFails = false, rollbackFails = false } = {}) {
  const calls = []
  return { calls, connectionParameters, async query(query) {
    calls.push(query)
    if (query === 'fk') return { rows: foreignKeys }
    if (query.startsWith('SELECT id')) return { rows: [{ id: 7, family_asset_key: fixture.familyAssetKey }] }
    if (query === 'refs') return { rows: expectedReferences.map(reference => ({ reference,
      row_count: reference === 'media_locales._parent_id' || (linked && reference === 'users.avatar_id') ? '1' : '0' })) }
    if (query.startsWith('SELECT _locale')) return { rows: [{ _locale: fixture.locale, alt_text: fixture.altText }] }
    if (query.startsWith('DELETE')) return { rowCount: 1, rows: [{ id: 7 }] }
    if (query === 'COMMIT' && commitFails) throw Error('unknown')
    if (query === 'ROLLBACK' && rollbackFails) throw Error('unknown')
    return { rows: [] }
  } }
}
const run = client => rehearseFixtureCleanup({ environment: 'disposable', client, snapshot,
  sql: { foreignKeys: 'fk', references: 'refs' }, expectedReferences, fixture, guard() {} })

test('locks, checks references and commits only the fixture', async () => {
  const client = makeClient()
  assert.deepEqual(await run(client), { status: 'PASS', commitState: 'COMMITTED' })
  assert(client.calls.some(query => query.endsWith('FOR UPDATE')))
  assert.equal(client.calls.at(-1), 'COMMIT')
})
test('reference drift rolls back before deletion', async () => {
  const client = makeClient({ linked: true })
  assert.equal((await run(client)).commitState, 'ROLLED_BACK')
  assert(!client.calls.some(query => query.startsWith('DELETE')))
  assert.equal(client.calls.at(-1), 'ROLLBACK')
})
test('unknown commit or rollback never reports success', async () => {
  assert.equal((await run(makeClient({ commitFails: true }))).commitState, 'UNKNOWN')
  assert.equal((await run(makeClient({ linked: true, rollbackFails: true }))).commitState, 'ROLLBACK_UNKNOWN')
})

test('object failure stops after the last verified deletion without retry', async () => {
  const objects = ['original', 'thumbnail', 'medium', 'large'].map(variant => `family-media/${fixture.familyAssetKey}/${variant}.jpeg`)
  const attempts = []
  const result = await rehearseCompleteFixtureCleanup({ environment: 'disposable', client: makeClient(),
    independentReader: { connectionParameters, query: async () => ({ rows: [] }) },
    objectWriter: { deleteObject: async (bucket, key) => { attempts.push(key); if (attempts.length === 2) throw Error('unknown') } },
    objectReader: { objectState: async () => 'ABSENT' }, snapshot, sql: { foreignKeys: 'fk', references: 'refs' },
    expectedReferences, fixture, objects, bucket: 'fixture', guard() {} })
  assert.equal(result.status, 'UNKNOWN')
  assert.equal(result.deletedObjects, 1)
  assert.deepEqual(attempts, objects.slice(0, 2))
})
