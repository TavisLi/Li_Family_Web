import assert from 'node:assert/strict'

// Dependency order; shared relation tables and Media are never DROP targets.
export const retirementTables = Object.freeze([
  'travel_memories_daily_highlights_segments_locales',
  'travel_memories_daily_highlights_segments',
  'travel_memories_daily_highlights_locales',
  'travel_memories_daily_highlights',
  '_travel_memories_v_version_daily_highlights_segments_locales',
  '_travel_memories_v_version_daily_highlights_segments',
  '_travel_memories_v_version_daily_highlights_locales',
  '_travel_memories_v_version_daily_highlights',
])
export const relationReadBatchSize = 100

// Pure statement builder, NOT a Production executor or approval validator.
// Callers must supply reviewed exact rows; this does not discover/delete by prefix.
export function retirementDeletes(relations) {
  const result = []
  for (const [table, rows] of Object.entries(relations)) {
    assert(['travel_memories_rels', '_travel_memories_v_rels'].includes(table), 'Unexpected relation table')
    const seen = new Set()
    for (const row of rows) {
      assert(Number.isSafeInteger(row.id) && row.id > 0 && Number.isSafeInteger(row.parent_id) && row.parent_id > 0, 'Invalid row identity')
      assert(typeof row.path === 'string' && /^(version\.)?(itineraryImages|dailyHighlights\.[0-9]+\.mediaItems)$/.test(row.path), 'Unapproved legacy path')
      assert(!seen.has(row.id), 'Duplicate relation identity')
      seen.add(row.id)
    }
    assert(rows.length > 0, 'Empty relation delete batch')
    result.push({
      text: `DELETE FROM public."${table}" target USING jsonb_to_recordset($1::jsonb) AS expected(id integer,parent_id integer,path text) WHERE target.id = expected.id AND target.parent_id = expected.parent_id AND target.path = expected.path RETURNING target.id`,
      values: [JSON.stringify(rows.map(({ id, parent_id, path }) => ({ id, parent_id, path })))],
    })
  }
  return result
}

// Reads use the backup's exact primary keys rather than scanning shared
// relation tables by path. Callers still compare every returned row.
export function retirementRelationReads(relations) {
  const result = []
  for (const [table, rows] of Object.entries(relations)) {
    assert(['travel_memories_rels', '_travel_memories_v_rels'].includes(table), 'Unexpected relation table')
    const ids = rows.map(row => row.id).sort((left, right) => left - right)
    assert(ids.length > 0 && ids.every(id => Number.isSafeInteger(id) && id > 0), 'Invalid relation read identity')
    assert.equal(new Set(ids).size, ids.length, 'Duplicate relation read identity')
    for (let offset = 0; offset < ids.length; offset += relationReadBatchSize) {
      result.push({ table, text: `SELECT * FROM public."${table}" WHERE id = ANY($1::int[]) ORDER BY id`, values: [ids.slice(offset, offset + relationReadBatchSize)] })
    }
  }
  return result
}
