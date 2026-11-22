import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { S3Client } from '@aws-sdk/client-s3'

import { familyPhotoIntakeAdapter } from './travel-memory-family-photo-intake.mjs'
import { familyPhotoPayloadClient } from './travel-memory-family-photo-payload-io.mjs'
import { boundFamilyPhotoR2 } from './travel-memory-family-photo-r2-io.mjs'
import { familyPhotoWriterBatches, familyPhotoWriterLimits } from './travel-memory-family-photo-writer.mjs'

const accountId = '4c01c77e704e10d493bdc1912bb12076'
const bucket = 'li-family-web-family-media-prod'

function verifyChild(credentials, batch) {
  const { sessionToken, accessKeyId, secretAccessKey } = credentials
  assert(typeof sessionToken === 'string' && Buffer.byteLength(sessionToken) <= familyPhotoWriterLimits.maxSessionTokenBytes)
  const value = Buffer.from(sessionToken, 'base64').toString()
  assert(value.startsWith('jwt/'))
  const jwt = value.slice(4)
  const parts = jwt.split('.')
  assert.equal(parts.length, 3)
  assert.equal(secretAccessKey, createHash('sha256').update(jwt).digest('hex'))
  const claims = JSON.parse(Buffer.from(parts[1], 'base64url'))
  assert.equal(claims.bucket, bucket)
  assert.equal(claims.sub, accountId)
  assert.equal(claims.iss, accessKeyId)
  assert.equal(claims.aud, accountId + '.r2.cloudflarestorage.com')
  assert.deepEqual(claims.actions, ['PutObject'])
  assert.equal(claims.scope, undefined)
  assert.deepEqual(claims.paths, { objectPaths: [...batch.keys], prefixPaths: [] })
  const now = Math.floor(Date.now() / 1000)
  assert(Number.isSafeInteger(claims.iat) && claims.iat <= now &&
    Number.isSafeInteger(claims.exp) && claims.exp >= now + 15 &&
    claims.exp - claims.iat <= familyPhotoWriterLimits.credentialSeconds)
}

// The sealed worker supplies authenticated session material, independent R2
// reader credentials and a trusted one-photo issuer. No parent is accepted.
export async function familyPhotoProductionAdapter({ review, writer, reader, readerCredentials, issueWriter, guard, signal }) {
  assert.equal(review.plan.accountId, accountId)
  assert.equal(review.plan.bucket, bucket)
  assert(writer.id !== reader.id && writer.session !== reader.session)
  const batches = familyPhotoWriterBatches(review)
  const entries = review.plan.entries
  const objects = entries.flatMap(entry => entry.objects)
  const byKey = new Map(batches.flatMap((batch, index) => batch.keys.map(key => [key, { batch, objects: entries[index].objects }])))
  const options = { region: 'auto', endpoint: 'https://' + accountId + '.r2.cloudflarestorage.com', forcePathStyle: true,
    followRegionRedirects: false, maxAttempts: 1, requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED' }
  const payload = await familyPhotoPayloadClient({ session: writer.session, role: 'admin', expectedId: writer.id, guard, signal })
  const readPayload = await familyPhotoPayloadClient({ session: reader.session, role: 'family', expectedId: reader.id, guard, signal })
  const readClient = new S3Client({ ...options, credentials: readerCredentials })
  const readStorage = await boundFamilyPhotoR2({ storage: readClient, accountId, bucket, objects, phase: 'readback', guard })
  const attempted = new Set()
  let active
  const writeStorage = { config: { maxAttempts: async () => 1 }, async send(command, sendOptions) {
    guard()
    const key = command.input.Key
    const entry = byKey.get(key)
    assert(entry && !attempted.has(key), 'BLOCK: Writer key outside scope or repeated')
    if (active?.batch !== entry.batch) {
      assert.equal(key, entry.batch.keys[0], 'BLOCK: Writer must start at first object')
      active?.storage.destroy()
      const credentials = await issueWriter(entry.batch)
      verifyChild(credentials, entry.batch)
      assert.notEqual(credentials.accessKeyId, readerCredentials.accessKeyId, 'BLOCK: R2 reader must be independent')
      const storage = new S3Client({ ...options, credentials })
      const bound = await boundFamilyPhotoR2({ storage, accountId, bucket, objects: entry.objects, phase: 'write', guard })
      active = { batch: entry.batch, storage, bound }
    }
    attempted.add(key)
    return active.bound.send(command, sendOptions)
  } }
  const adapter = await familyPhotoIntakeAdapter({ bucket, writeStorage, readStorage, payload, readPayload, guard, signal,
    actors: { writer: payload.actor, reader: readPayload.actor } })
  return { adapter, close() { active?.storage.destroy(); readClient.destroy() } }
}
