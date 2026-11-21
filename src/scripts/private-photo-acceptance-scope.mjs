import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { evaluateAuthorization, verifyManifestFiles } from './run-contract.mjs'
import { runFamilyPhotoIntake } from './travel-memory-family-photo-intake.mjs'

// This guard is for the single synthetic acceptance fixture only. The
// supervisor must bind the plan and this module to the approved manifest.
export function privatePhotoAcceptanceScope(plan) {
  assert.equal(plan.media.count, 1, 'BLOCK: exactly one Media row')
  const key = plan.media.familyAssetKey
  assert.match(key, /^[a-f0-9]{64}$/, 'BLOCK: invalid fixture identity')
  const variants = ['original', 'thumbnail', 'medium', 'large']
  const expected = variants.map(variant => `family-media/${key}/${variant}.jpeg`)
  const objects = plan.syntheticFixture.objects
  assert.equal(objects.length, 4, 'BLOCK: exactly four objects')
  assert.deepEqual(objects.map(item => item.variant), variants, 'BLOCK: fixture variants drift')
  assert.deepEqual(objects.map(item => item.key), expected, 'BLOCK: fixture keys drift')
  let createdId
  return {
    assertObject(bucket, objectKey) {
      assert.equal(bucket, plan.target.bucket, 'BLOCK: bucket drift')
      assert(expected.includes(objectKey), 'BLOCK: object outside fixture')
    },
    bindCreatedMedia(id, familyAssetKey) {
      assert.equal(createdId, undefined, 'BLOCK: Media already bound')
      assert(Number.isSafeInteger(id) && id > 0, 'BLOCK: invalid Media ID')
      assert.equal(familyAssetKey, key, 'BLOCK: Media identity drift')
      createdId = id
    },
    assertCleanupMedia(id, familyAssetKey) {
      assert.notEqual(createdId, undefined, 'BLOCK: Media ID not bound')
      assert.equal(id, createdId, 'BLOCK: cleanup Media ID drift')
      assert.equal(familyAssetKey, key, 'BLOCK: cleanup identity drift')
    },
  }
}

// Wrap the existing intake adapter; no provider operation is performed here.
// A failed or ambiguous create consumes the single create attempt.
export function scopedPrivatePhotoAdapter(plan, adapter) {
  const scope = privatePhotoAcceptanceScope(plan)
  let createAttempted = false
  const putAttempts = new Set()
  return {
    async findMediaByFamilyKey(key) {
      assert.equal(key, plan.media.familyAssetKey, 'BLOCK: lookup identity drift')
      return adapter.findMediaByFamilyKey(key)
    },
    async putIfAbsent(input) {
      assert.deepEqual(Object.keys(input).sort(), ['Body', 'Bucket', 'CacheControl', 'ContentLength', 'ContentType', 'IfNoneMatch', 'Key'].sort(), 'BLOCK: object fields drift')
      scope.assertObject(input.Bucket, input.Key)
      assert.equal(input.IfNoneMatch, '*', 'BLOCK: create-only required')
      assert.equal(input.CacheControl, 'private, no-store', 'BLOCK: cache policy drift')
      const expected = plan.syntheticFixture.objects.find(item => item.key === input.Key)
      assert(Buffer.isBuffer(input.Body), 'BLOCK: fixture bytes required')
      assert.equal(input.Body.length, expected.bytes, 'BLOCK: fixture size drift')
      assert.equal(input.ContentLength, expected.bytes, 'BLOCK: content length drift')
      assert.equal(input.ContentType, 'image/jpeg', 'BLOCK: content type drift')
      assert.equal(createHash('sha256').update(input.Body).digest('hex'), expected.sha256, 'BLOCK: fixture SHA drift')
      assert(!putAttempts.has(input.Key), 'BLOCK: object PUT already attempted')
      putAttempts.add(input.Key)
      return adapter.putIfAbsent(input)
    },
    async readVerifiedObject(input) {
      scope.assertObject(input.bucket, input.key)
      const expected = plan.syntheticFixture.objects.find(item => item.key === input.key)
      assert.equal(input.bytes, expected.bytes, 'BLOCK: read size drift')
      assert.equal(input.sha256, expected.sha256, 'BLOCK: read SHA drift')
      assert.equal(input.variant, expected.variant, 'BLOCK: read variant drift')
      assert.equal(input.mimeType, 'image/jpeg', 'BLOCK: read content type drift')
      return adapter.readVerifiedObject(input)
    },
    async createMedia(input) {
      assert.equal(createAttempted, false, 'BLOCK: Media create already attempted')
      const fields = ['locale', 'type', 'familyAssetKey', 'altText', 'mimeType', 'filesize']
      if (plan.media.sourcePath !== undefined) fields.push('sourcePath')
      assert.deepEqual(Object.keys(input).sort(), fields.sort(), 'BLOCK: Media fields drift')
      assert.equal(input.familyAssetKey, plan.media.familyAssetKey, 'BLOCK: Media identity drift')
      assert.equal(input.locale, plan.media.locale, 'BLOCK: locale drift')
      assert.equal(input.altText, plan.media.altText, 'BLOCK: alt text drift')
      assert.equal(input.type, 'photo', 'BLOCK: Media type drift')
      assert.equal(input.mimeType, 'image/jpeg', 'BLOCK: Media MIME drift')
      assert.equal(input.filesize, plan.syntheticFixture.objects[0].bytes, 'BLOCK: Media size drift')
      assert.equal(input.sourcePath, plan.media.sourcePath, 'BLOCK: Media source drift')
      createAttempted = true
      const id = await adapter.createMedia(input)
      scope.bindCreatedMedia(id, input.familyAssetKey)
      return id
    },
    async readMedia(id, locale) {
      scope.assertCleanupMedia(id, plan.media.familyAssetKey)
      assert.equal(locale, plan.media.locale, 'BLOCK: locale drift')
      return adapter.readMedia(id, locale)
    },
    assertCleanupMedia: scope.assertCleanupMedia,
    assertObject: scope.assertObject,
  }
}

// The caller remains responsible for the #105 supervised session, deadlines,
// durable checkpoints, credentials, cleanup and independent readback.
export async function runScopedPrivatePhotoAcceptance(options) {
  const { manifest, approval, root, humanSourceVerified, planPath, acceptancePath } = options.authority ?? {}
  assert.equal(options.environment, 'production', 'BLOCK: production scope required')
  assert.equal(humanSourceVerified, true, 'BLOCK: verified Human decision required')
  assert.equal(manifest?.approval.action, 'production-media', 'BLOCK: wrong approval action')
  assert(evaluateAuthorization(manifest, approval).recordMatches, 'BLOCK: exact approval required')
  await verifyManifestFiles(manifest, root)
  for (const name of [planPath, acceptancePath, 'src/scripts/private-photo-acceptance-scope.mjs',
    'src/scripts/travel-memory-family-photo-intake.mjs', 'src/scripts/private-photo-cleanup-writer.mjs']) {
    assert(manifest.artifacts.dependencies.some(item => item.path === name), 'BLOCK: missing scoped dependency')
  }
  const review = JSON.parse(await readFile(path.resolve(root, planPath), 'utf8'))
  const acceptance = JSON.parse(await readFile(path.resolve(root, acceptancePath), 'utf8'))
  const intake = review.plan
  assert.equal(review.status, 'READY_FOR_REVIEW', 'BLOCK: review incomplete')
  assert.equal(intake.target, manifest.target, 'BLOCK: target drift')
  assert.equal(intake.bucket, acceptance.target.bucket, 'BLOCK: bucket drift')
  assert.equal(intake.locale, acceptance.media.locale, 'BLOCK: locale drift')
  assert.equal(intake.entries.length, 1, 'BLOCK: one fixture only')
  const entry = intake.entries[0]
  assert.equal(entry.assetId, `sha256:${acceptance.media.familyAssetKey}`, 'BLOCK: asset drift')
  assert.equal(entry.altText, acceptance.media.altText, 'BLOCK: alt text drift')
  assert.equal(entry.sourcePath, acceptance.media.sourcePath, 'BLOCK: source path drift')
  assert.deepEqual(entry.objects.map(({ variant, key, bytes, sha256 }) => ({ variant, key, bytes, sha256 })),
    acceptance.syntheticFixture.objects.map(({ variant, key, bytes, sha256 }) => ({ variant, key, bytes, sha256 })),
    'BLOCK: fixture object drift')
  const adapter = scopedPrivatePhotoAdapter(acceptance, options.adapter)
  return runFamilyPhotoIntake({ ...options, adapter })
}

// Called only by a separately authorized cleanup session. Independent readers
// must return an explicit ABSENT result; errors and unknown states propagate.
async function cleanupFixture({ plan, mediaId, writer, reader, checkpoint, guard }) {
  assert.notEqual(writer, reader, 'BLOCK: independent cleanup reader required')
  const scope = privatePhotoAcceptanceScope(plan)
  scope.bindCreatedMedia(mediaId, plan.media.familyAssetKey)
  guard()
  const row = await reader.readMedia(mediaId)
  assert.equal(row?.id, mediaId, 'BLOCK: cleanup row missing or unknown')
  assert.equal(row.familyAssetKey, plan.media.familyAssetKey, 'BLOCK: cleanup identity drift')
  scope.assertCleanupMedia(mediaId, row.familyAssetKey)
  await checkpoint({ stage: 'MEDIA_DELETE_INTENT', mediaId })
  guard()
  // The provider adapter must perform an atomic ID + familyAssetKey predicate
  // and return its affected-row count. Adapter implementation is separately reviewed.
  assert.equal(await writer.deleteMedia(mediaId, row.familyAssetKey), 1, 'BLOCK: conditional Media delete count')
  guard()
  assert.equal(await reader.mediaState(mediaId), 'ABSENT', 'BLOCK: Media cleanup unknown')
  await checkpoint({ stage: 'MEDIA_ABSENT', mediaId })
  for (const object of plan.syntheticFixture.objects) {
    scope.assertObject(plan.target.bucket, object.key)
    guard()
    await checkpoint({ stage: 'OBJECT_DELETE_INTENT', key: object.key })
    guard()
    await writer.deleteObject(plan.target.bucket, object.key)
    guard()
    assert.equal(await reader.objectState(plan.target.bucket, object.key), 'ABSENT', 'BLOCK: object cleanup unknown')
    await checkpoint({ stage: 'OBJECT_ABSENT', key: object.key })
  }
}

export async function cleanupPrivatePhotoFixture(options) {
  assert.equal(options.environment, 'disposable', 'BLOCK: disposable cleanup only')
  return cleanupFixture(options)
}

// Production callers must additionally supply the separately approved cleanup
// manifest and a bound receipt containing the actual ID from fixture creation.
export async function cleanupApprovedPrivatePhotoFixture() {
  // Media has inbound SET NULL and CASCADE foreign keys. ID/key matching alone
  // cannot prove those references are absent or prevent concurrent creation.
  // Keep Production cleanup closed until the schema-bound transaction and
  // relationship preservation checks have been implemented and rehearsed.
  throw new Error('BLOCK: Production Media relationship preservation not verified')
}
