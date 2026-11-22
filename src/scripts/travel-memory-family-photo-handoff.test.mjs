import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'

import { familyPhotoProtectedObserver, familyPhotoPreservationReadback } from './travel-memory-family-photo-preservation.mjs'
import { readFamilyPhotoKeychain } from './travel-memory-family-photo-production-context.mjs'

const hash = value => createHash('sha256').update(value).digest('hex')

test('Keychain handoff is fixed to the role service, checks the digest and clears the read buffer', async () => {
  const session = 'synthetic.header.value'
  const stdout = Buffer.from(JSON.stringify({ session }))
  const options = { kind: 'family', account: 'tien-hsinglee', digest: hash(session), signal: new AbortController().signal,
    async read(file, args, options) {
      assert.equal(file, '/usr/bin/security')
      assert.deepEqual(args, ['find-generic-password', '-a', 'tien-hsinglee', '-s', 'TA-MEM-REAL-001:payload-family', '-w'])
      assert.equal(options.maxBuffer, 8192)
      return { stdout }
    },
  }
  assert.deepEqual(await readFamilyPhotoKeychain(options), { session })
  assert(stdout.every(byte => byte === 0))
  const mismatched = Buffer.from(JSON.stringify({ session }))
  await assert.rejects(readFamilyPhotoKeychain({ ...options, digest: hash('other'), read: async () => ({ stdout: mismatched }) }),
    /scoped Keychain handoff failed/)
  assert(mismatched.every(byte => byte === 0))
})

test('protected snapshots reject ownership or visibility drift and unapproved exclude ids', async () => {
  const result = { visible: true, no_owner: true, no_version: true, origin_id: 9, added_locales_clean: true,
    protected: ['_travel_memories_v', '_travel_plans_v', 'media', 'media_locales', 'media_rels', 'travel_memories', 'travel_plans']
      .map(name => ({ name, count: 0, digest: hash('') })) }
  const options = { slug: 'fixture-memory', originSlug: 'fixture-plan', originId: 9 }
  const observe = familyPhotoProtectedObserver(options)
  const snapshot = await observe(async (text, values) => {
    assert.deepEqual(values, ['fixture-memory', 'fixture-plan', []])
    assert.match(text, /row_security_active/)
    return { rows: [result] }
  })
  assert.equal(snapshot.originId, 9)
  await assert.rejects(observe(async () => ({ rows: [{ ...result, visible: false }] })), /visibility drift/)
  await assert.rejects(observe(async () => ({ rows: [{ ...result, no_version: false }] })), /visibility drift/)
  await assert.rejects(observe(async () => ({ rows: [{ ...result, added_locales_clean: false }] })), /visibility drift/)
  assert.throws(() => familyPhotoProtectedObserver({ ...options, addedIds: [1, 1] }))
  const before = { status: 'PASS', rollback: 'CONFIRMED', protectedState: snapshot }
  assert.throws(() => familyPhotoPreservationReadback({ before,
    after: { ...before, protectedState: { ...snapshot, protectedSha256: hash('changed') } } }), /protected data changed/)
})
