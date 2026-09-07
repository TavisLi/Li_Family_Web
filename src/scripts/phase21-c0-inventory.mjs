import assert from 'node:assert/strict'
import { boundedC0Sql, decodeC0Response } from './phase21-c0-response.mjs'
import { c0Slugs, readC0Pages, readC0MappingPages } from './phase21-c0-pages.mjs'
import { validateC0Parents } from './phase21-c0-parents.mjs'

// Called inside a verified read-only transaction. Query callback owns total
// budget and checkpoints. All SQL comes from the reviewed local query manifest.
export async function readC0ContentInventory(query, sql) {
  const parents = validateC0Parents(decodeC0Response(await query('parents', boundedC0Sql(sql.parents), [c0Slugs])))
  const owners = new Map(parents.map((row) => [row.slug, row.memory_id]))
  const validateOwner = (row) => {
    assert(owners.has(row.slug) && owners.get(row.slug) === row.memory_id, 'BLOCK: child owner scope')
  }
  const days = await readC0Pages(async (slugs, cursor) => decodeC0Response(await query('days', boundedC0Sql(sql.days), [slugs, cursor])), { validate: validateOwner })
  const highlights = await readC0Pages(async (slugs, cursor) => decodeC0Response(await query('highlights', boundedC0Sql(sql.highlights, true), [slugs, cursor])), {
    textCursor: true, validate(row) {
      validateOwner(row)
      assert.equal(row.mapping_status, 'UNMAPPED_NO_STABLE_LINK', 'BLOCK: inferred highlight mapping')
    },
  })
  const itinerary = await readC0MappingPages(async (slugs, cursor) => {
    const rows = decodeC0Response(await query('itinerary', boundedC0Sql(sql.itinerary), [slugs, cursor]))
    rows.forEach(validateOwner)
    return rows
  })
  for (const parent of parents) {
    const count = (rows) => rows.filter((row) => row.memory_id === parent.memory_id).length
    assert.equal(count(days.rows), parent.day_count, 'BLOCK: incomplete Days')
    assert.equal(count(highlights.rows), parent.highlight_count, 'BLOCK: incomplete highlights')
    assert.equal(count(itinerary.rows), parent.itinerary_count, 'BLOCK: incomplete itinerary')
  }
  return { parents, days: days.rows, highlights: highlights.rows, itinerary: itinerary.rows }
}
