import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { rehearseCompleteFixtureCleanup } from './private-photo-cleanup-transaction.mjs'

const socket = process.env.FAMILY_CLEANUP_TEST_SOCKET
assert(/^\/private\/tmp\/family-cleanup-int\.[A-Za-z0-9]+$/.test(socket ?? ''), 'BLOCK: isolated socket required')
const require = createRequire(import.meta.resolve('@payloadcms/db-postgres'))
const { Client } = require('pg')
const config = { host: socket, port: 55494, database: 'postgres', user: process.env.USER, connectionTimeoutMillis: 3000 }
const writer = new Client(config)
const reader = new Client(config)
const snapshot = JSON.parse(await readFile('src/migrations/20261120_112809_family_media_key.json', 'utf8'))
const sql = { foreignKeys: await readFile('src/scripts/private-photo-media-foreign-keys.sql', 'utf8'),
  references: await readFile('src/scripts/private-photo-media-reference-counts.sql', 'utf8') }
const expectedReferences = [...sql.references.matchAll(/SELECT '([^']+)'::text AS reference/g)].map(([, name]) => name)
const tables = new Map()
for (const [name, table] of Object.entries(snapshot.tables)) for (const fk of Object.values(table.foreignKeys ?? {})) {
  if (fk.tableTo !== 'media') continue
  assert(name.startsWith('public.') && fk.columnsFrom.length === 1 && ['cascade', 'set null'].includes(fk.onDelete))
  const tableName = name.slice(7)
  assert(/^[a-z_]+$/.test(tableName) && /^[a-z_]+$/.test(fk.columnsFrom[0]))
  if (!tables.has(tableName)) tables.set(tableName, [])
  tables.get(tableName).push({ column: fk.columnsFrom[0], onDelete: fk.onDelete })
}
try {
  await writer.connect()
  await reader.connect()
  await writer.query('CREATE TABLE public.media (id integer PRIMARY KEY, family_asset_key text)')
  for (const [name, cols] of tables) {
    const columns = cols.map(({ column, onDelete }) => `"${column}" integer REFERENCES public.media(id) ON DELETE ${onDelete.toUpperCase()}`)
    if (name === 'media_locales') columns.push('_locale text', 'alt_text text')
    await writer.query(`CREATE TABLE public."${name}" (${columns.join(', ')})`)
  }
  const fixture = { mediaId: 7, familyAssetKey: 'a'.repeat(64), locale: 'zh-TW', altText: 'synthetic' }
  await writer.query('INSERT INTO public.media VALUES ($1, $2)', [fixture.mediaId, fixture.familyAssetKey])
  await writer.query('INSERT INTO public.media VALUES ($1, $2)', [8, 'b'.repeat(64)])
  await writer.query('INSERT INTO public.users (avatar_id) VALUES ($1)', [8])
  await writer.query('INSERT INTO public.media_locales (_parent_id, _locale, alt_text) VALUES ($1, $2, $3)',
    [fixture.mediaId, fixture.locale, fixture.altText])
  const objects = ['original', 'thumbnail', 'medium', 'large'].map(variant => `family-media/${fixture.familyAssetKey}/${variant}.jpeg`)
  const stored = new Set(objects)
  const objectWriter = { async deleteObject(bucket, key) { assert.equal(bucket, 'fixture'); assert(stored.delete(key)) } }
  const objectReader = { async objectState(bucket, key) { assert.equal(bucket, 'fixture'); return stored.has(key) ? 'FOUND' : 'ABSENT' } }
  const result = await rehearseCompleteFixtureCleanup({ environment: 'disposable', client: writer, independentReader: reader,
    objectWriter, objectReader, snapshot, sql, expectedReferences, fixture, objects, bucket: 'fixture', guard() {} })
  assert.deepEqual(result, { status: 'PASS', database: { status: 'PASS', commitState: 'COMMITTED' }, deletedObjects: 4 })
  assert.equal(stored.size, 0)
  const preserved = await reader.query('SELECT avatar_id FROM public.users')
  assert.deepEqual(preserved.rows, [{ avatar_id: 8 }])
  console.log(JSON.stringify({ status: 'PASS_LOCAL_ONLY', foreignKeys: 25, deletedMedia: 1, verifiedObjectsAbsent: 4, nonTargetReferencePreserved: true }))
} finally {
  await Promise.allSettled([writer.end(), reader.end()])
}
