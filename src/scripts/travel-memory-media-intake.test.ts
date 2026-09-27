import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import type { Payload } from 'payload'
import { scanTravelMedia } from './travel-memory-media-intake'
import { resolveRegistryMediaId, validateMediaRegistry } from './travel-memory-media-registry'
import { parseMemorySourceV2, projectMemoryV2 } from './travel-memory-source-v2'
import { importMemoryV2, planMemoryV2, type V2Inventory } from './travel-memory-v2-import'

const root = await mkdtemp(path.join(tmpdir(), 'travel-media-intake-'))
try {
  const input = path.join(root, 'input')
  const output = path.join(root, 'stage')
  await mkdir(path.join(input, 'nested'), { recursive: true })
  const image = await sharp({ create: { width: 2, height: 3, channels: 3, background: '#ffffff' } }).png().toBuffer()
  await writeFile(path.join(input, 'one.png'), image)
  await writeFile(path.join(input, 'nested', 'same.png'), image)
  const scanned = await scanTravelMedia(input, '202604-clean-room-coast', output)
  const assetId = `sha256:${createHash('sha256').update(image).digest('hex')}`
  assert.equal(scanned.registry.assets[0]?.assetId, assetId)
  assert.equal(scanned.registry.assets[0]?.mimeType, 'image/png')
  assert.deepEqual(scanned.registry.assets[0]?.files, ['nested/same.png', 'one.png'])
  assert.equal(scanned.summary.exactDuplicates, 1)
  const before = await readFile(path.join(output, 'registry.json'), 'utf8')
  await scanTravelMedia(input, '202604-clean-room-coast', output)
  assert.equal(await readFile(path.join(output, 'registry.json'), 'utf8'), before, 'registry output is deterministic')

  const alias = 'travels/202604-clean-room-coast/photos/coast.png'
  const registry = validateMediaRegistry({ ...scanned.registry, assets: [{ ...scanned.registry.assets[0],
    sourcePath: alias, locators: [{ environment: 'local', payloadId: 30, verified: true, verifiedByteHash: assetId, sourcePath: alias }],
  }] }, '202604-clean-room-coast')
  assert.equal(resolveRegistryMediaId(registry, assetId, 'local'), 30)
  assert.throws(() => validateMediaRegistry({ ...registry, assets: [...registry.assets, ...registry.assets] }, registry.travelSlug), /Duplicate assetId/)

  const template = await readFile('docs/templates/travel-memory-source-template.md', 'utf8')
  const hashSource = parseMemorySourceV2(template.replaceAll(alias, assetId).replace(
    `sourcePath: ${assetId}\ntype: photo`, `assetId: ${assetId}\nsourcePath: ${alias}\ntype: photo`))
  assert.throws(() => parseMemorySourceV2(template.replace(alias, 'sha256:BAD')), /sha256|invalid/i)
  assert.equal(hashSource.assets?.[0]?.assetId, assetId)
  const hashOnly = structuredClone(hashSource)
  delete hashOnly.assets![0]!.sourcePath
  assert.equal(projectMemoryV2(hashOnly, { member: () => 10, plan: () => 20, media: () => 30 }).assets[0]?.sourcePath, undefined)
  const projected = projectMemoryV2(hashSource, { member: () => 10, plan: () => 20, media: () => 30 })
  assert.equal(projected.days[0]?.moments?.[0]?.placements?.[0]?.placementKey, assetId)
  assert.equal(projected.assets[0]?.sourcePath, alias)
  assert.equal('assetId' in projected.assets[0]!, false, 'Payload has no assetId schema field in Slice 2')
  const inventory: V2Inventory = { days: [], media: [{ id: 30, sourcePath: alias }],
    members: [{ id: 10, slug: 'tavis' }], plans: [{ id: 20, slug: 'clean-room-coast-plan' }] }
  assert.equal(planMemoryV2(hashSource, inventory, registry, 'local').conflicts.length, 0)
  const noAliasRegistry = validateMediaRegistry({ ...registry, assets: [{ ...registry.assets[0]!, sourcePath: undefined,
    locators: [{ environment: 'local', payloadId: 30, verified: true, verifiedByteHash: assetId }] }] }, registry.travelSlug)
  assert.equal(planMemoryV2(hashOnly, inventory, noAliasRegistry, 'local').conflicts.length, 0)
  assert.match(planMemoryV2(hashSource, inventory, registry).conflicts.join(';'), /environment required/)
  const unverified = { ...registry, assets: [{ ...registry.assets[0]!, locators: [] }] }
  assert.match(planMemoryV2(hashSource, inventory, unverified, 'local').conflicts.join(';'), /lacks verified byte-to-Media locator/)
  let writes = 0
  const db: Record<string, Record<string, unknown>[]> = {
    users: inventory.members, 'travel-plans': inventory.plans, 'travel-memories': [], 'travel-memory-days': [], media: inventory.media,
  }
  const payload = { find: async ({ collection, where }: { collection: string; where: Record<string, { equals: unknown }> }) => ({
    docs: db[collection]!.filter(item => Object.entries(where).every(([key, value]) => item[key] === value.equals)), hasNextPage: false,
  }), create: async () => { writes++; throw new Error('unexpected write') }, update: async () => { writes++; throw new Error('unexpected write') } } as unknown as Payload
  const dryRun = await importMemoryV2(payload, hashSource, { apply: false, assetRoot: '/absent', sourceFile: 'synthetic.md', registry, environment: 'local' })
  assert.equal(dryRun.conflicts.length, 0)
  const blocked = await importMemoryV2(payload, hashSource, { apply: false, assetRoot: '/absent', sourceFile: 'synthetic.md', registry: unverified, environment: 'local' })
  assert.match(blocked.conflicts.join(';'), /lacks verified byte-to-Media locator/)
  assert.equal(writes, 0, 'hash dry-runs remain read-only, including conflicts')
  const legacyProjection = projectMemoryV2(parseMemorySourceV2(template), { member: () => 10, plan: () => 20, media: () => 30 })
  const withBase: V2Inventory = { ...inventory,
    memory: { id: 1, sourceMetadata: { baseProjection: { contract: 'memory-source-v2', locales: { 'zh-TW': {
      memory: legacyProjection.memory, days: { 'day-01': legacyProjection.days[0] }, assets: { [alias]: legacyProjection.assets[0] },
    } } } } },
    days: [{ id: 2, ...legacyProjection.days[0]! }],
  }
  assert.match(planMemoryV2(hashSource, withBase, registry, 'local').conflicts.join(';'), /existing placementKey\/relationship needs reviewed mapping/)
  const current: V2Inventory = { ...inventory, memory: { id: 1 }, days: [{ id: 2, dayKey: 'day-01', moments: [{ momentKey: 'moment:existing', placements: [{ placementKey: 'placement:existing', media: 30 }] }] }] }
  const adoption = planMemoryV2(hashSource, current, registry, 'local')
  assert.equal(adoption.missingBase, true)
  assert.match(adoption.conflicts.join(';'), /reviewed Current mapping/)
} finally {
  await rm(root, { recursive: true, force: true })
}
console.log('Travel Memory media intake and hash resolver PASS')
