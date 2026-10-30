import assert from 'node:assert/strict'
import { test } from 'node:test'
import { atlasEntries, visibleAtlasEntries } from './atlas-fixtures'

test('corridor filters and day views keep only matching synthetic entries', () => {
  assert.ok(atlasEntries.length > 0)
  assert.ok(visibleAtlasEntries('corridor', '2025', 'all').every((entry) => entry.item.year === '2025'))
  assert.ok(visibleAtlasEntries('plan', 'day-2', 'all').every((entry) => entry.item.day === 'day-2'))
  assert.ok(visibleAtlasEntries('memory', 'day-1', 'all').every((entry) => entry.item.kind === 'memory' && entry.item.day === 'day-1'))
})
