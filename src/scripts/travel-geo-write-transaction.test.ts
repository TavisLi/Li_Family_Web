import assert from 'node:assert/strict'
import { travelAtlasOwnerIdentity } from '../lib/travel-atlas'
import { geoApprovalSnapshot, geoContent, geoRows, geoReviewRevision } from '../payload/collections/travel-geo-review'
import { record, syntheticStore, type Kind } from '../payload/collections/travel-geo-test-store'
import { writeTravelGeo } from './travel-geo-write'

function preparedStore(kind: Kind) {
  const store = syntheticStore(kind)
  const entry = geoRows(store.state.doc, kind)[0]!
  const owner = entry.owner
  const identity = travelAtlasOwnerIdentity(owner)
  const metadataOwner = store.state.parent ?? store.state.doc
  const metadata = record(metadataOwner.sourceMetadata)
  const originalBase = record(metadata.baseProjection)
  metadata.baseProjection = { ...originalBase, atlasGeoV1: { [identity]: geoContent(entry.geo) } }
  entry.geo.approval = { snapshot: geoApprovalSnapshot(owner, entry.geo, 'public', store.state.doc, store.state.parent), audience: 'public', confirmedBy: '1' }
  const source = { ...geoContent(entry.geo), name: { 'zh-TW': '新地點', en: 'New place' }, latitude: 10 }
  return { store, owner, identity, source }
}

for (const kind of ['plan', 'memory'] as const) {
  const { store, owner, identity, source } = preparedStore(kind)
  const before = structuredClone(store.state)
  const result = await writeTravelGeo(store.req, kind, Number(before.doc.id), owner, source, geoReviewRevision(before.doc, before.parent))
  assert.equal(result.action, 'update')
  assert.deepEqual(result.stats, { create: 0, update: 1, preserve: 0, conflict: 0, skip: 0, delete: 0 })
  assert.deepEqual(result.beforeImage, geoContent(geoRows(before.doc, kind)[0]!.geo))
  assert.equal(store.commits, 1)
  assert.equal(store.rollbacks, 0)
  assert.equal(store.writes, 3, 'two locale content writes and one owning Base write')
  assert.deepEqual(store.updateOptions.slice(0, 2).map(args => args.locale), ['zh-TW', 'en'])
  const saved = geoRows(store.state.doc, kind)[0]!
  assert.deepEqual(geoContent(saved.geo), source)
  assert.equal(saved.geo.approval, null, 'Source cannot approve geographic content')
  const base = record(record((store.state.parent ?? store.state.doc).sourceMetadata).baseProjection)
  assert.deepEqual(record(base.atlasGeoV1)[identity], source)
  const expected = structuredClone(before)
  geoRows(expected.doc, kind)[0]!.row.geo = { ...source, approval: null }
  record((expected.parent ?? expected.doc).sourceMetadata).baseProjection = base
  expected.doc.updatedAt = store.state.doc.updatedAt
  if (expected.parent) expected.parent.updatedAt = store.state.parent?.updatedAt
  assert.deepEqual(store.state, expected, 'all non-target rows, keys, locales, placements and envelope data survive')
  const lastContent = store.operations.lastIndexOf('write:content')
  const baseWrite = store.operations.indexOf('write:base')
  assert.ok(lastContent < baseWrite)
  assert.ok(store.operations.slice(lastContent + 1, baseWrite).includes('read'), 'content is read back before any Base mutation')
  assert.ok(store.operations.slice(baseWrite + 1, store.operations.indexOf('commit')).includes('read'), 'Base is read back before commit')

  for (const failure of ['content', 'base']) {
    const failing = preparedStore(kind)
    const failingBefore = structuredClone(failing.store.state)
    if (failure === 'content') failing.store.failReadBack()
    else failing.store.failBaseReadBack()
    await assert.rejects(() => writeTravelGeo(failing.store.req, kind, Number(failingBefore.doc.id), failing.owner,
      failing.source, geoReviewRevision(failingBefore.doc, failingBefore.parent)), /read-back/)
    assert.equal(failing.store.commits, 0)
    assert.equal(failing.store.rollbacks, 1)
    assert.deepEqual(failing.store.state, failingBefore, 'failure restores content and never commits an advanced Base')
    if (failure === 'content') assert.equal(failing.store.operations.includes('write:base'), false)
  }

  const forged = preparedStore(kind)
  await assert.rejects(() => writeTravelGeo(forged.store.req, kind, Number(forged.store.state.doc.id), forged.owner,
    { ...forged.source, approval: { audience: 'public' } }, geoReviewRevision(forged.store.state.doc, forged.store.state.parent)), /geo/i)
  assert.equal(forged.store.writes, 0)
  const stale = preparedStore(kind)
  await assert.rejects(() => writeTravelGeo(stale.store.req, kind, Number(stale.store.state.doc.id), stale.owner, stale.source, 'stale'), /Current changed/)
  assert.equal(stale.store.writes, 0)

  const conflict = preparedStore(kind)
  geoRows(conflict.store.state.doc, kind)[0]!.geo.longitude = 30
  const conflictBefore = structuredClone(conflict.store.state)
  await assert.rejects(() => writeTravelGeo(conflict.store.req, kind, Number(conflictBefore.doc.id), conflict.owner,
    conflict.source, geoReviewRevision(conflictBefore.doc, conflictBefore.parent)), /reconciliation conflict/)
  assert.equal(conflict.store.writes, 0)
  assert.deepEqual(conflict.store.state, conflictBefore)

  const missingBase = syntheticStore(kind)
  const missingEntry = geoRows(missingBase.state.doc, kind)[0]!
  const missingBefore = structuredClone(missingBase.state)
  const preserved = await writeTravelGeo(missingBase.req, kind, Number(missingBefore.doc.id), missingEntry.owner, source,
    geoReviewRevision(missingBefore.doc, missingBefore.parent))
  assert.equal(preserved.action, 'preserve')
  assert.equal(missingBase.writes, 0)
  assert.deepEqual(missingBase.state, missingBefore)
}
console.log('Travel geo write transaction tests PASS (synthetic store; no database round-trip proof)')
