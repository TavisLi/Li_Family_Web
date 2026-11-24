import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { promisify } from 'node:util'

import { readFamilyMediaSnapshot } from './travel-memory-family-media-read.mjs'
import { familyPhotoProtectedObserver, familyPhotoPreservationReadback } from './travel-memory-family-photo-preservation.mjs'
import { observeFamilyPhotoAbsence } from './travel-memory-family-photo-production-adapter.mjs'
import { buildFamilyPhotoCreateReview, familyPhotoObservationBinding } from './travel-memory-family-photo-reconcile.mjs'
import { familyPhotoWriterBatches, signFamilyPhotoWriter } from './travel-memory-family-photo-writer.mjs'

const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const exec = promisify(execFile)
const prefix = 'TA-MEM-REAL-001:'
const keychainServices = Object.freeze({
  admin: prefix + 'payload-admin',
  family: prefix + 'payload-family',
  reader: prefix + 'private-r2-writer-readback',
  parent: prefix + 'private-r2-writer-parent',
})

export async function readFamilyPhotoKeychain({ kind, account, digest, signal, read = exec }) {
  assert(Object.hasOwn(keychainServices, kind) && account === 'tien-hsinglee' && /^[a-f0-9]{64}$/.test(digest))
  let buffer
  try {
    const result = await read('/usr/bin/security', ['find-generic-password', '-a', account, '-s', keychainServices[kind], '-w'],
      { encoding: 'buffer', timeout: 120000, maxBuffer: 8192, signal })
    buffer = result.stdout
    assert(Buffer.isBuffer(buffer))
    const value = JSON.parse(buffer)
    if (kind === 'admin' || kind === 'family') {
      assert.deepEqual(Object.keys(value), ['session'])
      assert.equal(sha(value.session), digest)
    } else {
      assert.deepEqual(Object.keys(value).sort(), ['accessKeyId', 'secretAccessKey'])
      assert(/^[a-f0-9]{32}$/.test(value.accessKeyId) && /^[a-f0-9]{64}$/.test(value.secretAccessKey))
      assert.equal(sha(value.accessKeyId), digest)
    }
    return value
  } catch {
    throw new Error('BLOCK: scoped Keychain handoff failed')
  } finally {
    buffer?.fill(0)
  }
}

// The sealed entry binds the CA/pg factory, scope and handoff receipts before calling this.
export async function bindFamilyPhotoProductionContext({
  planPath, review, prepared, registry, sourceMarkdown, originPlanSlug, makeDb, credentialEvidence, loadOriginal,
  signal, guard, endMs, saveEvidence,
}) {
  const { plan } = review
  const scope = { environment: 'production', slug: plan.slug, locale: plan.locale, bucket: plan.bucket,
    accountId: plan.accountId, target: { projectRef: 'iujasyrvypdcmkmorcud', database: 'postgres', schema: 'public' } }
  assert.equal(plan.target, 'iujasyrvypdcmkmorcud/postgres/public')
  assert.equal(scope.bucket, 'li-family-web-family-media-prod')
  assert.equal(scope.accountId, '4c01c77e704e10d493bdc1912bb12076')
  assert.equal(sha(sourceMarkdown), plan.evidence.sourceSha256)
  const expires = kind => {
    const time = Date.parse(credentialEvidence[kind].expiresAt)
    assert(time >= endMs, 'BLOCK: credential expires before run window ends')
    return time
  }
  const read = async kind => {
    guard()
    expires(kind)
    return readFamilyPhotoKeychain({ kind, account: 'tien-hsinglee', digest: credentialEvidence[kind].digest, signal })
  }
  const writer = { id: credentialEvidence.admin.id, ...await read('admin') }
  const reader = { id: credentialEvidence.family.id, ...await read('family') }
  const readerCredentials = await read('reader')
  assert.notEqual(writer.id, reader.id)
  assert.notEqual(credentialEvidence.parent.digest, credentialEvidence.reader.digest)
  expires('parent')
  const binding = familyPhotoObservationBinding({ prepared, registry, scope })
  const roster = new Map(familyPhotoWriterBatches(review).map(batch => [batch.assetId, batch]))
  const issued = new Set()
  const originId = plan.evidence.originPlanId
  let before
  let parent
  const capture = async addedIds => {
    guard()
    const snapshot = await readFamilyMediaSnapshot({ ...await makeDb(), prepared, registry, binding, authorize: guard, signal,
      observeProtected: familyPhotoProtectedObserver({ slug: plan.slug, originSlug: originPlanSlug, originId, addedIds }) })
    assert(snapshot.status === 'PASS' && snapshot.rollback === 'CONFIRMED')
    return snapshot
  }
  return {
    planPath, registry, loadOriginal, writer, reader, readerCredentials,
    async observeCurrent() {
      assert(!before, 'BLOCK: repeated baseline observation')
      const objectSnapshot = await observeFamilyPhotoAbsence({ prepared, binding, credentials: readerCredentials, guard, signal })
      before = await capture([])
      await saveEvidence('before.json', { media: before, objects: objectSnapshot })
      return buildFamilyPhotoCreateReview({ prepared, registry, scope, sourceMarkdown, sourceSha256: plan.evidence.sourceSha256,
        current: { status: 'PASS', rollback: before.rollback, target: plan.target, slug: plan.slug, locale: plan.locale,
          ownerCount: 0, versionCount: 0, originPlanId: originId, originPlanSlug, receiptSha256: sha(JSON.stringify(before)) },
        mediaSnapshot: before, objectSnapshot })
    },
    async issueWriter(batch) {
      assert(before && !issued.has(batch.assetId))
      const allowed = roster.get(batch.assetId)
      assert.deepEqual(batch, allowed, 'BLOCK: issuer cannot expand approved paths')
      if (!parent) {
        const loaded = await read('parent')
        parent = { accessKeyId: loaded.accessKeyId, secretAccessKey: Buffer.from(loaded.secretAccessKey, 'utf8') }
      }
      guard()
      issued.add(batch.assetId)
      return signFamilyPhotoWriter({ accountId: scope.accountId, bucket: scope.bucket, batch: allowed, parent,
        issuedAt: Math.floor(Date.now() / 1000), expiresBy: Math.floor(Math.min(endMs, expires('parent')) / 1000) })
    },
    async verifyPreservation(receipts) {
      assert(before && receipts.length === roster.size)
      const ids = receipts.map(({ mediaId }) => mediaId)
      const after = await capture(ids)
      const result = familyPhotoPreservationReadback({ prepared, registry, scope, before, after, receipts })
      await saveEvidence('after.json', { media: after, preservation: result })
      return result.status === 'PASS'
    },
    close() { parent?.secretAccessKey.fill(0) },
  }
}
