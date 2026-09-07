import assert from 'node:assert/strict'
import { retirementTables, retirementDeletes } from './phase21-retirement-scope.mjs'

assert.equal(retirementTables.length, 8)
assert.equal(new Set(retirementTables).size, 8)
assert(retirementTables.every(name => name.includes('daily_highlights')))
const statements = retirementDeletes({
  travel_memories_rels: [{ id: 11, parent_id: 1, path: 'itineraryImages' }],
  _travel_memories_v_rels: [{ id: 21, parent_id: 19, path: 'version.dailyHighlights.0.mediaItems' }],
})
assert.equal(statements.length, 2)
assert.deepEqual(statements[0].values, [11, 1, 'itineraryImages'])
assert.match(statements[0].text, /id = \$1 AND parent_id = \$2 AND path = \$3/)
assert.throws(() => retirementDeletes({ media: [] }), /Unexpected relation table/)
assert.throws(() => retirementDeletes({ travel_memories_rels: [{ id: 11, parent_id: 1, path: 'galleryImages' }] }), /Unapproved legacy path/)
assert.throws(() => retirementDeletes({ travel_memories_rels: [{ id: 11, parent_id: 1, path: 'itineraryImages' }, { id: 11, parent_id: 1, path: 'itineraryImages' }] }), /Duplicate/)
console.log('retirement scope tests PASS')
