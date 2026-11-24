import assert from 'node:assert/strict'
import { createHash, createHmac } from 'node:crypto'

import { familyPhotoObjectKey, familyPhotoVariants, isFamilyAssetKey } from '../payload/family-media.ts'

export const familyPhotoWriterLimits = Object.freeze({
  assets: 842,
  keys: 3368,
  bytes: 1500269357,
  keysPerCredential: 4,
  credentialSeconds: 180,
  requestMs: 15000,
  maxSessionTokenBytes: 2048,
})
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
const json64 = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')

export function familyPhotoWriterBatches(review) {
  const { plan, counts, writerScope, limits } = review
  assert.equal(review.status, 'READY_FOR_REVIEW')
  assert.equal(plan.mode, 'family-photo-create')
  assert.equal(plan.environment, 'production')
  assert.deepEqual(counts, { BLOCK_CONFLICT: 0, UNKNOWN: 0, REUSE_MEDIA: 0, REVIEW_CREATE: 842, REVIEW_RECOVERY: 0 })
  assert.deepEqual(limits, { mediaCreates: 842, storagePuts: 3368, uploadBytes: 1500269357 })
  assert.equal(plan.entries.length, familyPhotoWriterLimits.assets)
  const batches = plan.entries.map(({ assetId, objects }) => {
    const key = assetId.slice(7)
    assert(assetId.startsWith('sha256:') && isFamilyAssetKey(key))
    assert.deepEqual(objects.map(({ variant }) => variant), familyPhotoVariants)
    const keys = objects.map((object) => {
      assert.equal(object.key, familyPhotoObjectKey(key, object.variant))
      assert(object.mimeType === 'image/jpeg' && isFamilyAssetKey(object.sha256))
      assert(Number.isSafeInteger(object.bytes) && object.bytes > 0 && object.bytes <= 32 * 1024 * 1024)
      return object.key
    })
    assert.equal(objects[0].sha256, key)
    return Object.freeze({ assetId, keys: Object.freeze(keys), bytes: objects.reduce((sum, object) => sum + object.bytes, 0) })
  })
  const keys = batches.flatMap((batch) => batch.keys)
  assert.equal(new Set(keys).size, familyPhotoWriterLimits.keys)
  assert.equal(batches.reduce((sum, batch) => sum + batch.bytes, 0), familyPhotoWriterLimits.bytes)
  assert.deepEqual(writerScope, { accountId: plan.accountId, bucket: plan.bucket, actions: ['PutObject'], objectPaths: keys })
  return Object.freeze(batches)
}

// Cloudflare's local signing protocol. Only the signing process receives the
// parent secret. The returned credentials are for a single photo's four puts.
export function signFamilyPhotoWriter({ accountId, bucket, batch, parent, issuedAt, expiresBy }) {
  assert(typeof accountId === 'string' && /^[a-f0-9]{32}$/.test(accountId))
  assert(typeof bucket === 'string' && /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket))
  assert(typeof parent?.accessKeyId === 'string' && /^[a-f0-9]{32}$/.test(parent.accessKeyId))
  assert(Buffer.isBuffer(parent.secretAccessKey) &&
    parent.secretAccessKey.length === 64 && parent.secretAccessKey.every((b) => (b >= 48 && b <= 57) || (b >= 97 && b <= 102)))
  assert(Number.isSafeInteger(issuedAt) && issuedAt > 0 && Number.isSafeInteger(expiresBy))
  const exp = Math.min(expiresBy, issuedAt + familyPhotoWriterLimits.credentialSeconds)
  assert(exp - issuedAt > familyPhotoWriterLimits.requestMs / 1000, 'BLOCK: insufficient credential lifetime')
  const key = batch.assetId.slice(7)
  assert(batch.assetId.startsWith('sha256:') && isFamilyAssetKey(key))
  assert.deepEqual([...batch.keys], familyPhotoVariants.map((variant) => familyPhotoObjectKey(key, variant)))
  const claims = { sub: accountId, iss: parent.accessKeyId, aud: `${accountId}.r2.cloudflarestorage.com`,
    iat: issuedAt, exp, bucket, actions: ['PutObject'], paths: { prefixPaths: [], objectPaths: batch.keys } }
  const unsigned = `${json64({ alg: 'HS256', typ: 'JWT' })}.${json64(claims)}`
  const jwt = `${unsigned}.${createHmac('sha256', parent.secretAccessKey).update(unsigned).digest('base64url')}`
  const sessionToken = Buffer.from(`jwt/${jwt}`).toString('base64')
  assert(Buffer.byteLength(sessionToken) <= familyPhotoWriterLimits.maxSessionTokenBytes)
  return { accessKeyId: parent.accessKeyId, secretAccessKey: sha(jwt), sessionToken, expiration: new Date(exp * 1000) }
}

// The live caller must supply the independently authenticated and bounded reader.
// A fresh complete review is compared before the intake can dispatch a write.
export async function verifyFamilyPhotoWriterBaseline(approved, observeCurrent) {
  familyPhotoWriterBatches(approved)
  const originPlanId = approved.plan.evidence?.originPlanId
  assert(Number.isSafeInteger(originPlanId) && originPlanId > 0, 'BLOCK: missing approved origin Plan')
  const observed = await observeCurrent()
  familyPhotoWriterBatches(observed)
  const approvedPlan = approved.plan
  const observedPlan = observed.plan
  for (const key of ['target', 'slug', 'locale', 'ownerBasis', 'accountId', 'bucket']) {
    assert.equal(observedPlan[key], approvedPlan[key], 'BLOCK: Production scope drift')
  }
  for (const key of ['originPlanId', 'sourceSha256', 'registrySha256']) {
    assert.equal(observedPlan.evidence[key], approvedPlan.evidence[key], 'BLOCK: Production baseline drift')
  }
  assert.deepEqual(observedPlan.entries, approvedPlan.entries, 'BLOCK: Production roster drift')
}
