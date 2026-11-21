import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { familyPhotoObjectKey, familyPhotoVariants, isFamilyAssetKey } from '../payload/family-media.ts'

export const maxFamilyPhotoBytes = 32 * 1024 * 1024

export async function readFamilyPhotoObject({ storage, bucket, object, guard, signal }) {
  const { key, bytes, mimeType } = object
  guard()
  const requestTimeout = AbortSignal.timeout(15000)
  const requestSignal = signal ? AbortSignal.any([signal, requestTimeout]) : requestTimeout
  requestSignal.throwIfAborted()
  let response
  try {
    response = await storage.send(new GetObjectCommand({ Bucket: bucket, Key: key }), { abortSignal: requestSignal })
  } catch (error) {
    requestSignal.throwIfAborted()
    if (error?.name === 'NoSuchKey' && error.$metadata?.httpStatusCode === 404) {
      return { key, state: 'ABSENT_CONFIRMED' }
    }
    throw error
  }
  assert(response.Body, 'BLOCK: private object body missing')
  const reader = response.Body.transformToWebStream().getReader()
  const abort = () => { void reader.cancel().catch(() => {}) }
  requestSignal.addEventListener('abort', abort, { once: true })
  const hash = createHash('sha256')
  let observed = 0
  try {
    requestSignal.throwIfAborted()
    if (response.ContentLength !== bytes || response.ContentType !== mimeType) {
      return { key, state: 'CONFLICT' }
    }
    for (;;) {
      guard()
      const chunk = await reader.read()
      requestSignal.throwIfAborted()
      if (chunk.done) break
      observed += chunk.value.byteLength
      if (observed > bytes) return { key, state: 'CONFLICT' }
      hash.update(chunk.value)
    }
  } finally {
    requestSignal.removeEventListener('abort', abort)
    await reader.cancel().finally(() => reader.releaseLock())
  }
  if (observed !== bytes) return { key, state: 'UNKNOWN' }
  return { key, state: 'FOUND', bytes: observed, sha256: hash.digest('hex'), mimeType }
}

// Takes only exact keys from the calling runner's bound object roster. The
// caller supplies an authenticated, bucket-scoped client, run guard and sink.
export async function observeFamilyPhotoObjects({ storage, bucket, entries, guard, signal, saveObservation }) {
  assert(typeof bucket === 'string' && bucket, 'BLOCK: missing private bucket')
  assert(typeof saveObservation === 'function', 'BLOCK: observation sink required')
  assert(signal instanceof AbortSignal, 'BLOCK: observation deadline signal required')
  assert.equal(await storage.config.maxAttempts(), 1, 'BLOCK: storage must not retry')
  assert(Array.isArray(entries) && entries.length > 0, 'BLOCK: no private photo entries')
  const seen = new Set()
  for (const { assetId, objects } of entries) {
    assert(typeof assetId === 'string' && assetId.startsWith('sha256:'))
    const familyKey = assetId.slice(7)
    assert(isFamilyAssetKey(familyKey) && !seen.has(familyKey), 'BLOCK: unknown or duplicate family identity')
    seen.add(familyKey)
    assert.deepEqual(objects.map(object => object.variant), familyPhotoVariants)
    for (const object of objects) {
      assert.equal(object.key, familyPhotoObjectKey(familyKey, object.variant))
      assert(Number.isSafeInteger(object.bytes) && object.bytes > 0 && object.bytes <= maxFamilyPhotoBytes)
      assert(object.mimeType === 'image/jpeg' && isFamilyAssetKey(object.sha256))
      if (object.variant === 'original') assert.equal(object.sha256, familyKey)
    }
  }

  for (const { assetId, objects } of entries) {
    for (const object of objects) {
      signal.throwIfAborted()
      const observed = await readFamilyPhotoObject({ storage, bucket, object, guard, signal })
      await saveObservation(assetId, observed)
      assert(observed.state !== 'UNKNOWN', 'BLOCK: incomplete private object body')
    }
  }
}
