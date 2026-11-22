import assert from 'node:assert/strict'

// expectedReferences is derived from the separately bound SQL artifact and
// checked against the actual catalog by the caller before this function runs.
export function assertFixtureReferences({ expectedReferences, rows, locales, locale, altText }) {
  assert.equal(expectedReferences.length, 25, 'BLOCK: reference roster size')
  assert.equal(new Set(expectedReferences).size, 25, 'BLOCK: duplicate reference roster')
  assert(expectedReferences.includes('media_locales._parent_id'), 'BLOCK: locale reference absent')
  assert.equal(rows.length, 25, 'BLOCK: incomplete reference observations')
  const counts = new Map()
  for (const row of rows) {
    assert(expectedReferences.includes(row.reference) && !counts.has(row.reference), 'BLOCK: unexpected reference')
    assert(typeof row.row_count === 'string' && /^(0|[1-9][0-9]*)$/.test(row.row_count), 'BLOCK: unknown reference count')
    counts.set(row.reference, row.row_count)
  }
  for (const name of expectedReferences) {
    assert.equal(counts.get(name), name === 'media_locales._parent_id' ? '1' : '0', 'BLOCK: fixture is referenced')
  }
  assert.equal(locales.length, 1, 'BLOCK: fixture locale count')
  assert.equal(locales[0]._locale, locale, 'BLOCK: fixture locale drift')
  assert.equal(locales[0].alt_text, altText, 'BLOCK: fixture alt text drift')
}
