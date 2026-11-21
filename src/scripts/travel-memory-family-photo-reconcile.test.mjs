import assert from 'node:assert/strict'
import test from 'node:test'
import { familyPhotoObjectKey, familyPhotoVariants } from '../payload/family-media.ts'
import { exactFamilyMediaSelect, observeFamilyMedia } from './travel-memory-family-media-read.mjs'
import { observeFamilyPhotoObjects } from './travel-memory-family-photo-object-read.mjs'
import { familyPhotoObservationBinding, reconcileFamilyPhotos, reconcileFamilyPhotoSnapshots } from './travel-memory-family-photo-reconcile.mjs'

function fixture(size = 1) {
  const scope = { slug: 'fixture-family', locale: 'zh-TW', environment: 'production',
    accountId: 'a'.repeat(32), bucket: 'fixture-family-bucket',
    target: { projectRef: 'p'.repeat(20), database: 'postgres', schema: 'public' } }
  const assets = Array.from({ length: size }, (_, index) => ({
    assetId: 'sha256:' + (index + 1).toString(16).padStart(64, '0'),
    filename: 'fixture.jpeg', files: ['fixture.jpeg'], byteSize: 100,
    mimeType: 'image/jpeg', width: 100, height: 100, provenance: 'local-file', locators: [],
  }))
  const entries = assets.map(asset => ({
    assetId: asset.assetId, altTextSha256: 'b'.repeat(64),
    objects: familyPhotoVariants.map((variant, index) => ({
      key: familyPhotoObjectKey(asset.assetId.slice(7), variant), variant,
      bytes: index === 0 ? 100 : 50, sha256: index === 0 ? asset.assetId.slice(7) : 'c'.repeat(64),
      mimeType: 'image/jpeg',
    })),
  }))
  const prepared = { slug: scope.slug, assets: size, entries,
    objectCount: size * 4, originalBytes: size * 100, derivativeBytes: size * 150 }
  const absent = { state: 'ABSENT_CONFIRMED' }
  const observations = { scope: structuredClone(scope), entries: entries.map(entry => ({
    assetId: entry.assetId, media: { ...absent }, objects: entry.objects.map(object => ({ key: object.key, ...absent })),
  })) }
  return { scope, prepared, registry: { version: 1, travelSlug: scope.slug, assets }, observations }
}

test('only explicit absence makes the full 842-asset candidate eligible for create review', () => {
  const input = fixture(842)
  const ready = reconcileFamilyPhotos(input)
  assert.deepEqual([ready.status, ready.assets, ready.objectCount, ready.totalBytes, ready.counts.REVIEW_CREATE],
    ['READY_FOR_REVIEW', 842, 3368, 210500, 842])

  input.observations.entries[0].objects.pop()
  input.observations.entries.pop()
  const incomplete = reconcileFamilyPhotos(input)
  assert.deepEqual([incomplete.status, incomplete.counts.UNKNOWN], ['BLOCK', 2])
  assert.equal(reconcileFamilyPhotos({ ...input, observations: null }).counts.UNKNOWN, 842)
})

test('per-photo reuse requires the exact unowned family row and complete byte readback', () => {
  const input = fixture()
  const [entry] = input.prepared.entries
  const [seen] = input.observations.entries
  seen.media = { state: 'FOUND', id: 123, familyAssetKey: entry.assetId.slice(7), ownerId: null,
    sourcePath: null, publicStorage: false, type: 'photo', mimeType: 'image/jpeg',
    bytes: 100, altTextSha256: entry.altTextSha256 }
  seen.objects = entry.objects.map(object => ({ ...object, state: 'FOUND' }))
  assert.equal(reconcileFamilyPhotos(input).rows[0].decision, 'REUSE_MEDIA')
  seen.media.ownerId = 99
  assert.equal(reconcileFamilyPhotos(input).rows[0].decision, 'BLOCK_CONFLICT')
  seen.media.ownerId = null
  delete seen.objects[0].sha256
  assert.equal(reconcileFamilyPhotos(input).rows[0].decision, 'UNKNOWN')
  seen.objects[0].sha256 = 'd'.repeat(64)
  assert.equal(reconcileFamilyPhotos(input).rows[0].decision, 'BLOCK_CONFLICT')
})

test('partial assets go to recovery review and out-of-scope identities never match', () => {
  const input = fixture()
  const [entry] = input.prepared.entries
  const [seen] = input.observations.entries
  seen.objects[0] = { ...entry.objects[0], state: 'FOUND' }
  assert.equal(reconcileFamilyPhotos(input).rows[0].decision, 'REVIEW_RECOVERY')
  seen.objects.push(seen.objects[0])
  assert.throws(() => reconcileFamilyPhotos(input), /duplicate identity/)
  seen.objects.pop()
  seen.objects[0].key = 'elsewhere.jpeg'
  assert.throws(() => reconcileFamilyPhotos(input), /unexpected or duplicate identity/)
  input.observations.scope.bucket = 'wrong-bucket'
  assert.throws(() => reconcileFamilyPhotos(input), /scope drift/)
})

test('the exact Media reader observes 842 IDs in nine bounded queries', async () => {
  const { scope, prepared } = fixture(842)
  const batchSizes = []
  const result = await observeFamilyMedia({
    entries: prepared.entries, slug: scope.slug, locale: scope.locale, guard() {},
    verifyVisibility: async () => true,
    async query(text, [keys, aliases, locale]) {
      assert.equal(text, exactFamilyMediaSelect)
      assert.equal(locale, scope.locale)
      batchSizes.push(keys.length)
      assert.deepEqual(aliases, Array(keys.length).fill(null))
      return { rows: keys.map(key => ({ requested_key: key, id: null })) }
    },
  })
  assert.deepEqual(batchSizes, [100, 100, 100, 100, 100, 100, 100, 100, 42])
  assert.equal(result.length, 842)
  assert(result.every(item => item.media.state === 'ABSENT_CONFIRMED'))
})

test('Media visibility denial and incomplete result coverage never produce absence', async () => {
  const { scope, prepared } = fixture()
  let calls = 0
  const options = { entries: prepared.entries, slug: scope.slug, locale: scope.locale,
    guard() {}, async query() { calls++; return { rows: [] } } }
  await assert.rejects(observeFamilyMedia({ ...options, verifyVisibility: async () => false }), /visibility unproven/)
  assert.equal(calls, 0)
  await assert.rejects(observeFamilyMedia({ ...options, verifyVisibility: async () => true }), /missing Media coverage/)
  assert.equal(calls, 1)
})

test('SQL and R2 observations join only after both receipts bind the same approved roster', async () => {
  const { scope, prepared, registry } = fixture(2)
  const input = { scope, prepared, registry }
  const binding = familyPhotoObservationBinding(input)
  const mediaRows = await observeFamilyMedia({ entries: prepared.entries, slug: scope.slug, locale: scope.locale,
    guard() {}, verifyVisibility: async () => true,
    async query(text, [keys]) {
      assert.equal(text, exactFamilyMediaSelect)
      return { rows: keys.map(key => ({ requested_key: key, id: null })) }
    },
  })
  const objectRows = new Map(prepared.entries.map(({ assetId }) => [assetId, { assetId, objects: [] }]))
  await observeFamilyPhotoObjects({ entries: prepared.entries, bucket: scope.bucket, guard() {},
    signal: AbortSignal.timeout(1000),
    storage: { config: { maxAttempts: async () => 1 }, async send() {
      throw Object.assign(new Error('fixture'), { name: 'NoSuchKey', $metadata: { httpStatusCode: 404 } })
    } },
    saveObservation: async (assetId, row) => { objectRows.get(assetId).objects.push(row) },
  })

  const mediaSnapshot = { binding, status: 'PASS', rollback: 'CONFIRMED', entries: mediaRows }
  const objectSnapshot = { binding, status: 'PASS', entries: [...objectRows.values()] }
  const result = reconcileFamilyPhotoSnapshots({ ...input, mediaSnapshot, objectSnapshot })
  assert.equal(result.status, 'READY_FOR_REVIEW')
  assert.equal(result.counts.REVIEW_CREATE, 2)
  assert.match(result.evidence.mediaSnapshotSha256, /^[a-f0-9]{64}$/)
  assert.match(result.evidence.objectSnapshotSha256, /^[a-f0-9]{64}$/)

  const failedMedia = { ...mediaSnapshot, rollback: 'UNKNOWN' }
  assert.throws(() => reconcileFamilyPhotoSnapshots({ ...input, mediaSnapshot: failedMedia, objectSnapshot }), /confirmed rollback/)
  const driftedScope = { ...binding, scope: { ...scope, bucket: 'other-bucket' } }
  assert.throws(() => reconcileFamilyPhotoSnapshots({ ...input, mediaSnapshot, objectSnapshot: {
    ...objectSnapshot, binding: driftedScope,
  } }), /R2 snapshot binding drift/)
  const incomplete = { ...objectSnapshot, entries: objectSnapshot.entries.slice(1) }
  const blocked = reconcileFamilyPhotoSnapshots({ ...input, mediaSnapshot, objectSnapshot: incomplete })
  assert.equal(blocked.status, 'BLOCK')
  assert.equal(blocked.counts.UNKNOWN, 1)
})
