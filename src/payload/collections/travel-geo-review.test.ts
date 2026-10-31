import assert from 'node:assert/strict'
import { travelAtlasOwnerIdentity } from '../../lib/travel-atlas'
import { guardTravelGeoIdentity } from './travel-geo'
import { geoApprovalSnapshot, geoContent, geoReviewRevision, geoRows, reviewTravelGeo, travelGeoReviewEndpoints } from './travel-geo-review'

import { syntheticStore, record, hoist } from './travel-geo-test-store'

for (const kind of ['plan', 'memory'] as const) {
  const store = syntheticStore(kind)
  const before = structuredClone(store.state)
  const entry = geoRows(store.state.doc, kind)[0]!
  const input = { action: 'approve', audience: 'public', expectedRevision: geoReviewRevision(store.state.doc, store.state.parent),
    sectionOrDayKey: entry.owner[2], itemKey: entry.owner[3] }
  const approved = await reviewTravelGeo(store.req, kind, Number(store.state.doc.id), input)
  assert.equal(approved.result, 'approved')
  assert.equal(store.writes, 1)
  assert.equal(store.commits, 1)
  assert.equal(store.rollbacks, 0)
  assert.ok(store.operations.indexOf('lock') < store.operations.indexOf('read'), 'lock precedes Current read')
  const saved = geoRows(store.state.doc, kind)[0]!
  const approval = record(saved.geo.approval)
  assert.equal(approval.snapshot, geoApprovalSnapshot(entry.owner, entry.geo, 'public', before.doc, before.parent))
  assert.ok(String(approval.snapshot).includes(travelAtlasOwnerIdentity(entry.owner).replaceAll('"', '\\"')), 'snapshot includes complete owner')
  assert.deepEqual(geoContent(saved.geo), geoContent(entry.geo), 'approval changes no locale or coordinate')
  const expected = structuredClone(before)
  geoRows(expected.doc, kind)[0]!.geo.approval = saved.geo.approval
  expected.doc.updatedAt = store.state.doc.updatedAt
  assert.deepEqual(store.state, expected, 'non-target text, rows, relationships and Base remain unchanged')
  assert.equal(store.updateOptions[0]!.draft, false)
  assert.equal(store.state.doc._status, 'published')

  const changedLocale = structuredClone(entry.geo)
  record(changedLocale.name).en = 'Other locale changed'
  assert.notEqual(approval.snapshot, geoApprovalSnapshot(entry.owner, changedLocale, 'public', before.doc, before.parent))
  assert.notEqual(approval.snapshot, geoApprovalSnapshot(entry.owner, entry.geo, 'family', before.doc, before.parent))
  if (before.parent) {
    const newParent = guardTravelGeoIdentity('parent', { isPrivate: true }, before.parent)
    const shrunk = { ...before.parent, ...newParent }
    assert.notEqual(approval.snapshot, geoApprovalSnapshot(entry.owner, entry.geo, 'public', before.doc, shrunk))
    const widened = { ...shrunk, ...guardTravelGeoIdentity('parent', { isPrivate: false }, shrunk) }
    assert.notEqual(approval.snapshot, geoApprovalSnapshot(entry.owner, entry.geo, 'public', before.doc, widened), 'reopening audience does not revive approval')
  }

  const ordinary = kind === 'plan' ? { planningSections: [{ id: 'section-row', anchor: 'section', title: 'Edited text only' }] }
    : { moments: [{ id: 'moment-row', momentKey: 'moment', title: 'Edited text only' }] }
  const edited = guardTravelGeoIdentity(kind, ordinary, record(hoist(store.state.doc)))
  assert.deepEqual(geoRows({ ...record(hoist(store.state.doc)), ...edited }, kind)[0]!.geo.approval, approval,
    'ordinary Admin text edits preserve approval and geo')

  const stable = structuredClone(store.state)
  await assert.rejects(() => reviewTravelGeo(store.req, kind, Number(store.state.doc.id), input), /Current changed/)
  assert.equal(store.writes, 1, 'replayed review must not write')
  assert.deepEqual(store.state, stable)
  assert.equal(store.rollbacks, 1)

  const rawRows = kind === 'plan' ? { planningSections: [{ id: 'section-row', anchor: 'section', geoStops: [{ id: 'stop-row', stopKey: 'stop', geo: { approval: { snapshot: 'forged' } } }] }] }
    : { moments: [{ id: 'moment-row', momentKey: 'moment', geo: { approval: { snapshot: 'forged' } } }] }
  assert.throws(() => guardTravelGeoIdentity(kind, rawRows, record(hoist(store.state.doc))), /approval/)

  const revoke = await reviewTravelGeo(store.req, kind, Number(store.state.doc.id), {
    ...input, action: 'revoke', expectedRevision: geoReviewRevision(store.state.doc, store.state.parent),
  })
  assert.equal(revoke.result, 'revoked')
  assert.equal(geoRows(store.state.doc, kind)[0]!.geo.approval, null)
  assert.equal(store.state.doc._status, 'published')

  const rollback = syntheticStore(kind)
  const rollbackBefore = structuredClone(rollback.state)
  rollback.failReadBack()
  await assert.rejects(() => reviewTravelGeo(rollback.req, kind, Number(rollback.state.doc.id), {
    ...input, expectedRevision: geoReviewRevision(rollback.state.doc, rollback.state.parent),
  }), /read-back/)
  assert.equal(rollback.commits, 0)
  assert.equal(rollback.rollbacks, 1)
  assert.deepEqual(rollback.state, rollbackBefore)

  const stale = syntheticStore(kind)
  await assert.rejects(() => reviewTravelGeo(stale.req, kind, Number(stale.state.doc.id), { ...input, expectedRevision: 'stale' }), /Current changed/)
  assert.equal(stale.writes, 0)
  assert.equal(stale.commits, 0)

  const draft = syntheticStore(kind, 'draft')
  await reviewTravelGeo(draft.req, kind, Number(draft.state.doc.id), {
    ...input, expectedRevision: geoReviewRevision(draft.state.doc, draft.state.parent),
  })
  assert.equal(draft.updateOptions[0]!.draft, true)
  assert.equal(draft.state.doc._status, 'draft', 'approval never publishes a draft')
}

for (const kind of ['plan', 'memory'] as const) {
  const legacy = syntheticStore(kind, 'published', true)
  const before = structuredClone(legacy.state)
  const entry = geoRows(before.doc, kind)[0]!
  await reviewTravelGeo(legacy.req, kind, Number(before.doc.id), {
    action: 'approve', audience: 'family', expectedRevision: geoReviewRevision(before.doc, before.parent),
    sectionOrDayKey: entry.owner[2], itemKey: entry.owner[3],
  })
  assert.ok(legacy.state.doc.geoAccessRevision)
  if (kind === 'memory') assert.ok(legacy.state.parent?.geoAccessRevision)
  assert.equal(record(geoRows(legacy.state.doc, kind)[0]!.geo.approval).snapshot,
    geoApprovalSnapshot(entry.owner, entry.geo, 'family', legacy.state.doc, legacy.state.parent))
  assert.equal(legacy.commits, 1, 'legacy epoch initialization and approval share one commit')
  assert.equal(legacy.state.doc._status, 'published')
  assert.deepEqual(geoContent(geoRows(legacy.state.doc, kind)[0]!.geo), geoContent(entry.geo))

  const staleLegacy = syntheticStore(kind, 'published', true)
  await assert.rejects(() => reviewTravelGeo(staleLegacy.req, kind, Number(staleLegacy.state.doc.id), {
    action: 'approve', audience: 'family', expectedRevision: 'stale', sectionOrDayKey: entry.owner[2], itemKey: entry.owner[3],
  }), /Current changed/)
  assert.equal(staleLegacy.writes, 0, 'stale approval must not initialize legacy epochs')
}

const readStore = syntheticStore('plan')
readStore.req.routeParams = { id: '10' }
const getEndpoint = travelGeoReviewEndpoints('plan').find(endpoint => endpoint.method === 'get')!
const readResponse = await getEndpoint.handler(readStore.req)
assert.equal(readResponse.status, 200)
assert.equal(readResponse.headers.get('Cache-Control'), 'private, no-store')
assert.deepEqual(await readResponse.json(), { revision: geoReviewRevision(readStore.state.doc, readStore.state.parent) })
assert.equal(readStore.writes, 0)
assert.equal(readStore.commits, 1)
assert.ok(readStore.operations.indexOf('lock') < readStore.operations.indexOf('read'))

const postStore = syntheticStore('plan')
postStore.req.routeParams = { id: '10' }
postStore.req.json = async () => ({ action: 'approve', audience: 'public', expectedRevision: 'stale', sectionOrDayKey: 'section', itemKey: 'stop' })
const postEndpoint = travelGeoReviewEndpoints('plan').find(endpoint => endpoint.method === 'post')!
const rejectedResponse = await postEndpoint.handler(postStore.req)
assert.equal(rejectedResponse.status, 409)
assert.equal(rejectedResponse.headers.get('Cache-Control'), 'private, no-store')
assert.equal(postStore.writes, 0)
assert.deepEqual(await rejectedResponse.json(), { error: 'Geo review rejected; refresh Current before reviewing' })

for (const user of [null, { id: 2, role: 'family' }]) {
  const endpoints = travelGeoReviewEndpoints('plan')
  for (const endpoint of endpoints) {
    const response = await endpoint.handler({ user, routeParams: { id: '10' } } as never)
    assert.equal(response.status, 403)
  }
}
console.log('Travel geo review service/endpoint tests PASS (synthetic transaction store; no DB proof)')
