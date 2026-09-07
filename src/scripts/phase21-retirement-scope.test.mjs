import assert from 'node:assert/strict'
import { retirementTables, retirementDeletes, retirementRelationReads } from './phase21-retirement-scope.mjs'

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
const reads = retirementRelationReads({
  travel_memories_rels: [{ id: 11, parent_id: 1, path: 'itineraryImages' }],
  _travel_memories_v_rels: [{ id: 21, parent_id: 19, path: 'version.dailyHighlights.0.mediaItems' }],
})
assert.equal(reads.length, 2)
assert.deepEqual(reads[0].values, [[11]])
assert.match(reads[0].text, /WHERE id = ANY\(\$1::int\[\]\) ORDER BY id$/)
assert.doesNotMatch(reads[0].text, /path ~|LIKE/)
const boundedReads = retirementRelationReads({
  travel_memories_rels: Array.from({ length: 201 }, (_, index) => ({ id: index + 1, parent_id: 1, path: 'itineraryImages' })),
})
assert.equal(boundedReads.length, 3)
assert.deepEqual(boundedReads.map(read => read.values[0].length), [100, 100, 1])
assert.throws(() => retirementDeletes({ media: [] }), /Unexpected relation table/)
assert.throws(() => retirementDeletes({ travel_memories_rels: [{ id: 11, parent_id: 1, path: 'galleryImages' }] }), /Unapproved legacy path/)
assert.throws(() => retirementDeletes({ travel_memories_rels: [{ id: 11, parent_id: 1, path: 'itineraryImages' }, { id: 11, parent_id: 1, path: 'itineraryImages' }] }), /Duplicate/)
assert.throws(() => retirementDeletes({ travel_memories_rels: [] }), /Empty/)
console.log('retirement scope tests PASS')
