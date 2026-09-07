import assert from 'node:assert/strict'
import test from 'node:test'
import { readC0ContentInventory } from './phase21-c0-inventory.mjs'
import { c0Slugs } from './phase21-c0-pages.mjs'
const sql = Object.fromEntries(['parents','days','highlights','itinerary'].map((key) => [key, 'SELECT 1 AS legacy_relation_id']))
const parents = () => c0Slugs.map((slug, i) => ({ slug, memory_id: i + 1, latest_version_count: 1,
  version_count: 19, published_day_count: 0, day_count: 0, highlight_count: 0, itinerary_count: 0 }))
const envelope = (rows) => { const body = JSON.stringify(rows); return { rows: [{ body, bytes: Buffer.byteLength(body) }] } }
test('combines exact parents with zero children without inventing mappings', async () => {
  const result = await readC0ContentInventory(async (label) => envelope(label === 'parents' ? parents() : []), sql)
  assert.equal(result.parents.length, 3)
  assert.deepEqual(result.highlights, [])
})
test('owner mismatch blocks before later inventory queries', async () => {
  const calls = []
  await assert.rejects(readC0ContentInventory(async (label) => {
    calls.push(label)
    return envelope(label === 'parents' ? parents() : [{ legacy_relation_id: 1, memory_id: 4, slug: c0Slugs[0] }])
  }, sql), /child owner scope/)
  assert.deepEqual(calls, ['parents','days'])
})
test('parent counts detect incomplete child extraction', async () => {
  const rows = parents(); rows[0].highlight_count = 1
  await assert.rejects(readC0ContentInventory(async (label) => envelope(label === 'parents' ? rows : []), sql), /incomplete highlights/)
})
