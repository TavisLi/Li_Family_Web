import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { isDeepStrictEqual } from 'node:util'
import { familyPhotoObjectKey, familyPhotoVariants, isFamilyAssetKey } from '../payload/family-media.ts'
import { validateMediaRegistry } from './travel-memory-media-registry.ts'
import { sha256 } from './travel-memory-review.mjs'

function indexExact(rows, keys, field) {
  assert(Array.isArray(rows), 'BLOCK: missing observation list')
  const indexed = new Map()
  for (const row of rows) {
    const key = row[field]
    assert(keys.has(key) && !indexed.has(key), 'BLOCK: unexpected or duplicate identity')
    indexed.set(key, row)
  }
  return indexed
}

function classifyMedia(media, expected) {
  if (media?.state === 'ABSENT_CONFIRMED') return expected.locators.length ? 'CONFLICT' : 'ABSENT'
  if (media?.state === 'CONFLICT') return 'CONFLICT'
  if (media?.state !== 'FOUND') return 'UNKNOWN'
  const matches = Number.isSafeInteger(media.id) && media.id > 0 &&
    media.familyAssetKey === expected.familyAssetKey && media.type === 'photo' &&
    media.mimeType === 'image/jpeg' && media.bytes === expected.bytes &&
    media.altTextSha256 === expected.altTextSha256 && media.sourcePath === expected.sourcePath &&
    media.ownerId === null && media.publicStorage === false &&
    expected.locators.every(locator => locator.verified && locator.payloadId === media.id)
  return matches ? 'MATCH' : 'CONFLICT'
}

function classifyObject(observation, expected) {
  if (observation?.state === 'ABSENT_CONFIRMED') return 'ABSENT'
  if (observation?.state === 'CONFLICT') return 'CONFLICT'
  if (observation?.state !== 'FOUND') return 'UNKNOWN'
  if (observation.sha256 == null) return 'UNKNOWN'
  return observation.sha256 === expected.sha256 && observation.bytes === expected.bytes &&
    observation.mimeType === expected.mimeType ? 'MATCH' : 'CONFLICT'
}

// The inputs are evidence from an independently approved reader. This planner
// does not authenticate the source, infer negative observations, or grant writes.
export function reconcileFamilyPhotos({ prepared, registry, scope, observations }) {
  const { environment, slug, locale, bucket, accountId, target } = scope
  assert.equal(environment, 'production')
  assert.equal(slug, prepared.slug)
  assert(['zh-TW', 'en'].includes(locale))
  assert(typeof bucket === 'string' && /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket))
  assert(typeof accountId === 'string' && /^[a-f0-9]{32}$/.test(accountId))
  assert(typeof target?.projectRef === 'string' && /^[a-z0-9]{20}$/.test(target.projectRef))
  assert.equal(target.database, 'postgres')
  assert.equal(target.schema, 'public')
  if (observations) assert.deepEqual(observations.scope, scope, 'BLOCK: observation scope drift')

  const assets = new Map(validateMediaRegistry(registry, slug).assets.map(asset => [asset.assetId, asset]))
  assert(prepared.entries.length > 0 && prepared.entries.length === prepared.assets)
  const entries = indexExact(prepared.entries, assets, 'assetId')
  const observed = indexExact(observations?.entries ?? [], entries, 'assetId')
  const mediaIds = new Set()
  const rows = []
  let objectCount = 0
  let totalBytes = 0
  let originalBytes = 0
  for (const [assetId, entry] of entries) {
    const asset = assets.get(assetId)
    const familyAssetKey = assetId.slice(7)
    assert(isFamilyAssetKey(entry.altTextSha256))
    assert.deepEqual(entry.objects.map(object => object.variant), familyPhotoVariants)
    const actual = observed.get(assetId)
    const media = classifyMedia(actual?.media, {
      familyAssetKey, bytes: asset.byteSize, altTextSha256: entry.altTextSha256,
      sourcePath: asset.sourcePath ?? null, locators: asset.locators.filter(locator => locator.environment === environment),
    })
    if (media === 'MATCH') {
      assert(!mediaIds.has(actual.media.id), 'BLOCK: Media identity shared between assets')
      mediaIds.add(actual.media.id)
    }

    const seen = indexExact(actual?.objects ?? [], new Set(entry.objects.map(object => object.key)), 'key')
    const objects = entry.objects.map(object => {
      assert.equal(object.key, familyPhotoObjectKey(familyAssetKey, object.variant))
      assert(object.mimeType === 'image/jpeg' && isFamilyAssetKey(object.sha256))
      assert(Number.isSafeInteger(object.bytes) && object.bytes > 0 && object.bytes <= 32 * 1024 * 1024)
      if (object.variant === 'original') {
        assert(asset.mimeType === object.mimeType && asset.byteSize === object.bytes && object.sha256 === familyAssetKey)
        originalBytes += object.bytes
      }
      objectCount++
      totalBytes += object.bytes
      return { ...object, state: classifyObject(seen.get(object.key), object) }
    })
    const states = objects.map(object => object.state)
    let decision
    if (media === 'CONFLICT' || states.includes('CONFLICT')) decision = 'BLOCK_CONFLICT'
    else if (media === 'UNKNOWN' || states.includes('UNKNOWN')) decision = 'UNKNOWN'
    else if (media === 'MATCH' && states.every(state => state === 'MATCH')) decision = 'REUSE_MEDIA'
    else if (media === 'ABSENT' && states.every(state => state === 'ABSENT')) decision = 'REVIEW_CREATE'
    else decision = 'REVIEW_RECOVERY'

    rows.push({ assetId, familyAssetKey, media, mediaId: media === 'MATCH' ? actual.media.id : null, decision, objects })
  }
  assert.equal(objectCount, prepared.objectCount)
  assert.equal(originalBytes, prepared.originalBytes)
  assert.equal(totalBytes - originalBytes, prepared.derivativeBytes)
  const counts = { BLOCK_CONFLICT: 0, UNKNOWN: 0, REUSE_MEDIA: 0, REVIEW_CREATE: 0, REVIEW_RECOVERY: 0 }
  for (const row of rows) counts[row.decision]++
  return { status: counts.UNKNOWN || counts.BLOCK_CONFLICT ? 'BLOCK' : 'READY_FOR_REVIEW',
    scope, assets: rows.length, objectCount, totalBytes, counts, rows }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const [inputFile, inputSha, outputFile] = process.argv.slice(2)
  assert(process.argv.length === 5, 'Usage: node --import tsx travel-memory-family-photo-reconcile.mjs <input.json> <input-sha256> <new-output.json>')
  const inputBytes = await readFile(inputFile)
  assert.equal(sha256(inputBytes), inputSha, 'BLOCK: reconciliation input SHA mismatch')
  const output = { ...reconcileFamilyPhotos(JSON.parse(inputBytes)), inputSha256: inputSha }
  const bytes = JSON.stringify(output, null, 2) + '\n'
  await writeFile(outputFile, bytes, { flag: 'wx', mode: 0o600 })
  const { status, assets, objectCount, totalBytes, counts } = output
  console.log(JSON.stringify({ status, assets, objectCount, totalBytes, counts, outputSha256: sha256(bytes) }))
  if (status === 'BLOCK') process.exitCode = 1
}
