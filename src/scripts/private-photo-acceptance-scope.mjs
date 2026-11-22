import assert from 'node:assert/strict'

// Scope checks for the single synthetic acceptance fixture.
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

export async function runScopedPrivatePhotoAcceptance() {
  throw new Error('BLOCK: Production photo intake requires Supervisor integration')
}

export async function cleanupApprovedPrivatePhotoFixture() {
  throw new Error('BLOCK: Production photo cleanup requires Supervisor integration')
}
