import assert from 'node:assert/strict'

// The supervisor binds these exact bytes as an SQL artifact before use.
export const deleteFixtureMediaSql = 'DELETE FROM public.media WHERE id = $1 AND family_asset_key = $2 RETURNING id'

export async function privatePhotoCleanupWriter({ client, storage, bucket, mediaId, familyAssetKey, guard, signal }) {
  const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')
  assert(Number.isSafeInteger(mediaId) && mediaId > 0 && /^[a-f0-9]{64}$/.test(familyAssetKey), 'BLOCK: invalid fixture identity')
  const allowedKeys = new Set(['original', 'thumbnail', 'medium', 'large']
    .map(variant => `family-media/${familyAssetKey}/${variant}.jpeg`))
  assert.equal(await storage.config.maxAttempts(), 1, 'BLOCK: storage must not retry')
  const attemptedKeys = new Set()
  let mediaAttempted = false
  return {
    async deleteMedia(id, key) {
      assert.equal(mediaAttempted, false, 'BLOCK: Media delete already attempted')
      assert(Number.isSafeInteger(id) && id > 0 && /^[a-f0-9]{64}$/.test(key), 'BLOCK: invalid Media identity')
      assert.equal(id, mediaId, 'BLOCK: Media ID outside fixture')
      assert.equal(key, familyAssetKey, 'BLOCK: Media key outside fixture')
      guard()
      mediaAttempted = true
      const result = await client.query(deleteFixtureMediaSql, [id, key])
      assert.equal(result.rowCount, result.rows.length, 'BLOCK: Media delete result mismatch')
      if (result.rowCount === 1) assert.equal(result.rows[0].id, id, 'BLOCK: Media delete ID mismatch')
      return result.rowCount
    },
    async deleteObject(requestedBucket, key) {
      assert.equal(requestedBucket, bucket, 'BLOCK: bucket drift')
      assert(allowedKeys.has(key), 'BLOCK: object outside fixture')
      assert(!attemptedKeys.has(key), 'BLOCK: object delete already attempted')
      guard()
      attemptedKeys.add(key)
      const timeout = AbortSignal.timeout(15000)
      await storage.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }),
        { abortSignal: signal ? AbortSignal.any([signal, timeout]) : timeout })
    },
  }
}
