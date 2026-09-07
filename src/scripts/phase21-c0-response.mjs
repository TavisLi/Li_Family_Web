import assert from 'node:assert/strict'

// Only wrap reviewed, fixed SQL loaded by the executor, never user input.
export function boundedC0Sql(reviewedSql, textCursor = false) {
  return `WITH c0_page AS MATERIALIZED (${reviewedSql.trim().replace(/;$/, '')}),
 c0_json AS MATERIALIZED (SELECT coalesce(jsonb_agg(to_jsonb(c0_page) ORDER BY legacy_relation_id${textCursor ? ' COLLATE "C"' : ''}), '[]'::jsonb)::text AS body FROM c0_page),
 c0_size AS (SELECT body, octet_length(body) AS bytes FROM c0_json)
 SELECT bytes, CASE WHEN bytes <= 65536 THEN body ELSE NULL END AS body FROM c0_size`
}

export function decodeC0Response(result) {
  assert(Array.isArray(result.rows) && result.rows.length === 1, 'BLOCK: response envelope')
  const { bytes, body } = result.rows[0]
  assert(Number.isSafeInteger(bytes) && bytes >= 2 && bytes <= 65536, 'BLOCK: server response byte cap')
  assert(typeof body === 'string' && Buffer.byteLength(body) === bytes, 'BLOCK: response byte mismatch')
  const rows = JSON.parse(body)
  assert(Array.isArray(rows), 'BLOCK: response payload')
  return rows
}
