import assert from 'node:assert/strict'
import { reconcileMemoryV2 } from './travel-memory-v2-reconciliation'

const baseGeo = { name: { 'zh-TW': '地點', en: 'Place' }, latitude: 20, longitude: 100, crs: 'WGS84' }
const base = { moments: [{ momentKey: 'one', geo: baseGeo }] }
const source = { moments: [{ momentKey: 'one', geo: { ...baseGeo, latitude: 21 } }] }
const current = { moments: [{ momentKey: 'one', id: 'row-1', geo: { ...baseGeo, longitude: 101 } }] }
const conflict = reconcileMemoryV2(source, base, current)
assert.equal(conflict.action, 'conflict')
assert.deepEqual(conflict.data, current, 'different edits must never be combined into a third coordinate')

const noGeoBase = { moments: [{ momentKey: 'one' }] }
const missing = reconcileMemoryV2(source, noGeoBase, current)
assert.equal(missing.action, 'preserve-current')
assert.deepEqual(missing.data, current, 'missing geo Base must preserve Current')
assert.deepEqual(missing.base, noGeoBase, 'missing geo Base must not be silently adopted')

const sourceOnly = reconcileMemoryV2(source, base, { moments: [{ momentKey: 'one', geo: baseGeo }] })
assert.equal(sourceOnly.action, 'update')
assert.deepEqual(sourceOnly.data, source)
const omitted = reconcileMemoryV2({ moments: [{ momentKey: 'one' }] }, base, current)
assert.deepEqual(omitted.data, current, 'omission must not erase geo')
const clear = reconcileMemoryV2({ moments: [{ momentKey: 'one', geo: null }] }, base, base)
assert.deepEqual(clear.data, base, 'explicit clear requires separate review')
assert.deepEqual(clear.base, base)
const adminOnly = reconcileMemoryV2(base, base, current)
assert.deepEqual(adminOnly.data, current)
assert.deepEqual(conflict.base, base, 'a conflict must not advance the geo Base')
const partialGeo = reconcileMemoryV2({ moments: [{ momentKey: 'one', geo: { latitude: 21 } }] }, base, base)
assert.deepEqual(partialGeo.data, base, 'partial source geo must not replace a complete value')
assert.deepEqual(partialGeo.base, base)
const unprovenBase = reconcileMemoryV2(source, { moments: [{ momentKey: 'one', geo: {} }] }, current)
assert.deepEqual(unprovenBase.data, current, 'an empty geo Base cannot establish an accepted baseline')
const emptyGeo = { moments: [{ momentKey: 'one', geo: {} }] }
assert.deepEqual(reconcileMemoryV2(source, emptyGeo, emptyGeo).data, emptyGeo)
console.log('Geo reconciliation synthetic tests PASS')
