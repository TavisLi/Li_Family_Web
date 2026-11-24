import assert from 'node:assert/strict'
import { createHash, createHmac } from 'node:crypto'
import test from 'node:test'

import { familyPhotoObjectKey, familyPhotoVariants } from '../payload/family-media.ts'
import { familyPhotoWriterBatches, familyPhotoWriterLimits, signFamilyPhotoWriter, verifyFamilyPhotoWriterBaseline } from './travel-memory-family-photo-writer.mjs'

function review() {
  const accountId = 'a'.repeat(32)
  const bucket = 'family-fixture'
  const { assets, keys, bytes } = familyPhotoWriterLimits
  const entries = Array.from({ length: assets }, (_, index) => {
    const key = index.toString(16).padStart(64, '0')
    return { assetId: 'sha256:' + key, objects: familyPhotoVariants.map((variant, i) => ({
      key: familyPhotoObjectKey(key, variant), variant, mimeType: 'image/jpeg', sha256: key,
      bytes: Math.floor(bytes / keys) + Number(index * 4 + i < bytes % keys),
    })) }
  })
  return {
    status: 'READY_FOR_REVIEW', plan: { environment: 'production', mode: 'family-photo-create', accountId, bucket, entries, evidence: { originPlanId: 1 } },
    counts: { BLOCK_CONFLICT: 0, UNKNOWN: 0, REUSE_MEDIA: 0, REVIEW_CREATE: assets, REVIEW_RECOVERY: 0 },
    limits: { mediaCreates: assets, storagePuts: keys, uploadBytes: bytes },
    writerScope: { accountId, bucket, actions: ['PutObject'], objectPaths: entries.flatMap(e => e.objects.map(x => x.key)) },
  }
}

test('Writer admission fixes the total payload and maps each photo to exactly four keys', () => {
  const candidate = review()
  const batches = familyPhotoWriterBatches(candidate)
  assert.equal(batches.length, 842)
  assert.equal(new Set(batches.flatMap(b => b.keys)).size, 3368)
  assert.equal(batches.reduce((total, b) => total + b.bytes, 0), 1500269357)
  candidate.plan.entries[0].objects[0].bytes++
  assert.throws(() => familyPhotoWriterBatches(candidate))
  candidate.plan.entries[0].objects[0].bytes--
  candidate.writerScope.actions.push('DeleteObject')
  assert.throws(() => familyPhotoWriterBatches(candidate))
})

test('signing yields a bounded Cloudflare child token with only the exact four PUT paths', () => {
  const candidate = review()
  const [batch, other] = familyPhotoWriterBatches(candidate)
  const { accountId, bucket } = candidate.plan
  const parent = { accessKeyId: 'b'.repeat(32), secretAccessKey: Buffer.from('c'.repeat(64)) }
  const input = { accountId, bucket, batch, parent, issuedAt: 10000, expiresBy: 10150 }
  const credentials = signFamilyPhotoWriter(input)
  const jwt = Buffer.from(credentials.sessionToken, 'base64').toString().slice(4)
  const [header, payload, signature] = jwt.split('.')
  assert.equal(signature, createHmac('sha256', parent.secretAccessKey).update(header + '.' + payload).digest('base64url'))
  assert.equal(credentials.secretAccessKey, createHash('sha256').update(jwt).digest('hex'))
  assert.notEqual(credentials.secretAccessKey, parent.secretAccessKey.toString())
  assert.deepEqual(JSON.parse(Buffer.from(payload, 'base64url')), {
    sub: accountId, iss: parent.accessKeyId, aud: accountId + '.r2.cloudflarestorage.com', iat: 10000, exp: 10150,
    bucket, actions: ['PutObject'], paths: { prefixPaths: [], objectPaths: batch.keys },
  })
  assert(Buffer.byteLength(credentials.sessionToken) <= 2048)
  assert.throws(() => signFamilyPhotoWriter({ ...input, expiresBy: 10015 }))
  assert.throws(() => signFamilyPhotoWriter({ ...input, batch: { ...batch, keys: other.keys } }))
})

test('a fresh gap review must still match the approved owner and full Write scope', async () => {
  const approved = review()
  await verifyFamilyPhotoWriterBaseline(approved, async () => structuredClone(approved))
  const changed = structuredClone(approved)
  changed.plan.evidence.originPlanId++
  await assert.rejects(verifyFamilyPhotoWriterBaseline(approved, async () => changed), /baseline drift/)
  changed.plan.evidence.originPlanId--
  changed.counts.REVIEW_CREATE--
  changed.counts.REVIEW_RECOVERY++
  await assert.rejects(verifyFamilyPhotoWriterBaseline(approved, async () => changed))
})
