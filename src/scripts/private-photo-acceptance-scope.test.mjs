import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cleanupApprovedPrivatePhotoFixture, cleanupPrivatePhotoFixture, privatePhotoAcceptanceScope, scopedPrivatePhotoAdapter, runScopedPrivatePhotoAcceptance } from './private-photo-acceptance-scope.mjs'

const key = 'a'.repeat(64)
const variants = ['original', 'thumbnail', 'medium', 'large']
const fixture = Buffer.from('fixture')
const sha256 = createHash('sha256').update(fixture).digest('hex')
const plan = () => ({ media: { count: 1, familyAssetKey: key, locale: 'zh-TW', altText: 'synthetic' }, target: { bucket: 'private' },
  syntheticFixture: { objects: variants.map(variant => ({ variant, key: `family-media/${key}/${variant}.jpeg`, bytes: fixture.length, sha256 })) } })

test('limits fixture actions to the bound bucket, keys and returned Media ID', () => {
  const scope = privatePhotoAcceptanceScope(plan())
  scope.assertObject('private', `family-media/${key}/medium.jpeg`)
  assert.throws(() => scope.assertObject('other', `family-media/${key}/medium.jpeg`))
  assert.throws(() => scope.assertObject('private', `family-media/${key}/other.jpeg`))
  assert.throws(() => scope.assertCleanupMedia(1, key))
  scope.bindCreatedMedia(1, key)
  assert.throws(() => scope.bindCreatedMedia(2, key))
  assert.throws(() => scope.assertCleanupMedia(2, key))
  assert.throws(() => scope.assertCleanupMedia(1, 'b'.repeat(64)))
  scope.assertCleanupMedia(1, key)
})

test('rejects out of scope calls before invoking the intake adapter', async () => {
  const calls = []
  const adapter = scopedPrivatePhotoAdapter(plan(), {
    putIfAbsent: async () => calls.push('put'),
    readVerifiedObject: async () => calls.push('object read'),
    createMedia: async () => { calls.push('create'); return 7 },
    readMedia: async () => { calls.push('read'); return {} },
  })
  await assert.rejects(adapter.putIfAbsent({ Bucket: 'private', Key: 'other', IfNoneMatch: '*' }))
  await assert.rejects(adapter.readMedia(7, 'zh-TW'))
  await assert.rejects(adapter.readVerifiedObject({ bucket: 'private', key: `family-media/${key}/original.jpeg`, bytes: fixture.length, sha256: 'bad', variant: 'original', mimeType: 'image/jpeg' }))
  assert.deepEqual(calls, [])
  const put = { Bucket: 'private', Key: `family-media/${key}/original.jpeg`, IfNoneMatch: '*', Body: fixture, ContentLength: fixture.length, ContentType: 'image/jpeg', CacheControl: 'private, no-store' }
  await assert.rejects(adapter.putIfAbsent({ ...put, Body: Buffer.from('altered') }))
  await assert.rejects(adapter.putIfAbsent({ ...put, ACL: 'public-read' }), /object fields drift/)
  await adapter.putIfAbsent(put)
  await assert.rejects(adapter.putIfAbsent(put), /already attempted/)
  const media = { familyAssetKey: key, locale: 'zh-TW', altText: 'synthetic', type: 'photo', mimeType: 'image/jpeg', filesize: fixture.length }
  await assert.rejects(adapter.createMedia({ ...media, relatedTravelRecord: 1 }), /Media fields drift/)
  await adapter.createMedia(media)
  await assert.rejects(adapter.createMedia(media))
  await assert.rejects(adapter.readMedia(8, 'zh-TW'))
  await adapter.readMedia(7, 'zh-TW')
  assert.deepEqual(calls, ['put', 'create', 'read'])
})

test('does not repeat an ambiguous object PUT', async () => {
  let attempts = 0
  const adapter = scopedPrivatePhotoAdapter(plan(), { putIfAbsent: async () => { attempts++; throw new Error('unknown') } })
  const put = { Bucket: 'private', Key: `family-media/${key}/original.jpeg`, IfNoneMatch: '*', Body: fixture, ContentLength: fixture.length, ContentType: 'image/jpeg', CacheControl: 'private, no-store' }
  await assert.rejects(adapter.putIfAbsent(put), /unknown/)
  await assert.rejects(adapter.putIfAbsent(put), /already attempted/)
  assert.equal(attempts, 1)
})

test('does not repeat an ambiguous Media create', async () => {
  let attempts = 0
  const adapter = scopedPrivatePhotoAdapter(plan(), { createMedia: async () => { attempts++; throw new Error('unknown') } })
  const input = { familyAssetKey: key, locale: 'zh-TW', altText: 'synthetic', type: 'photo', mimeType: 'image/jpeg', filesize: fixture.length }
  await assert.rejects(adapter.createMedia(input), /unknown/)
  await assert.rejects(adapter.createMedia(input), /already attempted/)
  assert.equal(attempts, 1)
})

test('supervised intake rejects missing approval before any adapter call', async () => {
  let calls = 0
  await assert.rejects(runScopedPrivatePhotoAcceptance({ environment: 'production', adapter: { putIfAbsent() { calls++ } } }), /Human decision/)
  assert.equal(calls, 0)
})

test('cleanup deletes only the bound fixture and checks absence independently', async () => {
  const actions = []
  const reader = { readMedia: async () => ({ id: 7, familyAssetKey: key }), mediaState: async () => 'ABSENT',
    objectState: async () => 'ABSENT' }
  const writer = { deleteMedia: async id => { actions.push(id); return 1 }, deleteObject: async (bucket, objectKey) => actions.push(objectKey) }
  const steps = []
  await cleanupPrivatePhotoFixture({ environment: 'disposable', plan: plan(), mediaId: 7, writer, reader, guard() {}, checkpoint: async x => steps.push(x.stage) })
  assert.equal(actions.length, 5)
  assert.deepEqual(steps, ['MEDIA_DELETE_INTENT', 'MEDIA_ABSENT', ...variants.flatMap(() => ['OBJECT_DELETE_INTENT', 'OBJECT_ABSENT'])])
})

test('cleanup stops on unknown readback without continuing to object deletes', async () => {
  const actions = []
  const reader = { readMedia: async () => ({ id: 7, familyAssetKey: key }), mediaState: async () => 'UNKNOWN' }
  const writer = { deleteMedia: async () => { actions.push('media'); return 1 }, deleteObject: async () => actions.push('object') }
  await assert.rejects(cleanupPrivatePhotoFixture({ environment: 'disposable', plan: plan(), mediaId: 7, writer, reader, guard() {}, checkpoint: async () => {} }), /cleanup unknown/)
  assert.deepEqual(actions, ['media'])
})

test('cleanup stops if conditional Media delete affects no rows', async () => {
  let objects = 0
  const reader = { readMedia: async () => ({ id: 7, familyAssetKey: key }) }
  const writer = { deleteMedia: async () => 0, deleteObject: async () => { objects++ } }
  await assert.rejects(cleanupPrivatePhotoFixture({ environment: 'disposable', plan: plan(), mediaId: 7, writer, reader, guard() {}, checkpoint: async () => {} }), /delete count/)
  assert.equal(objects, 0)
})

test('cleanup refuses Production without a separate verified approval', async () => {
  await assert.rejects(cleanupPrivatePhotoFixture({ environment: 'production' }), /disposable cleanup only/)
  await assert.rejects(cleanupApprovedPrivatePhotoFixture({}), /relationship preservation not verified/)
})

test('rejects a widened fixture scope', () => {
  const widened = plan()
  widened.syntheticFixture.objects[0].key = 'another-key'
  assert.throws(() => privatePhotoAcceptanceScope(widened))
  const multiple = plan()
  multiple.media.count = 2
  assert.throws(() => privatePhotoAcceptanceScope(multiple))
})
