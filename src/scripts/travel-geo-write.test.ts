import assert from 'node:assert/strict'
import { prepareTravelGeoWrite } from './travel-geo-write'
const geo = { name: { 'zh-TW': '地點', en: 'Place' }, latitude: 20, longitude: 100, crs: 'WGS84', provenance: null, originalCRS: null }
const doc = { id: 1, planningSections: [{ anchor: 's', id: 'section-row', geoStops: [{ stopKey: 'a', id: 'stop-row', geo }] }] }
const owner = ['plan', 1, 's', 'a'] as const
const base = { contract: 'plan-v1', locales: { en: { keep: true } }, atlasGeoV1: { 'v1:["plan",1,"s","a"]': geo } }
const changed = { ...geo, latitude: 21 }
const result = prepareTravelGeoWrite('plan', doc, base, owner, changed)
assert.equal(result.action, 'update')
assert.deepEqual(result.beforeImage, geo)
assert.deepEqual((result.nextBase as typeof base).locales, base.locales)
assert.deepEqual((result.nextBase as typeof base).atlasGeoV1['v1:["plan",1,"s","a"]'], changed)
const missing = prepareTravelGeoWrite('plan', doc, { contract: 'plan-v1' }, owner, changed)
assert.equal(missing.action, 'preserve')
assert.equal(missing.patch, undefined)
assert.equal(prepareTravelGeoWrite('plan', doc, base, owner, undefined).action, 'skip')
assert.throws(() => prepareTravelGeoWrite('plan', doc, base, ['plan', 2, 's', 'a'], changed), /owner/)
assert.throws(() => prepareTravelGeoWrite('plan', doc, base, owner, { ...changed, approval: { audience: 'public' } }), /explicit|unknown/)
console.log('Geo write plan and non-target Base preservation PASS')
