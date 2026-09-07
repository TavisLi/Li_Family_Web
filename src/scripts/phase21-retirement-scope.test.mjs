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
assert.deepEqual(JSON.parse(statements[0].values[0]), [{ id: 11, parent_id: 1, path: 'itineraryImages' }])
assert.match(statements[0].text, /jsonb_to_recordset\(\$1::jsonb\)/)
assert.match(statements[0].text, /target\.id = expected\.id AND target\.parent_id = expected\.parent_id AND target\.path = expected\.path/)
assert.throws(() => retirementDeletes({ media: [] }), /Unexpected relation table/)
assert.throws(() => retirementDeletes({ travel_memories_rels: [{ id: 11, parent_id: 1, path: 'galleryImages' }] }), /Unapproved legacy path/)
assert.throws(() => retirementDeletes({ travel_memories_rels: [{ id: 11, parent_id: 1, path: 'itineraryImages' }, { id: 11, parent_id: 1, path: 'itineraryImages' }] }), /Duplicate/)
assert.throws(() => retirementDeletes({ travel_memories_rels: [] }), /Empty/)
console.log('retirement scope tests PASS')
