import assert from 'node:assert/strict'
import { c0Slugs } from './phase21-c0-pages.mjs'

export function validateC0Parents(rows) {
  assert.equal(rows.length, c0Slugs.length, 'BLOCK: parent count')
  assert.deepEqual(rows.map((r) => r.slug).sort(), [...c0Slugs].sort(), 'BLOCK: parent identities')
  assert.equal(new Set(rows.map((r) => r.memory_id)).size, rows.length, 'BLOCK: duplicate parent id')
  for (const row of rows) {
    assert(Number.isSafeInteger(row.memory_id) && row.memory_id > 0, 'BLOCK: parent id')
    assert.equal(row.latest_version_count, 1, 'BLOCK: latest version ambiguity')
    for (const [key, value] of Object.entries(row)) {
      if (key.endsWith('_count')) assert(Number.isSafeInteger(value) && value >= 0, 'BLOCK: inventory count')
    }
    assert(row.version_count >= 1, 'BLOCK: missing version')
    assert(row.published_day_count <= row.day_count, 'BLOCK: day count subset')
  }
  // Drafts are reported as observed; validation never publishes or modifies them.
  return rows
}
