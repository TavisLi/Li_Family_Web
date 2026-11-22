import assert from 'node:assert/strict'
import { isFamilyAssetKey } from '../payload/family-media.ts'
import { createIssue134PostgresIo } from './issue134-transaction-io.mjs'
import { validateMediaRegistry } from './travel-memory-media-registry.ts'
import { sha256 } from './travel-memory-review.mjs'

const batchSize = 100

export const exactFamilyMediaSelect = `
WITH expected AS (
  SELECT *
  FROM ROWS FROM (pg_catalog.unnest($1::text[]), pg_catalog.unnest($2::text[]))
    AS lookup(family_key, source_alias)
)
SELECT e.family_key AS requested_key,
       m.id,
       m.family_asset_key = e.family_key AS family_key_matches,
       m.source_path IS NOT DISTINCT FROM e.source_alias AS alias_matches,
       m.type,
       m.mime_type,
       m.filesize AS bytes,
       pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(l.alt_text, 'UTF8')), 'hex') AS alt_text_sha,
       pg_catalog.num_nonnulls(
         m.filename, m._objectkey, m.url, m.thumbnail_u_r_l,
         m.sizes_thumbnail_filename, m.sizes_thumbnail_url,
         m.sizes_medium_filename, m.sizes_medium_url,
         m.sizes_large_filename, m.sizes_large_url
       ) > 0 AS public_storage,
       EXISTS (
         SELECT 1 FROM public.media_rels AS r
         WHERE r.parent_id = m.id AND r.path = 'relatedTravelRecord'
       ) AS has_owner
FROM expected AS e
LEFT JOIN LATERAL (
  SELECT id, family_asset_key, source_path, type, mime_type, filesize,
         filename, _objectkey, url, thumbnail_u_r_l,
         sizes_thumbnail_filename, sizes_thumbnail_url,
         sizes_medium_filename, sizes_medium_url,
         sizes_large_filename, sizes_large_url
  FROM public.media
  WHERE family_asset_key = e.family_key
     OR source_path = e.source_alias
     OR filename IN (e.family_key || '.jpg', e.family_key || '.jpeg')
  LIMIT 2
) AS m ON true
LEFT JOIN public.media_locales AS l ON l._parent_id = m.id AND l._locale = $3
`

// Run on the same bounded read-only transaction as the roster SELECT.
export const exactFamilyMediaVisibilitySelect = `
SELECT current_database() AS database_name, session_user AS login_role,
       current_user AS effective_role,
       current_setting('transaction_read_only') AS read_only,
       current_setting('transaction_isolation') AS isolation,
       (
         SELECT count(*) = 3 AND bool_and(
           c.relkind = 'r' AND has_table_privilege(c.oid, 'SELECT')
           AND NOT row_security_active(c.oid)
         )
         FROM pg_catalog.pg_class AS c
         JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public' AND c.relname IN ('media', 'media_locales', 'media_rels')
       ) AS complete_visibility
`

export async function verifyFamilyMediaVisibility({ query, database, loginRole, effectiveRole }) {
  for (const identity of [database, loginRole, effectiveRole]) {
    assert(typeof identity === 'string' && identity.length > 0, 'BLOCK: bound Media reader identity required')
  }
  const { rows } = await query(exactFamilyMediaVisibilitySelect, [])
  assert.deepEqual(rows, [{
    database_name: database, login_role: loginRole, effective_role: effectiveRole,
    read_only: 'on', isolation: 'repeatable read', complete_visibility: true,
  }], 'BLOCK: Media reader identity, transaction or visibility unproven')
  return true
}

function projectObservation(rows, key, sourcePath) {
  if (rows.length === 1 && rows[0].id === null) return { state: 'ABSENT_CONFIRMED' }
  if (rows.length !== 1) return { state: 'CONFLICT' }
  const row = rows[0]
  if (!Number.isSafeInteger(row.id) || row.id <= 0 || row.family_key_matches !== true ||
      row.alias_matches !== true || row.has_owner !== false || row.public_storage !== false ||
      !isFamilyAssetKey(row.alt_text_sha)) return { state: 'CONFLICT' }
  return { state: 'FOUND', id: row.id, familyAssetKey: key, sourcePath, ownerId: null,
    publicStorage: false, type: row.type, mimeType: row.mime_type, bytes: row.bytes, altTextSha256: row.alt_text_sha }
}

// query must use the approved, bounded read-only transaction. verifyVisibility
// attests that all three relations are visible for these keys in that snapshot.
export async function observeFamilyMedia({ entries, slug, locale, query, verifyVisibility, guard }) {
  assert(Array.isArray(entries) && entries.length > 0, 'BLOCK: no Media observation roster')
  assert(typeof slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
  assert(['zh-TW', 'en'].includes(locale))
  assert(typeof verifyVisibility === 'function', 'BLOCK: Media visibility verifier required')
  const keys = new Set()
  const aliases = new Set()
  const roster = entries.map(({ assetId, sourcePath }) => {
    assert(typeof assetId === 'string' && assetId.startsWith('sha256:'))
    const key = assetId.slice(7)
    assert(isFamilyAssetKey(key) && !keys.has(key), 'BLOCK: invalid or duplicate Media key')
    if (sourcePath != null) {
      assert(typeof sourcePath === 'string' && sourcePath.startsWith(`travels/${slug}/`) &&
        !sourcePath.includes('\\') && sourcePath.split('/').every(part => part && !['.', '..'].includes(part)),
      'BLOCK: Media alias outside approved slug')
      assert(!aliases.has(sourcePath), 'BLOCK: duplicate Media alias')
      aliases.add(sourcePath)
    }
    keys.add(key)
    return { assetId, key, sourcePath: sourcePath ?? null }
  })

  guard()
  assert.equal(await verifyVisibility(), true, 'BLOCK: Media visibility unproven')
  const observations = []
  for (let start = 0; start < roster.length; start += batchSize) {
    const batch = roster.slice(start, start + batchSize)
    const group = new Map(batch.map(({ key }) => [key, []]))
    guard()
    const { rows } = await query(exactFamilyMediaSelect, [batch.map(row => row.key), batch.map(row => row.sourcePath), locale])
    assert(Array.isArray(rows) && rows.length <= batch.length * 2, 'BLOCK: Media result exceeds exact scope')
    for (const row of rows) {
      const candidates = group.get(row.requested_key)
      assert(candidates && candidates.length < 2, 'BLOCK: unexpected or duplicate Media result')
      candidates.push(row)
    }
    for (const { assetId, key, sourcePath } of batch) {
      const candidates = group.get(key)
      assert(candidates.length > 0 && (candidates.length === 1 || candidates.every(row => row.id !== null)),
        'BLOCK: ambiguous or missing Media coverage')
      observations.push({ assetId, media: projectObservation(candidates, key, sourcePath) })
    }
  }
  return observations
}

// Use the existing PostgreSQL wire observer and a caller-bound transport.
// Credential, TLS peer and exact Human authorization belong to the launcher.
export async function readFamilyMediaSnapshot({ Client, client, raw, binding, prepared, registry, reader,
  authorize, verifyPeer, signal }) {
  const { scope } = binding
  const responseByteCap = 256 * 1024
  const deadline = performance.now() + 45000
  const remaining = () => Math.floor(deadline - performance.now())
  const counters = { queries: 0, roundTrips: 0, responseBytes: 0 }
  let warning = false, disconnected = false, started = false, closed = false
  let rollback = 'NOT_STARTED', failure, observations
  const guard = () => {
    authorize()
    assert(!warning && !disconnected && !signal?.aborted, 'BLOCK: Media session interrupted')
    assert(remaining() > 5000, 'BLOCK: Media deadline')
  }
  const notice = () => { warning = true }
  const disconnect = () => { disconnected = true }
  client.on('notice', notice)
  client.on('error', disconnect)
  const observer = createIssue134PostgresIo({ Client, counters, getStage: () => 'family-media-read', guard,
    limits: { queryBudget: 15, roundTripBudget: 15, rowCap: 200, responseByteCap },
    recoveryReserve: { queries: 1, roundTrips: 1 },
    recoveryGuard: () => assert(!disconnected && remaining() > 0, 'BLOCK: Media rollback unavailable'),
  })
  let watchdog
  const expired = new Promise((_, reject) => {
    watchdog = setTimeout(() => {
      disconnected = true
      raw?.destroy()
      reject(new Error('BLOCK: Media deadline'))
    }, 45000)
  })
  const withinDeadline = operation => Promise.race([operation, expired])
  const run = async (text, values = []) => {
    guard()
    const response = await withinDeadline(client.query({ text, values, query_timeout: Math.min(5000, remaining() - 5000) }))
    assert.deepEqual(observer.clientState(client), { status: 'T', pending: 0 }, 'BLOCK: Media transaction state')
    return response
  }
  try {
    guard()
    assert(scope.environment === 'production' && scope.target.database === reader.database &&
      prepared.slug === scope.slug && prepared.entries.length <= 842 &&
      sha256(prepared) === binding.preparedSha256 && sha256(registry) === binding.registrySha256,
      'BLOCK: Media snapshot scope')
    const assets = new Map(validateMediaRegistry(registry, scope.slug).assets.map(asset => [asset.assetId, asset]))
    const entries = prepared.entries.map(({ assetId }) => {
      assert(assets.has(assetId), 'BLOCK: Media roster identity missing')
      return { assetId, sourcePath: assets.get(assetId).sourcePath }
    })
    assert(raw?.cap === responseByteCap && raw === client.connection.stream, 'BLOCK: Media hard wire cap missing')
    started = true
    await withinDeadline(client.connect())
    assert.equal(await withinDeadline(verifyPeer(client, scope.target)), true, 'BLOCK: Media peer unverified')
    await run('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
    await run("SET LOCAL statement_timeout = '5s'")
    await run("SET LOCAL lock_timeout = '1s'")
    await run('SET LOCAL search_path = pg_catalog')
    observations = await observeFamilyMedia({ entries, slug: scope.slug, locale: scope.locale, query: run, guard,
      verifyVisibility: () => verifyFamilyMediaVisibility({ ...reader, query: run }) })
  } catch (error) {
    failure = error
  } finally {
    const begin = observer.snapshotFor(client).transactionControls.begin
    const { status, pending } = observer.clientState(client)
    if (begin.attempted) {
      rollback = 'UNKNOWN'
      if (begin.confirmed && !pending && ['T', 'E'].includes(status) && !disconnected && remaining() > 0) {
        try {
          const result = await withinDeadline(client.query({ text: 'ROLLBACK', query_timeout: Math.min(5000, remaining()) }))
          if (result.command === 'ROLLBACK' && observer.snapshotFor(client).transactionControls.rollback.confirmed === 1 &&
              observer.clientState(client).status === 'I' && !observer.clientState(client).pending) rollback = 'CONFIRMED'
        } catch { /* one attempt on the original connection */ }
      }
    }
    try { if (started) await withinDeadline(client.end()); closed = true }
    catch { /* unconfirmed close prevents snapshot use */ }
    finally { clearTimeout(watchdog); observer.restore(); raw?.destroy() }
  }
  if (!closed || rollback === 'UNKNOWN') return { status: 'UNKNOWN', rollback, counters }
  if (failure || warning || disconnected || signal?.aborted || !observations || rollback !== 'CONFIRMED') {
    return { status: 'BLOCK', rollback, counters }
  }
  return { status: 'PASS', rollback, counters, binding, entries: observations }
}
