import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import { reconcileFamilyPhotoSnapshots } from './travel-memory-family-photo-reconcile.mjs'

const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const tableNames = ['_travel_memories_v', '_travel_plans_v', 'media', 'media_locales', 'media_rels', 'travel_memories', 'travel_plans']
const protectedTables = tableNames.map(table => {
  const exclude = { media: 'id', media_locales: '_parent_id' }[table]
  return `SELECT '${table}' AS name, count(*)::int AS count,
    encode(sha256(convert_to(coalesce(string_agg(
      encode(sha256(convert_to(to_jsonb(t)::text, 'UTF8')), 'hex'), '' ORDER BY t.id), ''), 'UTF8')), 'hex') AS digest
    FROM public."${table}" AS t${exclude ? ' WHERE NOT (t.' + exclude + ' = ANY($3::int[]))' : ''}`
})

// This statement returns only scoped owner facts and fixed-size fingerprints.
// Its hash belongs in the write admission; the old v4 reader does not use it.
export const familyPhotoPreservationSql = `
WITH protected AS (${protectedTables.join('\nUNION ALL\n')})
SELECT
  NOT EXISTS (SELECT 1 FROM public.travel_memories WHERE slug = $1) AS no_owner,
  NOT EXISTS (SELECT 1 FROM public._travel_memories_v WHERE version_slug = $1) AS no_version,
  (SELECT CASE WHEN count(*) = 1 THEN min(id) END FROM public.travel_plans WHERE slug = $2) AS origin_id,
  (SELECT count(*) = cardinality($3::int[]) AND count(DISTINCT _parent_id) = cardinality($3::int[])
    AND coalesce(bool_and(_locale::text = 'zh-TW'), true)
    FROM public.media_locales WHERE _parent_id = ANY($3::int[])) AS added_locales_clean,
  (SELECT count(*) = 7 AND bool_and(c.relkind = 'r' AND has_table_privilege(c.oid, 'SELECT')
    AND NOT row_security_active(c.oid))
   FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public' AND c.relname IN (${tableNames.map(table => "'" + table + "'").join(', ')})) AS visible,
  (SELECT jsonb_agg(to_jsonb(protected) ORDER BY name COLLATE "C") FROM protected) AS protected
`

export function familyPhotoProtectedObserver({ slug, originSlug, originId, addedIds = [] }) {
  assert(typeof slug === 'string' && typeof originSlug === 'string' && Number.isSafeInteger(originId) && originId > 0)
  assert(addedIds.length <= 842 && new Set(addedIds).size === addedIds.length &&
    addedIds.every(id => Number.isSafeInteger(id) && id > 0 && id <= 2147483647))
  return async query => {
    const { rows } = await query(familyPhotoPreservationSql, [slug, originSlug, addedIds])
    assert.equal(rows.length, 1)
    const result = rows[0]
    assert(result.visible === true && result.no_owner === true && result.no_version === true && result.added_locales_clean === true &&
      result.origin_id === originId, 'BLOCK: owner, origin or protected visibility drift')
    assert.deepEqual(result.protected.map(row => row.name), tableNames)
    assert(result.protected.every(row => Number.isSafeInteger(row.count) && row.count >= 0 &&
      typeof row.digest === 'string' && /^[a-f0-9]{64}$/.test(row.digest)))
    return { originId, protectedSha256: digest(result.protected) }
  }
}

export function familyPhotoPreservationReadback({ prepared, registry, scope, before, after, receipts }) {
  assert(before.status === 'PASS' && before.rollback === 'CONFIRMED' && after.status === 'PASS' && after.rollback === 'CONFIRMED')
  assert.match(before.protectedState?.protectedSha256 ?? '', /^[a-f0-9]{64}$/)
  assert.deepEqual(after.protectedState, before.protectedState, 'BLOCK: protected data changed')
  assert.equal(receipts.length, prepared.entries.length)
  const ids = new Map(receipts.map(({ assetId, mediaId }) => [assetId, mediaId]))
  assert.equal(ids.size, receipts.length)
  assert.equal(new Set(ids.values()).size, receipts.length)
  const verify = reconcileFamilyPhotoSnapshots({ prepared, registry, scope, mediaSnapshot: after, objectSnapshot: {
    status: 'PASS', binding: after.binding,
    entries: receipts.map(({ assetId, objects, stage }) => {
      assert.equal(stage, 'VERIFIED')
      return { assetId, objects: objects.map(object => ({ ...object, state: 'FOUND' })) }
    }),
  } })
  assert.equal(verify.counts.REUSE_MEDIA, receipts.length, 'BLOCK: independent Media or SHA mismatch')
  assert(verify.rows.every(row => ids.get(row.assetId) === row.mediaId), 'BLOCK: committed Media identity changed')
  return { status: 'PASS', verified: receipts.length, protectedSha256: after.protectedState.protectedSha256 }
}
