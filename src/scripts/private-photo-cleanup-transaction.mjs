import assert from 'node:assert/strict'
import { assertMediaForeignKeys } from './private-photo-foreign-keys.mjs'
import { assertFixtureReferences } from './private-photo-reference-check.mjs'
import { deleteFixtureMediaSql } from './private-photo-cleanup-writer.mjs'

// Disposable rehearsal only. A Production session additionally requires #105
// admission, a bound schema/role, bounded I/O and independent readback.
export async function rehearseFixtureCleanup({ environment, client, snapshot, sql, expectedReferences, fixture, guard }) {
  assert.equal(environment, 'disposable', 'BLOCK: disposable transaction only')
  assert(/^\/private\/tmp\/family-cleanup-int\.[A-Za-z0-9]+$/.test(client.connectionParameters?.host ?? '') &&
    Number(client.connectionParameters?.port) === 55494 && client.connectionParameters?.database === 'postgres',
  'BLOCK: isolated database socket required')
  let begun = false
  let commitSent = false
  try {
    guard()
    await client.query('BEGIN')
    begun = true
    guard()
    const foreignKeys = await client.query(sql.foreignKeys)
    assertMediaForeignKeys(snapshot, foreignKeys.rows)
    const locked = await client.query('SELECT id, family_asset_key FROM public.media WHERE id = $1 FOR UPDATE', [fixture.mediaId])
    assert.equal(locked.rows.length, 1, 'BLOCK: fixture missing')
    assert.equal(locked.rows[0].family_asset_key, fixture.familyAssetKey, 'BLOCK: fixture identity drift')
    const refs = await client.query(sql.references, [fixture.mediaId])
    const locales = await client.query('SELECT _locale, alt_text FROM public.media_locales WHERE _parent_id = $1', [fixture.mediaId])
    assertFixtureReferences({ expectedReferences, rows: refs.rows, locales: locales.rows, locale: fixture.locale, altText: fixture.altText })
    guard()
    const removed = await client.query(deleteFixtureMediaSql, [fixture.mediaId, fixture.familyAssetKey])
    assert.equal(removed.rowCount, 1, 'BLOCK: fixture delete count')
    assert.equal(removed.rows[0]?.id, fixture.mediaId, 'BLOCK: fixture delete identity')
    guard()
    commitSent = true
    await client.query('COMMIT')
    return { status: 'PASS', commitState: 'COMMITTED' }
  } catch (error) {
    if (commitSent) return { status: 'UNKNOWN', commitState: 'UNKNOWN' }
    if (begun) {
      try { await client.query('ROLLBACK') }
      catch { return { status: 'UNKNOWN', commitState: 'ROLLBACK_UNKNOWN' } }
    }
    return { status: 'BLOCK', commitState: begun ? 'ROLLED_BACK' : 'NOT_STARTED', reason: error.message }
  }
}

// Isolated rehearsal only: a failed object operation leaves a partial result
// for independent reconciliation; it never retries or continues to later keys.
export async function rehearseCompleteFixtureCleanup({ environment, client, independentReader, objectWriter, objectReader,
  snapshot, sql, expectedReferences, fixture, objects, bucket, guard }) {
  assert.equal(environment, 'disposable', 'BLOCK: disposable cleanup only')
  assert.notEqual(client, independentReader, 'BLOCK: independent database reader required')
  assert.deepEqual({ host: independentReader.connectionParameters?.host, port: independentReader.connectionParameters?.port,
    database: independentReader.connectionParameters?.database },
  { host: client.connectionParameters?.host, port: client.connectionParameters?.port, database: client.connectionParameters?.database },
  'BLOCK: independent reader target drift')
  assert.notEqual(objectWriter, objectReader, 'BLOCK: independent object reader required')
  const expected = ['original', 'thumbnail', 'medium', 'large']
    .map(variant => `family-media/${fixture.familyAssetKey}/${variant}.jpeg`)
  assert.deepEqual(objects, expected, 'BLOCK: object roster drift')
  const database = await rehearseFixtureCleanup({ environment, client, snapshot, sql, expectedReferences, fixture, guard })
  if (database.status !== 'PASS') return { status: database.status, database, deletedObjects: 0 }
  try {
    guard()
    const result = await independentReader.query('SELECT id FROM public.media WHERE id = $1', [fixture.mediaId])
    assert.equal(result.rows.length, 0, 'BLOCK: database readback mismatch')
  } catch {
    return { status: 'UNKNOWN', database, deletedObjects: 0, reason: 'DATABASE_READBACK_UNKNOWN' }
  }
  let deletedObjects = 0
  for (const key of expected) {
    try {
      guard()
      await objectWriter.deleteObject(bucket, key)
      guard()
      assert.equal(await objectReader.objectState(bucket, key), 'ABSENT', 'BLOCK: object readback unknown')
      deletedObjects++
    } catch {
      return { status: 'UNKNOWN', database, deletedObjects, reason: 'OBJECT_CLEANUP_UNKNOWN' }
    }
  }
  return { status: 'PASS', database, deletedObjects }
}
