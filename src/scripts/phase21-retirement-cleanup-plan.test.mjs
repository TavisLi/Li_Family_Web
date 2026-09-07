import assert from 'node:assert/strict'
import { buildRetirementCleanupPlan } from './phase21-retirement-cleanup-plan.mjs'

const plan = buildRetirementCleanupPlan({
  backupSha256: '7f6041a1a0caf3b3b7b0dccbb575d3b3a3a6c4aa56b648fcc879a2e23b52e46b',
  relations: {
    travel_memories_rels: [
      { id: 1, parent_id: 1, path: 'itineraryImages' },
      { id: 3, parent_id: 2, path: 'dailyHighlights.0.mediaItems' },
    ],
    _travel_memories_v_rels: [
      { id: 2, parent_id: 19, path: 'version.dailyHighlights.0.mediaItems' },
      { id: 4, parent_id: 20, path: 'version.itineraryImages' },
    ],
  },
})
assert.equal(plan.invariant.tables.length, 8)
assert.equal(plan.invariant.relationDeleteCount, 4)
assert.equal(plan.relationDeletes.length, 2)
assert(plan.drops.every(statement => statement.endsWith(' RESTRICT') && !statement.includes('CASCADE')))
assert(plan.drops.every(statement => statement.includes('daily_highlights')))
assert(plan.relationDeletes.every(statement => /^DELETE FROM public\."(_travel_memories_v_rels|travel_memories_rels)" target USING jsonb_to_recordset\(\$1::jsonb\)/.test(statement.text)))
assert(plan.relationDeletes.every(statement => statement.values.length === 1 && JSON.parse(statement.values[0]).length === 2))
assert.throws(() => buildRetirementCleanupPlan({ backupSha256: 'bad', relations: {} }), /Invalid backup checksum/)
console.log('retirement cleanup plan tests PASS')
