import assert from 'node:assert/strict'
import { fixture } from './fixture.mjs'
assert.deepEqual(fixture.locales, ['zh-TW', 'en'])
assert.equal(new Set(fixture.scenarios).size, fixture.scenarios.length)
assert.equal(new Set(fixture.trips.map(trip => trip.key)).size, 2)
assert.deepEqual(Object.keys(fixture.geo.name).sort(), [...fixture.locales].sort())
console.log('PASS: deterministic synthetic fixture specification')
