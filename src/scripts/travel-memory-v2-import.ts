import path from 'node:path'
import { realpath } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import type { Payload } from 'payload'
import { projectMemoryV2, type MemorySourceV2 } from './travel-memory-source-v2'
import { reconcileMemoryV2, type V2Record } from './travel-memory-v2-reconciliation'

export type V2Inventory = {
  memory?: V2Record & { id: number }
  days: (V2Record & { id: number; dayKey: string })[]
  media: (V2Record & { id: number; sourcePath: string })[]
  members: { id: number; slug: string }[]
  plans: { id: number; slug: string }[]
}
type Baseline = { memory: V2Record; days: Record<string, V2Record>; assets: Record<string, V2Record> }
type Envelope = { contract: 'memory-source-v2'; locales: Partial<Record<'zh-TW' | 'en', Baseline>> }

export function planMemoryV2(source: MemorySourceV2, inventory: V2Inventory) {
  const exact = <T>(rows: T[], label: string, matches: (item: T) => boolean): T => {
    const found = rows.filter(matches)
    if (found.length !== 1) throw new Error(`${label}: expected one exact relationship, found ${found.length}`)
    return found[0]!
  }
  const placeholderIds = new Map((source.assets ?? []).filter(asset => !inventory.media.some(item => item.sourcePath === asset.sourcePath))
    .map((asset, index) => [asset.sourcePath, -(index + 1)]))
  const resolver = {
    member: (slug: string) => exact(inventory.members, `member ${slug}`, item => item.slug === slug).id,
    plan: (slug: string) => exact(inventory.plans, `plan ${slug}`, item => item.slug === slug).id,
    media: (sourcePath: string) => placeholderIds.get(sourcePath) ?? exact(inventory.media, `media ${sourcePath}`, item => item.sourcePath === sourcePath).id,
  }
  const projection = projectMemoryV2(source, resolver)
  const metadata = inventory.memory?.sourceMetadata as { baseProjection?: Envelope } | undefined
  const envelope = metadata?.baseProjection?.contract === 'memory-source-v2' ? metadata.baseProjection : undefined
  // A different locale is not evidence of ownership of this locale's text or
  // localized array rows. Missing locale Base needs a reviewed adoption plan.
  const base = envelope?.locales[source.locale]
  const parent = reconcileMemoryV2(projection.memory, base?.memory, inventory.memory)
  const days = projection.days.map(item => {
    const current = inventory.days.filter(day => day.dayKey === item.dayKey)
    if (current.length > 1) throw new Error(`Duplicate current day ${item.dayKey}`)
    return { dayKey: item.dayKey, id: current[0]?.id, ...reconcileMemoryV2(item, base?.days[item.dayKey], current[0]) }
  })
  const assets = projection.assets.map(item => {
    const current = inventory.media.filter(asset => asset.sourcePath === item.sourcePath)
    if (current.length > 1) throw new Error(`Duplicate current media ${item.sourcePath}`)
    return { sourcePath: item.sourcePath!, id: current[0]?.id, ...reconcileMemoryV2(item, base?.assets[item.sourcePath!], current[0]) }
  })
  // No child/media apply is permitted when the owning legacy record lacks a
  // v2 baseline. An explicit reviewed baseline is a separate operation.
  const missingBase = Boolean(inventory.memory && !base)
  return {
    locale: source.locale, slug: source.slug, parent, days, assets, missingBase,
    conflicts: [parent, ...days, ...assets].flatMap(item => item.conflicts),
    placeholderIds: Object.fromEntries(placeholderIds),
    nextEnvelope: {
      contract: 'memory-source-v2', locales: {
        ...envelope?.locales,
        [source.locale]: {
          memory: parent.base,
          days: { ...base?.days, ...Object.fromEntries(days.map(item => [item.dayKey, item.base])) },
          assets: { ...base?.assets, ...Object.fromEntries(assets.map(item => [item.sourcePath, item.base])) },
        },
      },
    } satisfies Envelope,
  }
}

// The same bounded, scoped inventory feeds both dry-run and apply. No unrelated
// collections are scanned; each reference must resolve exactly once.
export async function readMemoryV2Inventory(payload: Payload, source: MemorySourceV2): Promise<V2Inventory> {
  const options = { depth: 0 as const, locale: source.locale, fallbackLocale: false as const, limit: 2 }
  const memories = await payload.find({ ...options, collection: 'travel-memories', where: { slug: { equals: source.slug } } })
  if (memories.docs.length > 1) throw new Error(`Duplicate memory slug: ${source.slug}`)
  const memory = memories.docs[0]
  const days = memory ? await payload.find({ ...options, collection: 'travel-memory-days', limit: 100, where: { memory: { equals: memory.id } } }) : undefined
  if (days?.hasNextPage) throw new Error('Memory has more than 100 days; bounded inventory exceeded')
  const members: V2Inventory['members'] = []
  for (const slug of new Set([...(source.participants ?? []), ...(source.assets ?? []).flatMap(asset => asset.relatedMembers ?? [])])) {
    const result = await payload.find({ ...options, collection: 'users', where: { slug: { equals: slug } } })
    for (const item of result.docs) members.push({ id: item.id, slug: item.slug ?? '' })
  }
  const plans: V2Inventory['plans'] = []
  if (source.originPlan) {
    const result = await payload.find({ ...options, collection: 'travel-plans', where: { slug: { equals: source.originPlan } } })
    for (const item of result.docs) plans.push({ id: item.id, slug: item.slug })
  }
  const refs = new Set([
    ...(source.assets ?? []).map(item => item.sourcePath), ...(source.coverImage ? [source.coverImage] : []),
    ...(source.galleryImages ?? []), ...(source.storySections ?? []).flatMap(item => item.mediaItems ?? []),
    ...(source.days ?? []).flatMap(item => [...(item.dailyHeroImage ? [item.dailyHeroImage] : []),
      ...(item.moments ?? []).flatMap(moment => (moment.placements ?? []).flatMap(item => item.media ? [item.media] : []))]),
  ])
  const media: V2Inventory['media'] = []
  for (const sourcePath of refs) {
    if (!sourcePath.startsWith(`travels/${source.slug}/`)) throw new Error(`Cross-owner media reference: ${sourcePath}`)
    const result = await payload.find({ ...options, collection: 'media', where: { sourcePath: { equals: sourcePath } } })
    for (const item of result.docs) {
      if (item.relatedTravelRecord && (item.relatedTravelRecord.relationTo !== 'travel-memories' || item.relatedTravelRecord.value !== memory?.id)) {
        throw new Error(`Media ownership mismatch: ${sourcePath}`)
      }
      media.push({ ...item, sourcePath })
    }
  }
  return { memory: memory ? { ...memory } : undefined, days: (days?.docs ?? []).map(item => ({ ...item })), media, members, plans }
}

export async function importMemoryV2(payload: Payload, source: MemorySourceV2, options: {
  apply: boolean; assetRoot: string; sourceFile: string
}) {
  const inventory = await readMemoryV2Inventory(payload, source)
  const plan = planMemoryV2(source, inventory)
  // Resolve real paths before any writes, including symlink containment checks.
  const files = new Map<string, string>()
  if (plan.assets.some(asset => asset.action === 'create' && asset.data.type === 'photo')) {
    const root = await realpath(options.assetRoot)
    for (const asset of plan.assets.filter(asset => asset.action === 'create' && asset.data.type === 'photo')) {
      const filename = await realpath(path.resolve(root, asset.sourcePath))
      if (!filename.startsWith(`${root}${path.sep}`)) throw new Error(`Asset escapes root: ${asset.sourcePath}`)
      files.set(asset.sourcePath, filename)
    }
  }
  if (!options.apply) return plan
  if (plan.missingBase || plan.conflicts.length) throw new Error(`BLOCK: ${plan.missingBase ? 'missing v2 baseline' : plan.conflicts.join('; ')}`)
  // Uploaded files and record writes are not atomic. Failures propagate and the
  // caller must inspect/reconcile before another approved attempt.
  for (const asset of plan.assets.filter(asset => asset.action === 'create')) {
    const created = await payload.create({ collection: 'media', locale: source.locale,
      data: asset.data as never, ...(files.has(asset.sourcePath) ? { filePath: files.get(asset.sourcePath)! } : {}) })
    inventory.media.push({ ...created, sourcePath: asset.sourcePath })
  }
  const resolved = planMemoryV2(source, inventory)
  // Re-materialize the source with real upload IDs; newly created assets still
  // have no accepted Base until the owning Memory metadata is committed.
  for (const asset of plan.assets.filter(asset => asset.action === 'update')) {
    await payload.update({ collection: 'media', id: asset.id!, locale: source.locale, data: changedData(asset.data, inventory.media.find(item => item.id === asset.id)) as never })
  }
  const projected = projectMemoryV2(source, {
    member: slug => inventory.members.find(item => item.slug === slug)!.id,
    plan: slug => inventory.plans.find(item => item.slug === slug)!.id,
    media: sourcePath => inventory.media.find(item => item.sourcePath === sourcePath)!.id,
  })
  const parentData = changedData(resolved.parent.data, inventory.memory)
  const memory = inventory.memory
    ? resolved.parent.action === 'update'
      ? await payload.update({ collection: 'travel-memories', id: inventory.memory.id, locale: source.locale, data: parentData as never })
      : inventory.memory
    : await payload.create({ collection: 'travel-memories', locale: source.locale, data: { ...parentData, _status: 'draft' } as never })
  for (const day of resolved.days) {
    if (day.action === 'create') await payload.create({ collection: 'travel-memory-days', locale: source.locale,
      data: { ...writable(day.data), memory: memory.id, _status: 'draft' } as never })
    else if (day.action === 'update') await payload.update({ collection: 'travel-memory-days', id: day.id!, locale: source.locale, data: changedData(day.data, inventory.days.find(item => item.id === day.id)) as never })
  }
  for (const asset of plan.assets.filter(asset => asset.action === 'create')) {
    await payload.update({ collection: 'media', id: inventory.media.find(item => item.sourcePath === asset.sourcePath)!.id,
      data: { relatedTravelRecord: { relationTo: 'travel-memories', value: memory.id } } })
  }
  const nextEnvelope = resolved.nextEnvelope
  const accepted = nextEnvelope.locales[source.locale]!
  for (const asset of projected.assets) {
    if (plan.assets.some(item => item.sourcePath === asset.sourcePath && item.action === 'create')) accepted.assets[asset.sourcePath!] = asset
  }
  await payload.update({ collection: 'travel-memories', id: memory.id, data: { sourceMetadata: {
    sourceFile: options.sourceFile, parserVersion: 'memory-source-v2',
    sourceHash: createHash('sha256').update(JSON.stringify(source)).digest('hex'),
    lastImportedAt: new Date().toISOString(), baseProjection: nextEnvelope,
  } } })
  return { ...resolved, applied: true, memoryId: memory.id }
}

function writable(value: V2Record): V2Record {
  const { id: _id, createdAt: _created, updatedAt: _updated, sourceMetadata: _metadata, days: _days, ...data } = value
  return data
}

function changedData(value: V2Record, current?: V2Record): V2Record {
  return Object.fromEntries(Object.entries(writable(value)).filter(([key, item]) => !isDeepStrictEqual(item, current?.[key])))
}
