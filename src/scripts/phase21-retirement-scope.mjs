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
      result.push({ text: `DELETE FROM public."${table}" WHERE id = $1 AND parent_id = $2 AND path = $3 RETURNING id`, values: [row.id, row.parent_id, row.path] })
    }
  }
  return result
}
