import assert from 'node:assert/strict'
import { buildRetirementCleanupPlan } from './phase21-retirement-cleanup-plan.mjs'

const plan = buildRetirementCleanupPlan({
  backupSha256: '7f6041a1a0caf3b3b7b0dccbb575d3b3a3a6c4aa56b648fcc879a2e23b52e46b',
  relations: {
    travel_memories_rels: [{ id: 1, parent_id: 1, path: 'itineraryImages' }],
    _travel_memories_v_rels: [{ id: 2, parent_id: 19, path: 'version.dailyHighlights.0.mediaItems' }],
  },
})
assert.equal(plan.invariant.tables.length, 8)
assert.equal(plan.invariant.relationDeleteCount, 2)
assert(plan.drops.every(statement => statement.endsWith(' RESTRICT') && !statement.includes('CASCADE')))
assert(plan.drops.every(statement => statement.includes('daily_highlights')))
assert(plan.relationDeletes.every(statement => /^DELETE FROM public\."(_travel_memories_v_rels|travel_memories_rels)" WHERE id = \$1 AND parent_id = \$2 AND path = \$3 RETURNING id$/.test(statement.text)))
assert.throws(() => buildRetirementCleanupPlan({ backupSha256: 'bad', relations: {} }), /Invalid backup checksum/)
console.log('retirement cleanup plan tests PASS')
