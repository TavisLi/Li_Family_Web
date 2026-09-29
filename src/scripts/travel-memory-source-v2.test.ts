import assert from 'node:assert/strict'
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { Payload } from 'payload'
import { parseMemorySourceV2, projectMemoryV2 } from './travel-memory-source-v2'
import { planMemoryV2, importMemoryV2, type V2Inventory } from './travel-memory-v2-import'
import { reconcileMemoryV2 } from './travel-memory-v2-reconciliation'
import { renderMemoryV2Coverage } from './travel-memory-v2-coverage'
import { memoryV2Args } from './travel-memory-v2-args'
import { australiaV2Fixture } from './travel-memory-v2-australia-fixture'
import { parseTravelMarkdown } from './seed-content'
import { buildTravelMemoryProjection } from './travel-seed-projections'
import { validateMediaRegistry } from './travel-memory-media-registry'

assert.equal(memoryV2Args(['--travel-only']), undefined)
assert.deepEqual(memoryV2Args(['--travel-only', '--memory-v2', 'template.md']), { file: 'template.md', apply: false })
assert.deepEqual(memoryV2Args(['--memory-v2', 'template.md', '--apply-v2']), { file: 'template.md', apply: true })
for (const args of [
  ['--apply-v2'], ['--memory-v2'], ['--memory-v2', '--apply-v2'],
  ['--memory-v2', 'template.md', '--source-wins'],
  ['--memory-v2', 'template.md', '--blog-only'],
  ['--memory-v2', 'template.md', '--apply-v2', '--dry-run'],
]) assert.throws(() => memoryV2Args(args))

const template = await readFile('docs/templates/travel-memory-source-template.md', 'utf8')
const source = parseMemorySourceV2(template)
const australiaMarkdown = await readFile('src/scripts/fixtures/travel-memory-v2-australia.md', 'utf8')
assert.equal(australiaMarkdown, await australiaV2Fixture(), 'checked-in golden fixture matches tracked source and manifest')
const australia = parseMemorySourceV2(australiaMarkdown)
const australiaProjection = projectMemoryV2(australia, { member: () => { throw new Error('No invented member relationship') }, plan: () => { throw new Error('No invented plan relationship') }, media: () => 30 })
const legacyAustralia = buildTravelMemoryProjection(await parseTravelMarkdown('content-source/travels/202308東澳全覽9日.md'))
assert.equal(australiaProjection.days.length, 9)
assert.equal(australiaProjection.memory.travelLedger?.flights?.length, 4)
assert.equal(australiaProjection.memory.travelLedger?.lodgings?.length, 3)
assert.deepEqual(australiaProjection.memory.travelLedger, legacyAustralia.travelLedger)
assert.deepEqual(australiaProjection.memory.storySections, legacyAustralia.storySections)
assert.deepEqual(australiaProjection.memory.externalVideos, legacyAustralia.externalVideos)
assert.equal(australiaProjection.assets.length, 0, 'missing alt text must not be invented from captions')
const refs = { member: () => 10, plan: () => 20, media: () => 30 }
const projected = projectMemoryV2(source, refs)
assert.equal(projected.memory.presentationStyle, 'cinematic-timeline')
assert.deepEqual(projected.memory.participants, [10])
assert.equal(projected.memory.originPlan, 20)
assert.equal(projected.memory.travelLedger?.flights?.[0]?.terminal, 'T2')
assert.equal(projected.memory.travelLedger?.lodgings?.[0]?.notes, '合成資料')
assert.equal(projected.memory.storySections?.[0]?.interactions?.thumbsDownEnabled, false)
assert.equal(projected.days[0]?.dailyHeroImage, 30)
assert.equal(projected.days[0]?.moments?.[0]?.placements?.[0]?.role, 'hero')
assert.notEqual(projected.assets[0]?.altText, projected.days[0]?.moments?.[0]?.placements?.[0]?.caption)
const adoptionSource = parseMemorySourceV2(template
  .replace('scene: 海邊第一次散步', 'scene: 海邊第一次散步\n    momentKey: moment:existing')
  .replace('type: photo\n        role: hero', 'type: photo\n        placementKey: placement:existing\n        role: hero')
  .replace('caption: 我們一起記住的黃昏', 'caption: "我們一起記住的黃昏 "'))
const adoptionProjection = projectMemoryV2(adoptionSource, refs)
assert.equal(adoptionProjection.days[0]?.moments?.[0]?.momentKey, 'moment:existing')
assert.equal(adoptionProjection.days[0]?.moments?.[0]?.placements?.[0]?.placementKey, 'placement:existing')
assert.equal(adoptionProjection.days[0]?.moments?.[0]?.placements?.[0]?.caption, '我們一起記住的黃昏 ')
const revised = structuredClone(source)
revised.days![0]!.moments![0]!.title = '修改顯示標題'
revised.days!.reverse()
assert.equal(projectMemoryV2(revised, refs).days[1]?.moments?.[0]?.momentKey, projected.days[0]?.moments?.[0]?.momentKey)
const reminderRevision = structuredClone(source)
reminderRevision.reminders![0]!.items![0]!.text = '更新隨身準備內容'
const reminderProjection = projectMemoryV2(reminderRevision, refs)
assert.equal(reminderProjection.memory.reminders?.[0]?.items?.[0]?.id, projected.memory.reminders?.[0]?.items?.[0]?.id)
assert.equal(reconcileMemoryV2(reminderProjection.memory, projected.memory, projected.memory).action, 'update')
assert.ok(!JSON.stringify(reminderProjection).includes('"entry"'), 'human entry names must not leak into Payload fields')
assert.equal(await readFile('docs/travel-memory-source-v2-coverage.md', 'utf8'), renderMemoryV2Coverage())
for (const invalid of [
  template.replace('sourceVersion: 2', 'sourceVersion: 3'),
  template.replace('isPrivate: true', 'isPrivate: maybe'),
  template.replace('focalX: 50', 'foclaX: 50'),
  template.replace('2026-04-01', '2026-02-30'),
  template.replace('role: hero', 'role: poster'),
  template.replace('scene: 海邊第一次散步', 'momentKey: forbidden'),
  template.replace('type: photo\n        role: hero', 'type: youtube\n        role: hero'),
  template.replace('https://youtu.be/aqz-KE-bpKQ', 'not-a-url'),
  template + '\nThis prose must not silently disappear.\n',
  template.replace('| name | note |', '| name | unknown |'),
]) assert.throws(() => parseMemorySourceV2(invalid))

const baseline = { presentationStyle: 'cinematic-timeline', summary: 'source', travelLedger: { lodgings: [{ hotel: 'Hotel', startDate: '2026-04-01', notes: 'Keep me' }] } }
const admin = { ...baseline, presentationStyle: 'family-scrapbook', adminOnly: 'keep' }
assert.equal(reconcileMemoryV2(baseline, baseline, admin).data.presentationStyle, 'family-scrapbook')
assert.equal(reconcileMemoryV2({ ...baseline, presentationStyle: 'editorial-journal' }, baseline, admin).action, 'conflict')
const partial = reconcileMemoryV2({ summary: 'new', travelLedger: { lodgings: [{ hotel: 'Hotel', startDate: '2026-04-01', city: 'New city' }] } }, baseline, admin)
assert.equal(partial.action, 'update')
assert.equal(partial.data.presentationStyle, 'family-scrapbook')
assert.equal((partial.data.travelLedger as typeof baseline.travelLedger).lodgings[0]?.notes, 'Keep me')
assert.equal(partial.data.adminOnly, 'keep')
assert.deepEqual(reconcileMemoryV2({ galleryImages: [] }, { galleryImages: [1] }, { galleryImages: [1, 2] }).data.galleryImages, [1, 2])
assert.equal(reconcileMemoryV2({ summary: 'new' }, undefined, { summary: 'Admin' }).action, 'preserve-current')
assert.equal(reconcileMemoryV2({ galleryImages: [1, 2] }, { galleryImages: [1] }, { galleryImages: null }).action, 'conflict', 'Source must not restore an Admin-deleted array')
assert.equal(reconcileMemoryV2({ galleryImages: [1] }, { galleryImages: [1] }, { galleryImages: null }).data.galleryImages, null, 'unchanged Source preserves Admin deletion')

const inventory: V2Inventory = { days: [], media: [], members: [{ id: 10, slug: 'tavis' }], plans: [{ id: 20, slug: 'clean-room-coast-plan' }] }
const plan = planMemoryV2(source, inventory)
assert.equal(plan.parent.action, 'create')
assert.equal(plan.days.length, 2)
assert.equal(plan.assets.length, 1)
assert.equal(plan.conflicts.length, 0)
const duplicateHash = `sha256:${'a'.repeat(64)}`
const duplicateSource = parseMemorySourceV2(template.replaceAll('travels/202604-clean-room-coast/photos/coast.png', duplicateHash)
  .replace(`sourcePath: ${duplicateHash}\ntype: photo`, `assetId: ${duplicateHash}\ntype: photo`))
const duplicateRegistry = validateMediaRegistry({ version: 1, travelSlug: source.slug, assets: [{
  assetId: duplicateHash, files: [], filename: 'coast.png', mimeType: 'image/png', width: 1, height: 1,
  byteSize: 1, provenance: 'production-upload', byteProvenance: 'synthetic fixture', locators: [
    { environment: 'production', payloadId: 30, verified: true, verifiedByteHash: duplicateHash },
    { environment: 'production', payloadId: 31, verified: true, verifiedByteHash: duplicateHash },
  ],
}] }, source.slug)
assert.match(planMemoryV2(duplicateSource, { ...inventory, media: [{ id: 30 }, { id: 31 }] }, duplicateRegistry, 'production').conflicts.join(';'), /exact verified Current relationship required/)
const duplicateAdoption = { ...duplicateSource, days: [], storySections: [], assets: [], coverImage: duplicateHash, galleryImages: [duplicateHash, duplicateHash] }
const duplicatePlan = planMemoryV2(duplicateAdoption, {
  ...inventory, memory: { id: 2, coverImage: 30, galleryImages: [30, 31] }, media: [{ id: 30 }, { id: 31 }],
}, duplicateRegistry, 'production')
assert.deepEqual(duplicatePlan.parent.data.galleryImages, [30, 31], 'same bytes retain distinct Current Media IDs')
assert.equal(duplicatePlan.parent.data.coverImage, 30)
assert.deepEqual(duplicatePlan.conflicts, [])
const incompleteDuplicateRegistry = validateMediaRegistry({ ...duplicateRegistry, assets: [{
  ...duplicateRegistry.assets[0]!, locators: duplicateRegistry.assets[0]!.locators.slice(0, 1),
}] }, source.slug)
assert.match(planMemoryV2(duplicateAdoption, {
  ...inventory, memory: { id: 2, coverImage: 30, galleryImages: [30, 31] }, media: [{ id: 30 }, { id: 31 }],
}, incompleteDuplicateRegistry, 'production').conflicts.join(';'), /does not match exact Current relationship/)
const duplicateBase = projectMemoryV2(duplicateAdoption, {
  member: () => 10, plan: () => 20, media: (_reference, context) => context === 'gallery|1' ? 31 : 30,
}).memory
const duplicateWithBase = planMemoryV2(duplicateAdoption, {
  ...inventory, memory: { ...duplicateBase, id: 2, sourceMetadata: {
    baseProjection: { contract: 'memory-source-v2', locales: { 'zh-TW': { memory: duplicateBase, days: {}, assets: {} } } },
  } }, media: [{ id: 30 }, { id: 31 }],
}, duplicateRegistry, 'production')
assert.equal(duplicateWithBase.parent.action, 'preserve-current', 'exact gallery IDs must survive projection')
assert.deepEqual(duplicateWithBase.parent.data.galleryImages, [30, 31])
const duplicatePlacementSource = { ...duplicateAdoption, days: [{ day: 1, title: 'Existing day', moments: [{
  scene: 'existing-scene', momentKey: 'moment:existing', title: 'Existing moment', placements: [{
    type: 'photo' as const, placementKey: 'placement:existing', media: duplicateHash,
  }],
}] }] }
const duplicatePlacementPlan = planMemoryV2(duplicatePlacementSource, {
  ...inventory, memory: { id: 2, coverImage: 30, galleryImages: [30, 31] }, media: [{ id: 30 }, { id: 31 }],
  days: [{ id: 3, dayKey: 'day-01', moments: [{ momentKey: 'moment:existing', placements: [
    { placementKey: 'placement:existing', type: 'photo', media: 31 },
  ] }] }],
}, duplicateRegistry, 'production')
assert.ok(duplicatePlacementPlan.conflicts.every(item => item.includes('reviewed Current mapping')),
  'verified duplicate placement must resolve to its exact Current Media ID')
const duplicateDayBase = projectMemoryV2(duplicatePlacementSource, {
  member: () => 10, plan: () => 20,
  media: (_reference, context) => context === 'gallery|1' || context?.startsWith('placement|') ? 31 : 30,
}).days[0]!
const duplicatePlacementWithBase = planMemoryV2(duplicatePlacementSource, {
  ...inventory, memory: { ...duplicateBase, id: 2, sourceMetadata: {
    baseProjection: { contract: 'memory-source-v2', locales: { 'zh-TW': {
      memory: duplicateBase, days: { 'day-01': duplicateDayBase }, assets: {},
    } } },
  } }, media: [{ id: 30 }, { id: 31 }], days: [{ ...duplicateDayBase, id: 3 }],
}, duplicateRegistry, 'production')
assert.equal(duplicatePlacementWithBase.days[0]?.action, 'preserve-current')
assert.equal((duplicatePlacementWithBase.days[0]?.data.moments as { placements: { media: number }[] }[] | undefined)?.[0]?.placements[0]?.media, 31)
const unresolvedMarkdown = template.replace('type: photo\n        role: hero',
  'type: photo\n        placementKey: placement:existing-null\n        legacyUnresolvedMedia: true\n        role: hero')
  .replace('media: travels/202604-clean-room-coast/photos/coast.png\n        caption:', 'caption:')
const unresolvedSource = parseMemorySourceV2(unresolvedMarkdown)
const unresolvedPlacement = projectMemoryV2(unresolvedSource, refs).days[0]?.moments?.[0]?.placements?.[0]
assert.equal(unresolvedPlacement?.placementKey, 'placement:existing-null')
assert.equal(unresolvedPlacement?.media, undefined, 'legacy null photo must not gain a fake Media identity')
assert.throws(() => parseMemorySourceV2(unresolvedMarkdown.replace('placementKey: placement:existing-null\n', '')))
assert.throws(() => planMemoryV2(source, { ...inventory, members: [] }), /member tavis/)
assert.throws(() => planMemoryV2(source, { ...inventory, members: [...inventory.members, ...inventory.members] }), /expected one/)
assert.equal(planMemoryV2(source, { ...inventory, memory: { id: 1, ...projected.memory } }).missingBase, true)

// Exercise the actual importer against an in-memory Payload boundary with a
// temporary synthetic PNG. No config, environment or remote service is loaded.
const root = await mkdtemp(path.join(tmpdir(), 'memory-v2-'))
try {
  const filename = path.join(root, source.assets![0]!.sourcePath!)
  await mkdir(path.dirname(filename), { recursive: true })
  await writeFile(filename, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64'))
  const db: Record<string, Record<string, unknown>[]> = {
    users: inventory.members, 'travel-plans': inventory.plans, 'travel-memories': [], 'travel-memory-days': [], media: [],
  }
  let nextId = 100
  let writes = 0
  const store = {
    find: async ({ collection, where }: { collection: string; where: Record<string, { equals: unknown }> }) => ({
      docs: db[collection]!.filter(item => Object.entries(where).every(([key, condition]) => item[key] === condition.equals)), hasNextPage: false,
    }),
    create: async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
      writes++
      const row = { ...data, id: nextId++ }
      db[collection]!.push(row)
      return row
    },
    update: async ({ collection, id, data }: { collection: string; id: number; data: Record<string, unknown> }) => {
      writes++
      const item = db[collection]!.find(row => row.id === id)!
      Object.assign(item, data)
      return item
    },
  } as unknown as Payload
  const options = { apply: false, assetRoot: root, sourceFile: 'template.md' }
  await importMemoryV2(store, source, options)
  assert.equal(writes, 0, 'dry-run must not write')
  await importMemoryV2(store, source, { ...options, apply: true })
  assert.equal(db['travel-memories']![0]!._status, 'draft')
  assert.equal(db['travel-memory-days']!.length, 2)
  const firstMemory = db['travel-memories']![0]!
  firstMemory.presentationStyle = 'family-scrapbook'
  const repeat = await importMemoryV2(store, source, options)
  assert.equal(repeat.parent.data.presentationStyle, 'family-scrapbook')
  assert.deepEqual(repeat.conflicts, [])
  assert.equal(repeat.parent.action, 'preserve-current')
  const translation = { ...source, locale: 'en' as const }
  const translationPlan = await importMemoryV2(store, translation, options)
  assert.equal(translationPlan.missingBase, true, 'another locale must not supply an ownership baseline')
  const beforeBlockedTranslation = writes
  await assert.rejects(() => importMemoryV2(store, translation, { ...options, apply: true }), /missing v2 baseline/)
  assert.equal(writes, beforeBlockedTranslation, 'missing locale Base must block before writes')
  const changed = structuredClone(source)
  changed.summary = '新的旅程摘要'
  await importMemoryV2(store, changed, { ...options, apply: true })
  assert.equal(firstMemory.summary, '新的旅程摘要')
  assert.equal(firstMemory.presentationStyle, 'family-scrapbook')
  assert.equal(db.users!.length, 1, 'no user mutation')
} finally {
  await rm(root, { recursive: true, force: true })
}
console.log('Travel Memory Source v2: parser, projection, coverage, reconciliation and local import PASS')
