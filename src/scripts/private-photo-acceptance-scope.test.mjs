import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cleanupApprovedPrivatePhotoFixture, privatePhotoAcceptanceScope, runScopedPrivatePhotoAcceptance } from './private-photo-acceptance-scope.mjs'

const key = 'a'.repeat(64)
const variants = ['original', 'thumbnail', 'medium', 'large']
const plan = () => ({ media: { count: 1, familyAssetKey: key }, target: { bucket: 'private' },
  syntheticFixture: { objects: variants.map(variant => ({ variant, key: `family-media/${key}/${variant}.jpeg` })) } })

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

test('Production acceptance stops before reading authority or touching any adapter', async () => {
  const options = {
    environment: 'production',
    get authority() { assert.fail('intake accessed caller-supplied authority') },
    get adapter() { assert.fail('intake accessed the adapter') },
    get writer() { assert.fail('cleanup accessed the writer') },
  }
  await assert.rejects(runScopedPrivatePhotoAcceptance(options), /intake requires Supervisor integration/)
  await assert.rejects(cleanupApprovedPrivatePhotoFixture(options), /cleanup requires Supervisor integration/)
})

test('rejects a widened fixture scope', () => {
  const widened = plan()
  widened.syntheticFixture.objects[0].key = 'another-key'
  assert.throws(() => privatePhotoAcceptanceScope(widened))
  const multiple = plan()
  multiple.media.count = 2
  assert.throws(() => privatePhotoAcceptanceScope(multiple))
})
