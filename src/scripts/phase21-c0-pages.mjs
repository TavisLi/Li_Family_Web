import assert from 'node:assert/strict'

export const c0Slugs = Object.freeze(['201307-hainan', '202308-east-australia', '202602-thailand-phuket'])
export const c0PageLimits = Object.freeze({ rows: 100, bytes: 65536, pages: 50, totalBytes: 1048576 })

// The caller owns a single read-only transaction and the SQL timeout. This
// boundary validates complete responses; server-side byte caps remain required.
export async function readC0MappingPages(queryPage) {
  return readC0Pages(queryPage, { validate: validateMapping })
}

export async function readC0Pages(queryPage, { textCursor = false, validate = () => {} } = {}) {
  const rows = []
  let cursor = textCursor ? '' : 0
  let totalBytes = 0
  for (let page = 1; page <= c0PageLimits.pages; page++) {
    const batch = await queryPage(c0Slugs, cursor)
    assert(Array.isArray(batch) && batch.length <= 101, 'BLOCK: response row cap')
    const bytes = Buffer.byteLength(JSON.stringify(batch))
    assert(bytes <= c0PageLimits.bytes, 'BLOCK: response byte cap')
    totalBytes += bytes
    assert(totalBytes <= c0PageLimits.totalBytes, 'BLOCK: total byte cap')
    let previous = cursor
    for (const row of batch) {
      assert(textCursor
        ? typeof row.legacy_relation_id === 'string' && Buffer.compare(Buffer.from(row.legacy_relation_id), Buffer.from(previous)) > 0
        : Number.isSafeInteger(row.legacy_relation_id) && row.legacy_relation_id > previous, 'BLOCK: cursor order')
      previous = row.legacy_relation_id
      validate(row)
    }
    rows.push(...batch.slice(0, c0PageLimits.rows))
    if (batch.length <= c0PageLimits.rows) return { rows, pages: page, responseBytes: totalBytes }
    cursor = batch[c0PageLimits.rows - 1].legacy_relation_id
  }
  throw new Error('BLOCK: page budget exhausted')
}

function validateMapping(row) {
  assert(c0Slugs.includes(row.slug), 'BLOCK: unexpected Memory')
  for (const key of ['legacy_usage_count', 'candidate_count', 'published_keyed_candidate_count']) {
    assert(/^(0|[1-9][0-9]*)$/.test(String(row[key])) && Number.isSafeInteger(Number(row[key])), 'BLOCK: invalid count')
  }
  assert(Number(row.legacy_usage_count) >= 1, 'BLOCK: missing legacy usage')
  assert(Number(row.published_keyed_candidate_count) <= Number(row.candidate_count), 'BLOCK: invalid candidate subset')
  assert(Array.isArray(row.destinations) && row.destinations.length <= 20, 'BLOCK: destination cap')
  assert.equal(row.destinations.length, Number(row.candidate_count), 'BLOCK: incomplete destinations')
}
