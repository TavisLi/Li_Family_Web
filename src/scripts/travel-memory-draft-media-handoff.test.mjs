import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'

import { buildDraftMediaHandoff } from './travel-memory-draft-media-handoff.mjs'

const load = name => import(pathToFileURL(path.join(process.cwd(), 'src/scripts', name)).href)
const { familyPhotoObservationBinding } = await load('travel-memory-family-photo-reconcile.mjs')
const { familyPhotoPreservationReadback: verifyPreservation } = await load('travel-memory-family-photo-preservation.mjs')
const { mergeVerifiedMediaReceipt: mergeReceipt } = await load('travel-memory-media-transfer.mjs')
const { previewNewMemory } = await load('travel-memory-new-review.mjs')
const hash = value => createHash('sha256').update(value).digest('hex')
const json = value => Buffer.from(JSON.stringify(value))

function fixture() {
  const slug = 'fixture-memory'
  const scope = { environment: 'production', slug, locale: 'zh-TW', bucket: 'fixture-photos-private',
    accountId: 'a'.repeat(32), target: { projectRef: 'a'.repeat(20), database: 'postgres', schema: 'public' } }
  const registry = { version: 1, travelSlug: slug, assets: ['green', 'blue'].map(label => ({
    assetId: 'sha256:' + hash(label), files: [label + '.jpeg'], filename: label + '.jpeg',
    mimeType: 'image/jpeg', width: 1, height: 1, byteSize: 32, provenance: 'local-file', locators: [],
  })) }
  const entries = registry.assets.map(({ assetId }) => ({
    assetId, altTextSha256: hash('Synthetic photo'),
    objects: ['original', 'thumbnail', 'medium', 'large'].map(variant => ({
      variant, key: `family-media/${assetId.slice(7)}/${variant}.jpeg`, bytes: variant === 'original' ? 32 : 16,
      mimeType: 'image/jpeg', sha256: variant === 'original' ? assetId.slice(7) : hash(assetId + variant),
    })),
  }))
  const prepared = { slug, assets: entries.length, entries, objectCount: 8, originalBytes: 64, derivativeBytes: 96 }
  const receipts = entries.map(({ assetId, objects }, index) => ({
    stage: 'VERIFIED', assetId, mediaId: index + 10, inputBytes: 32,
    originalGetBytes: 32, originalGetSha256: assetId, objects,
    locator: { environment: scope.environment, payloadId: index + 10, verified: true, verifiedByteHash: assetId },
  }))
  const binding = familyPhotoObservationBinding({ prepared, registry, scope })
  const protectedState = { originId: 23, protectedSha256: hash('protected rows') }
  const before = { media: { status: 'PASS', rollback: 'CONFIRMED', binding, protectedState } }
  const after = { media: { ...before.media, entries: receipts.map(({ assetId, mediaId }) => ({
    assetId, media: { state: 'FOUND', id: mediaId, familyAssetKey: assetId.slice(7), type: 'photo',
      mimeType: 'image/jpeg', bytes: 32, altTextSha256: entries[0].altTextSha256,
      sourcePath: null, ownerId: null, publicStorage: false },
  })) }, preservation: { status: 'PASS', verified: 2, protectedSha256: protectedState.protectedSha256 } }
  const review = { status: 'READY_FOR_REVIEW', limits: { mediaCreates: 2, storagePuts: 8, uploadBytes: 160 },
    plan: { ...scope, target: Object.values(scope.target).join('/'), mode: 'family-photo-create',
      ownerBasis: 'ZERO_OWNER_AND_VERSION', evidence: { registrySha256: hash(json(registry)), originPlanId: 23 }, entries } }
  const manifestSha256 = hash('approved fixture scope')
  const terminal = { status: 'PASS', code: 'FAMILY_PHOTO_PRODUCTION_VERIFIED', automaticRetry: false,
    manifestSha256, sessionId: 'fixture:34' }
  return { manifestSha256, runId: 'fixture', supervisor: { ...terminal, requiresFallback: false },
    worker: { ...terminal, phase: 'preservation', verified: 2, terminalExit: 0 },
    workerStarted: { manifestSha256, pid: 34 }, review, registry, prepared, before, after, receipts }
}

const run = input => buildDraftMediaHandoff({ ...input, verifyPreservation, mergeReceipt })

test('matching upload and protection receipts produce usable draft locators', () => {
  const input = fixture()
  const output = run(input)
  assert.deepEqual(output.counts, { photos: 2, objects: 8, uploadBytes: 160 })
  assert(input.registry.assets.every(asset => !asset.locators.length))
  assert.deepEqual(output.registry.assets.map(asset => asset.locators[0].payloadId), [10, 11])
  const slug = input.prepared.slug
  const scope = { slug, environment: 'production', locale: 'zh-TW' }
  const sourceBytes = Buffer.from([
    '---', 'sourceVersion: 2', 'locale: zh-TW', 'title: Synthetic draft', 'slug: ' + slug,
    "startDate: '2026-04-03'", "endDate: '2026-04-03'", 'isPrivate: true', '---',
    '```memory-day', 'day: 1', 'title: Synthetic day', 'moments:',
    '  - scene: garden', '    title: Garden', '    placements:',
    ...output.registry.assets.flatMap(({ assetId }, index) => [
      '      - type: photo', '        role: inline', '        media: ' + assetId, '        caption: Synthetic ' + index,
    ]),
    '```', '',
  ].join('\n'))
  const media = input.after.media.entries.map(({ media }) => ({ id: media.id, familyAssetKey: media.familyAssetKey, type: 'photo' }))
  const snapshot = { ...scope, ownerCount: 0, versionCount: 0, inventory: { days: [], media, members: [], plans: [],
    allLocales: { days: [], media } } }
  const preview = previewNewMemory({ ...scope, sourceBytes, registryBytes: json(output.registry), inventoryBytes: json(snapshot) })
  assert.equal(preview.status, 'PREVIEW')
  assert.deepEqual(preview.plan.days[0].data.moments[0].placements.map(placement => placement.media), [10, 11])
  assert.equal(preview.authorized, false)
})

test('partial, mixed-run or unpreserved evidence cannot produce a Registry', () => {
  for (const mutate of [
    input => { input.receipts.pop() },
    input => { input.supervisor.sessionId = 'different:99' },
    input => { input.supervisor.status = 'UNKNOWN' },
    input => { input.after.media.entries[1].media.id = 99 },
    input => { input.after.media.protectedState = { ...input.after.media.protectedState, protectedSha256: hash('drift') } },
    input => { input.receipts[1].objects = [] },
  ]) {
    const input = fixture()
    mutate(input)
    assert.throws(() => run(input))
  }
})
