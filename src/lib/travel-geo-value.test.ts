import assert from 'node:assert/strict'
import { canonicalGeo, reconcileTravelGeo } from './travel-geo-value'

const geo = {
  name: { 'zh-TW': '地點', en: 'Place' },
  latitude: 0, longitude: 0, crs: 'WGS84', provenance: null, originalCRS: null,
}
const reordered = {
  originalCRS: null, provenance: null, crs: 'WGS84', longitude: 0, latitude: 0,
  name: { en: 'Place', 'zh-TW': '地點' },
}
assert.equal(canonicalGeo(geo), canonicalGeo(reordered), 'field and locale order must not change binding')
assert.equal(JSON.parse(canonicalGeo(geo)).latitude, 0, '0,0 remains a valid coordinate')
assert.equal(JSON.parse(canonicalGeo({ ...geo, latitude: -0 })).latitude, 0)
assert.equal(JSON.parse(canonicalGeo({ ...geo, latitude: null, longitude: null })).latitude, null)
assert.equal(JSON.parse(canonicalGeo({ ...geo, crs: 'UNKNOWN', originalCRS: 'GCJ02' })).crs, 'UNKNOWN', 'unverified CRS may be stored, but is not WGS84')
assert.equal(JSON.parse(canonicalGeo({ ...geo, name: { 'zh-TW': null, en: 'Place' } })).name['zh-TW'], null, 'no locale fallback')

for (const invalid of [
  null, undefined, [], {},
  { ...geo, name: { en: 'Place' } },
  { ...geo, name: { ...geo.name, fr: 'Lieu' } },
  { ...geo, latitude: undefined },
  { ...geo, latitude: null },
  { ...geo, latitude: Infinity },
  { ...geo, latitude: NaN },
  { ...geo, latitude: 91 },
  { ...geo, longitude: -181 },
  { ...geo, latitude: '0' },
  { ...geo, approval: { audience: 'public' } },
  { ...geo, provenance: {} },
]) assert.throws(() => canonicalGeo(invalid), /geo/i)
for (const field of ['name', 'latitude', 'longitude', 'crs', 'provenance', 'originalCRS']) {
  const omitted: Record<string, unknown> = { ...geo }
  delete omitted[field]
  assert.throws(() => canonicalGeo(omitted), /explicit|complete/i, `${field} omission must not clear content`)
}

const source = { ...geo, latitude: 10 }
const current = { ...geo, longitude: 20 }
assert.deepEqual(reconcileTravelGeo(source, geo, geo), { action: 'update', value: source, base: source })
assert.deepEqual(reconcileTravelGeo(geo, geo, current), { action: 'preserve', value: current, base: geo })
assert.deepEqual(reconcileTravelGeo(source, geo, current), { action: 'conflict', value: current, base: geo }, 'different component edits never fabricate a third location')
assert.deepEqual(reconcileTravelGeo(source, geo, source), { action: 'preserve', value: source, base: source })
assert.deepEqual(reconcileTravelGeo(source, undefined, current), { action: 'preserve', value: current, base: undefined })
assert.deepEqual(reconcileTravelGeo(source, {}, current), { action: 'preserve', value: current, base: {} })
assert.deepEqual(reconcileTravelGeo(source, undefined, null), { action: 'preserve', value: null, base: undefined }, 'an existing empty geo has no proven Base')
assert.deepEqual(reconcileTravelGeo(source, undefined, undefined), { action: 'create', value: source, base: source }, 'only an explicitly absent current entry is new')
assert.deepEqual(reconcileTravelGeo(undefined, geo, current), { action: 'skip', value: current, base: geo }, 'missing Source never deletes')
assert.deepEqual(reconcileTravelGeo(null, geo, current), { action: 'conflict', value: current, base: geo }, 'clearing requires separate review')
assert.deepEqual(reconcileTravelGeo(source, geo, {}), { action: 'conflict', value: {}, base: geo }, 'an invalid Current is not evidence for source-only update')
assert.throws(() => reconcileTravelGeo({ ...source, approval: {} }, geo, current), /geo/i)
assert.throws(() => reconcileTravelGeo({ latitude: 10 }, geo, current), /geo/i)
console.log('Travel geo canonical values and atomic reconciliation PASS')
