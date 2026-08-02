import assert from 'node:assert/strict'

import { travelMemoryMultipageEnabled } from './travel-memory-rollout'

const original = process.env.TRAVEL_MEMORY_MULTIPAGE_ENABLED

delete process.env.TRAVEL_MEMORY_MULTIPAGE_ENABLED
assert.equal(travelMemoryMultipageEnabled(), false)
process.env.TRAVEL_MEMORY_MULTIPAGE_ENABLED = 'false'
assert.equal(travelMemoryMultipageEnabled(), false)
process.env.TRAVEL_MEMORY_MULTIPAGE_ENABLED = 'true'
assert.equal(travelMemoryMultipageEnabled(), true)

if (original === undefined) delete process.env.TRAVEL_MEMORY_MULTIPAGE_ENABLED
else process.env.TRAVEL_MEMORY_MULTIPAGE_ENABLED = original

console.log('travel memory rollout tests passed')
