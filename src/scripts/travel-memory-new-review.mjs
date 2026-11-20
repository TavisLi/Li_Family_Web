import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseMemorySourceV2 } from './travel-memory-source-v2.ts'
import { importMemoryV2, memorySlugVersionCount, planMemoryV2, readMemoryV2Inventory, sourceMediaReferences } from './travel-memory-v2-import.ts'
import { resolveRegistryEntry, resolveRegistryMediaId, validateMediaRegistry } from './travel-memory-media-registry.ts'

const digest = bytes => createHash('sha256').update(bytes).digest('hex')

function matches(wanted, actual) {
  if (Array.isArray(wanted)) {
    assert.ok(Array.isArray(actual) && actual.length === wanted.length)
    wanted.forEach((item, i) => matches(item, actual[i]))
  } else if (wanted && typeof wanted === 'object') {
    assert.ok(actual && typeof actual === 'object')
    for (const [key, value] of Object.entries(wanted)) matches(value, actual[key])
  } else assert.deepEqual(actual, wanted)
}

// The caller supplies an authorized target-scoped reader and records its effective visibility.
export async function readNewMemorySnapshot(payload, source, registry, environment, req) {
  const inventory = await readMemoryV2Inventory(payload, source, registry, environment, req)
  return { slug: source.slug, locale: source.locale, environment, ownerCount: inventory.memory ? 1 : 0,
    versionCount: await memorySlugVersionCount(payload, source.slug, req), inventory }
}

// An inventory is a scoped snapshot supplied by the authorized reader.
// This offline tool neither authenticates its origin nor authorizes execution.
export function previewNewMemory({ sourceBytes, registryBytes, inventoryBytes, slug, environment }) {
  const source = parseMemorySourceV2(sourceBytes.toString('utf8'))
  assert.equal(source.slug, slug)
  const registry = validateMediaRegistry(JSON.parse(registryBytes), slug)
  const snapshot = JSON.parse(inventoryBytes)
  assert.ok(environment && snapshot.environment === environment && snapshot.slug === slug && snapshot.locale === source.locale)
  assert.equal(snapshot.ownerCount, 0, 'new Memory requires a verified zero-owner observation')
  assert.equal(snapshot.versionCount, 0, 'existing version footprint requires review')
  const inventory = snapshot.inventory
  assert.ok(inventory && !inventory.memory && Array.isArray(inventory.days) && !inventory.days.length)
  for (const key of ['media','members','plans']) assert.ok(Array.isArray(inventory[key]))
  assert.ok(inventory.allLocales && !inventory.allLocales.memory && Array.isArray(inventory.allLocales.days) &&
    inventory.allLocales.days.length === 0 && Array.isArray(inventory.allLocales.media),
    'BLOCK: all-locale inventory is missing or has an existing owner')
  assert.deepEqual(inventory.allLocales.media.map(row => row.id).sort(), inventory.media.map(row => row.id).sort())
  assert.ok(!inventory.media.some(m => m.relatedTravelRecord), 'new Memory cannot adopt another owner’s Media')
  for (const reference of sourceMediaReferences(source)) {
    const asset = resolveRegistryEntry(registry, reference)
    assert.ok(asset, 'BLOCK: missing original identity')
    const id = resolveRegistryMediaId(registry, asset.assetId, environment)
    const matches = inventory.media.filter(item => item.id === id &&
      (reference === asset.assetId || item.sourcePath === reference))
    assert.ok(id && matches.length === 1, 'BLOCK: Media requires one verified locator in this environment')
    const [current] = matches
    const allLocales = inventory.allLocales.media.find(item => item.id === id)
    assert.equal(current.type, allLocales?.type, 'BLOCK: Media type differs across inventory views')
    assert.equal(current.familyAssetKey, allLocales.familyAssetKey, 'BLOCK: Media visibility differs across inventory views')
    assert.ok(current.type === 'photo' || current.type === 'video', 'BLOCK: unknown Media type')
    if (source.isPrivate && current.type === 'photo') {
      assert.equal(current.familyAssetKey, asset.assetId.slice('sha256:'.length),
        'BLOCK: family-only photo requires the verified private asset key')
    } else {
      assert.ok(current.familyAssetKey == null, 'BLOCK: Media visibility does not match the Source')
    }
  }
  const plan = planMemoryV2(source, inventory, registry, environment)
  // A shared Media can be reused. Authored changes to its metadata need their own approved operation.
  for (const { assetId, relatedMembers, ...fields } of source.assets ?? []) {
    const entry = resolveRegistryEntry(registry, assetId ?? fields.sourcePath)
    const id = resolveRegistryMediaId(registry, entry.assetId, environment)
    const current = inventory.media.find(item => item.id === id)
    matches(fields, current)
    if (relatedMembers) matches(relatedMembers.map(slug => inventory.members.find(item => item.slug === slug).id), current.relatedMembers)
  }
  const photos = (source.days ?? []).flatMap(day => (day.moments ?? []).flatMap(moment =>
    (moment.placements ?? []).filter(p => p.type === 'photo').map(p => {
      const asset = resolveRegistryEntry(registry, p.media)
      assert.ok(asset, 'placement has no original in the registry')
      return { day: day.day, scene: moment.scene, assetId: asset.assetId, caption: p.caption,
        cameraLocation: asset.gps ? 'GPS_REQUIRES_CRS_REVIEW' : 'NO_GPS',
        sceneLocation: moment.location ?? null, geoAdopted: false }
    })))
  const blocked = plan.conflicts.length || plan.missingBase || plan.parent.action !== 'create' ||
    plan.days.some(d => d.action !== 'create') || plan.assets.some(a => a.action !== 'preserve-current') ||
    Object.keys(plan.placeholderIds).length
  return { status: blocked ? 'BLOCK' : 'PREVIEW', authorized: false, slug, environment, locale: source.locale,
    sourceSha256: digest(sourceBytes), registrySha256: digest(registryBytes), inventorySha256: digest(inventoryBytes),
    plan, photos, preservedMedia: inventory.allLocales.media }
}

// Called inside an approved #105 content operation. This module has no live CLI entry.
export async function applyReviewedNewMemory(payload, input, approvedPreview, sourceFile) {
  const preview = previewNewMemory(input)
  assert.equal(preview.status, 'PREVIEW')
  assert.deepEqual(JSON.parse(JSON.stringify(preview)), approvedPreview, 'BLOCK: approved preview drift')
  const source = parseMemorySourceV2(input.sourceBytes.toString('utf8'))
  const registry = validateMediaRegistry(JSON.parse(input.registryBytes), source.slug)
  return importMemoryV2(payload, source, { apply: true, assetRoot: '', sourceFile, registry,
    environment: input.environment, reviewedNew: { plan: approvedPreview.plan, inventory: JSON.parse(input.inventoryBytes).inventory } })
}

export function verifyNewMemory(preview, snapshot, expectedMemoryId) {
  for (const key of ['slug', 'environment', 'locale']) assert.equal(snapshot[key], preview[key])
  assert.equal(snapshot.ownerCount, 1)
  assert.ok(Number.isSafeInteger(snapshot.versionCount) && snapshot.versionCount > 0)
  const inventory = snapshot.inventory
  assert.deepEqual(inventory.allLocales?.media, preview.preservedMedia)
  assert.equal(preview.status, 'PREVIEW')
  assert.ok(Number.isSafeInteger(expectedMemoryId) && expectedMemoryId > 0)
  assert.equal(inventory.memory?.id, expectedMemoryId)
  assert.equal(inventory.memory.slug, preview.slug)
  assert.equal(inventory.memory._status, 'draft')
  matches(preview.plan.parent.data, inventory.memory)
  matches(preview.plan.nextEnvelope, inventory.memory.sourceMetadata?.baseProjection)
  assert.equal(inventory.days.length, preview.plan.days.length)
  for (const day of preview.plan.days) {
    const saved = inventory.days.filter(item => item.dayKey === day.dayKey)
    assert.equal(saved.length, 1)
    assert.equal(saved[0].memory, expectedMemoryId)
    assert.equal(saved[0]._status, 'draft')
    matches(day.data, saved[0])
  }
  return { status: 'PASS', scope: 'target-draft-readback', slug: preview.slug, memoryId: expectedMemoryId, days: inventory.days.length }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const [mode, ...args] = process.argv.slice(2)
  if (mode === 'preview' && args.length === 6) {
    const [slug, environment, source, registry, snapshot, output] = args
    const [sourceBytes, registryBytes, inventoryBytes] = await Promise.all([source, registry, snapshot].map(p => readFile(p)))
    const result = previewNewMemory({ sourceBytes, registryBytes, inventoryBytes, slug, environment })
    await writeFile(output, JSON.stringify(result, null, 2), { flag: 'wx', mode: 0o600 })
    console.log(JSON.stringify({ status: result.status, days: result.plan.days.length, photos: result.photos.length }))
    if (result.status === 'BLOCK') process.exitCode = 1
  } else if (mode === 'verify' && args.length === 3) {
    const [preview, snapshot, id] = args
    const expected = JSON.parse(await readFile(preview))
    const observed = JSON.parse(await readFile(snapshot))
    console.log(JSON.stringify(verifyNewMemory(expected, observed, Number(id))))
  } else throw new Error('Usage: preview <slug> <env> <source.md> <registry.json> <snapshot.json> <new-output.json> | verify <accepted-preview.json> <independent-snapshot.json> <memory-id>')
}
