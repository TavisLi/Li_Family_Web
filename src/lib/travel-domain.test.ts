import assert from 'node:assert/strict'

import { classifyTravelPlan } from './travel-domain'

assert.equal(
  classifyTravelPlan('2027-02-08T00:00:00.000Z', new Date('2026-08-01T00:00:00.000Z')),
  'active',
)
assert.equal(
  classifyTravelPlan('2026-07-08T00:00:00.000Z', new Date('2026-08-01T00:00:00.000Z')),
  'archived',
)
assert.equal(
  classifyTravelPlan('2026-08-01T23:59:59.000Z', new Date('2026-08-01T08:00:00.000Z')),
  'active',
)
