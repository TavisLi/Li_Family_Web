import path from 'node:path'
import { realpath } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import type { Payload } from 'payload'
import { projectMemoryV2, type MemorySourceV2 } from './travel-memory-source-v2'
import { reconcileMemoryV2, type V2Record } from './travel-memory-v2-reconciliation'
import { assetIdSchema, resolveRegistryEntry, resolveRegistryMediaId, validateMediaRegistry, type MediaRegistry } from './travel-memory-media-registry'

export type V2Inventory = {
  memory?: V2Record & { id: number }
  days: (V2Record & { id: number; dayKey: string })[]
  media: (V2Record & { id: number; sourcePath?: string })[]
  members: { id: number; slug: string }[]
  plans: { id: number; slug: string }[]
}
type Baseline = { memory: V2Record; days: Record<string, V2Record>; assets: Record<string, V2Record> }
type Envelope = { contract: 'memory-source-v2'; locales: Partial<Record<'zh-TW' | 'en', Baseline>> }

export function planMemoryV2(source: MemorySourceV2, inventory: V2Inventory, registry?: MediaRegistry, environment?: string) {
  if (registry) validateMediaRegistry(registry, source.slug)
  const isAssetId = (value: string) => assetIdSchema.safeParse(value).success
  const assetKey = (item: NonNullable<MemorySourceV2['assets']>[number]) => item.assetId ?? item.sourcePath!
  const referenceConflicts: string[] = []
  const exact = <T>(rows: T[], label: string, matches: (item: T) => boolean): T => {
    const found = rows.filter(matches)
    if (found.length !== 1) throw new Error(`${label}: expected one exact relationship, found ${found.length}`)
    return found[0]!
  }
  const matchMedia = (reference: string) => {
    if (!isAssetId(reference)) return inventory.media.filter(item => item.sourcePath === reference)
    if (!registry || !environment) { referenceConflicts.push(`assetId ${reference}: registry and environment required`); return [] }
    const entry = resolveRegistryEntry(registry, reference)
    if (!entry) { referenceConflicts.push(`assetId ${reference}: missing registry entry`); return [] }
    const id = resolveRegistryMediaId(registry, reference, environment)
    if (!id && entry.sourcePath && inventory.media.some(item => item.sourcePath === entry.sourcePath)) {
      referenceConflicts.push(`assetId ${reference}: existing alias lacks verified byte-to-Media locator`)
    }
    const matches = id ? inventory.media.filter(item => item.id === id) : []
    if (id && !matches.length) referenceConflicts.push(`assetId ${reference}: verified locator Media missing from inventory`)
    if (matches[0]?.sourcePath && entry.sourcePath && matches[0].sourcePath !== entry.sourcePath) {
      referenceConflicts.push(`assetId ${reference}: locator alias differs from Current`)
    }
    return matches
  }
  for (const asset of source.assets ?? []) {
    if (!asset.assetId) continue
    const entry = registry && resolveRegistryEntry(registry, asset.assetId)
    if (asset.sourcePath && entry?.sourcePath !== asset.sourcePath) referenceConflicts.push(`assetId ${asset.assetId}: sourcePath alias mismatch`)
  }
  const placeholderIds = new Map((source.assets ?? []).filter(asset => !matchMedia(assetKey(asset)).length)
    .map((asset, index) => [assetKey(asset), -(index + 1)]))
  const resolver = {
    member: (slug: string) => exact(inventory.members, `member ${slug}`, item => item.slug === slug).id,
    plan: (slug: string) => exact(inventory.plans, `plan ${slug}`, item => item.slug === slug).id,
    media: (reference: string) => {
      const placeholder = placeholderIds.get(reference)
      if (placeholder) return placeholder
      const matches = matchMedia(reference)
      if (isAssetId(reference) && matches.length !== 1) {
        referenceConflicts.push(`assetId ${reference}: expected one verified Media relationship, found ${matches.length}`)
        return -100000 - referenceConflicts.length
      }
      return exact(matches, `media ${reference}`, () => true).id
    },
  }
  const projection = projectMemoryV2(source, resolver)
  const rows = (value: unknown): V2Record[] => Array.isArray(value)
    ? value.filter((item): item is V2Record => Boolean(item) && typeof item === 'object' && !Array.isArray(item)) : []
  for (const day of projection.days) {
    const current = inventory.days.find(item => item.dayKey === day.dayKey)
    for (const nextMoment of rows(day.moments)) {
      const currentMoments = rows(current?.moments)
      const sameMoment = currentMoments.find(item => item.momentKey === nextMoment.momentKey)
      for (const nextPlacement of rows(nextMoment.placements)) {
        const sameMedia = (item: V2Record) => nextPlacement.media != null && item.media === nextPlacement.media
        if (sameMoment && rows(sameMoment.placements).some(placement =>
          sameMedia(placement) && placement.placementKey !== nextPlacement.placementKey)) {
          referenceConflicts.push(`day ${day.dayKey}: existing placementKey/relationship needs reviewed mapping`)
        }
      }
    }
  }
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
  const assets = projection.assets.map((item, index) => {
    const key = assetKey(source.assets![index]!)
    const current = matchMedia(key)
    if (current.length > 1) throw new Error(`Duplicate current media ${key}`)
    return { key, sourcePath: item.sourcePath, id: current[0]?.id, ...reconcileMemoryV2(item, base?.assets[key], current[0]) }
  })
  // No child/media apply is permitted when the owning legacy record lacks a
  // v2 baseline. An explicit reviewed baseline is a separate operation.
  const missingBase = Boolean(inventory.memory && !base)
  if (missingBase) {
    for (const item of projection.days) {
      const current = inventory.days.find(day => day.dayKey === item.dayKey)
      if (current && Array.isArray(current.moments) && current.moments.length) {
        referenceConflicts.push(`day ${item.dayKey}: existing momentKey/placementKey require reviewed Current mapping before adoption`)
      }
    }
  }
  return {
    locale: source.locale, slug: source.slug, parent, days, assets, missingBase,
    conflicts: [...new Set([...referenceConflicts, ...[parent, ...days, ...assets].flatMap(item => item.conflicts)])],
    placeholderIds: Object.fromEntries(placeholderIds),
    nextEnvelope: {
      contract: 'memory-source-v2', locales: {
        ...envelope?.locales,
        [source.locale]: {
          memory: parent.base,
          days: { ...base?.days, ...Object.fromEntries(days.map(item => [item.dayKey, item.base])) },
          assets: { ...base?.assets, ...Object.fromEntries(assets.map(item => [item.key, item.base])) },
        },
      },
    } satisfies Envelope,
  }
}

// The same bounded, scoped inventory feeds both dry-run and apply. No unrelated
// collections are scanned; each reference must resolve exactly once.
export async function readMemoryV2Inventory(payload: Payload, source: MemorySourceV2, registry?: MediaRegistry, environment?: string): Promise<V2Inventory> {
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
    ...(source.assets ?? []).map(item => item.assetId ?? item.sourcePath!), ...(source.coverImage ? [source.coverImage] : []),
    ...(source.galleryImages ?? []), ...(source.storySections ?? []).flatMap(item => item.mediaItems ?? []),
    ...(source.days ?? []).flatMap(item => [...(item.dailyHeroImage ? [item.dailyHeroImage] : []),
      ...(item.moments ?? []).flatMap(moment => (moment.placements ?? []).flatMap(item => item.media ? [item.media] : []))]),
  ])
  const media: V2Inventory['media'] = []
  for (const reference of refs) {
    const hashReference = assetIdSchema.safeParse(reference).success
    const entry = hashReference && registry ? resolveRegistryEntry(registry, reference) : undefined
    const id = hashReference && registry && environment ? resolveRegistryMediaId(registry, reference, environment) : undefined
    const sourcePath = hashReference ? entry?.sourcePath : reference
    if (sourcePath && !sourcePath.startsWith(`travels/${source.slug}/`)) throw new Error(`Cross-owner media reference: ${sourcePath}`)
    if (!id && !sourcePath) continue
    const result = await payload.find({ ...options, collection: 'media', where: id ? { id: { equals: id } } : { sourcePath: { equals: sourcePath } } })
    for (const item of result.docs) {
      if (item.relatedTravelRecord && (item.relatedTravelRecord.relationTo !== 'travel-memories' || item.relatedTravelRecord.value !== memory?.id)) {
        throw new Error(`Media ownership mismatch: ${reference}`)
      }
      if (!media.some(row => row.id === item.id)) media.push({ ...item, sourcePath: item.sourcePath ?? undefined })
    }
  }
  return { memory: memory ? { ...memory } : undefined, days: (days?.docs ?? []).map(item => ({ ...item })), media, members, plans }
}

export async function importMemoryV2(payload: Payload, source: MemorySourceV2, options: {
  apply: boolean; assetRoot: string; sourceFile: string; registry?: MediaRegistry; environment?: string
}) {
  const inventory = await readMemoryV2Inventory(payload, source, options.registry, options.environment)
  const plan = planMemoryV2(source, inventory, options.registry, options.environment)
  if (plan.missingBase || plan.conflicts.length) {
    if (options.apply) throw new Error(`BLOCK: ${plan.missingBase ? 'missing v2 baseline' : plan.conflicts.join('; ')}`)
    return plan
  }
  if (options.apply && plan.assets.some(asset => asset.action === 'create' && asset.key.startsWith('sha256:'))) {
    throw new Error('BLOCK: new assetId media needs a verified post-upload Media locator before apply')
  }
  // Resolve real paths before any writes, including symlink containment checks.
  const files = new Map<string, string>()
  if (plan.assets.some(asset => asset.action === 'create' && asset.data.type === 'photo' && asset.sourcePath && !asset.key.startsWith('sha256:'))) {
    const root = await realpath(options.assetRoot)
    for (const asset of plan.assets.filter(asset => asset.action === 'create' && asset.data.type === 'photo' && asset.sourcePath && !asset.key.startsWith('sha256:'))) {
      const filename = await realpath(path.resolve(root, asset.sourcePath!))
      if (!filename.startsWith(`${root}${path.sep}`)) throw new Error(`Asset escapes root: ${asset.sourcePath}`)
      files.set(asset.sourcePath!, filename)
    }
  }
  if (!options.apply) return plan
  // Uploaded files and record writes are not atomic. Failures propagate and the
  // caller must inspect/reconcile before another approved attempt.
  for (const asset of plan.assets.filter(asset => asset.action === 'create')) {
    if (!asset.sourcePath) throw new Error(`BLOCK: created media ${asset.key} needs a legacy sourcePath`)
    const created = await payload.create({ collection: 'media', locale: source.locale,
      data: asset.data as never, ...(files.has(asset.sourcePath) ? { filePath: files.get(asset.sourcePath)! } : {}) })
    inventory.media.push({ ...created, sourcePath: asset.sourcePath })
  }
  const resolved = planMemoryV2(source, inventory, options.registry, options.environment)
  // Re-materialize the source with real upload IDs; newly created assets still
  // have no accepted Base until the owning Memory metadata is committed.
  for (const asset of plan.assets.filter(asset => asset.action === 'update')) {
    await payload.update({ collection: 'media', id: asset.id!, locale: source.locale, data: changedData(asset.data, inventory.media.find(item => item.id === asset.id)) as never })
  }
  const projected = projectMemoryV2(source, {
    member: slug => inventory.members.find(item => item.slug === slug)!.id,
    plan: slug => inventory.plans.find(item => item.slug === slug)!.id,
    media: reference => assetIdSchema.safeParse(reference).success
      ? resolveRegistryMediaId(options.registry!, reference, options.environment!)!
      : inventory.media.find(item => item.sourcePath === reference)!.id,
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
