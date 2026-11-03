import { createHash } from 'node:crypto'
import { sql } from '@payloadcms/db-postgres'
import { isDeepStrictEqual } from 'node:util'
import { createLocalReq, initTransaction, commitTransaction, type Payload, type PayloadRequest } from 'payload'
import { lockTravelGeoRequest } from '../payload/collections/travel-geo-lock'
import { projectMemoryV2, type MemorySourceV2 } from './travel-memory-source-v2'
import { reconcileMemoryV2, type V2Record } from './travel-memory-v2-reconciliation'
import { containsTravelGeo } from './travel-geo-preservation'
import { assetIdSchema, resolveRegistryEntry, validateMediaRegistry, type MediaRegistry } from './travel-memory-media-registry'

export type V2Inventory = {
  memory?: V2Record & { id: number }
  days: (V2Record & { id: number; dayKey: string })[]
  media: (V2Record & { id: number; sourcePath?: string })[]
  members: { id: number; slug: string }[]
  plans: { id: number; slug: string }[]
  allLocales?: { memory?: V2Record; days: V2Record[]; media?: V2Record[] }
}
type Baseline = { memory: V2Record; days: Record<string, V2Record>; assets: Record<string, V2Record> }
type Envelope = { contract: 'memory-source-v2'; locales: Partial<Record<'zh-TW' | 'en', Baseline>> }

export function planMemoryV2(source: MemorySourceV2, inventory: V2Inventory, registry?: MediaRegistry, environment?: string) {
  if (registry) validateMediaRegistry(registry, source.slug)
  const metadata = inventory.memory?.sourceMetadata as { baseProjection?: Envelope } | undefined
  const envelope = metadata?.baseProjection?.contract === 'memory-source-v2' ? metadata.baseProjection : undefined
  const base = envelope?.locales[source.locale]
  const missingBase = Boolean(inventory.memory && !base)
  const isAssetId = (value: string) => assetIdSchema.safeParse(value).success
  const assetKey = (item: NonNullable<MemorySourceV2['assets']>[number]) => item.assetId ?? item.sourcePath!
  const referenceConflicts: string[] = []
  if (protectedDays(inventory.days) || containsTravelGeo(metadata?.baseProjection) ||
    (inventory.allLocales && (protectedDays(inventory.allLocales.days) || containsTravelGeo(inventory.allLocales.memory?.sourceMetadata)))) {
    referenceConflicts.push('geo: legacy importer cannot safely preserve geo and its Base')
  }
  const exact = <T>(rows: T[], label: string, matches: (item: T) => boolean): T => {
    const found = rows.filter(matches)
    if (found.length !== 1) throw new Error(`${label}: expected one exact relationship, found ${found.length}`)
    return found[0]!
  }
  const currentMediaId = (context?: string): number | undefined => {
    if (context === 'cover') return inventory.memory?.coverImage as number | undefined
    if (context?.startsWith('gallery|')) return (inventory.memory?.galleryImages as number[] | undefined)?.[Number(context.slice(8))]
    if (context?.startsWith('story|')) {
      const [, anchor, index] = context.split('|')
      const story = rows(inventory.memory?.storySections).find(item => item.anchor === anchor)
      return (story?.mediaItems as number[] | undefined)?.[Number(index)]
    }
    const [kind, dayKey, momentKey, placementKey] = context?.split('|') ?? []
    const day = inventory.days.find(item => item.dayKey === dayKey)
    if (!day) return undefined
    if (kind === 'hero') return day.dailyHeroImage as number | undefined
    if (kind !== 'placement') return undefined
    const moment = rows(day.moments).find(item => item.momentKey === momentKey)
    return rows(moment?.placements).find(item => item.placementKey === placementKey)?.media as number | undefined
  }
  const rows = (value: unknown): V2Record[] => Array.isArray(value)
    ? value.filter((item): item is V2Record => Boolean(item) && typeof item === 'object' && !Array.isArray(item)) : []
  const matchMedia = (reference: string, context?: string) => {
    if (!isAssetId(reference)) return inventory.media.filter(item => item.sourcePath === reference)
    if (!registry || !environment) { referenceConflicts.push(`assetId ${reference}: registry and environment required`); return [] }
    const entry = resolveRegistryEntry(registry, reference)
    if (!entry) { referenceConflicts.push(`assetId ${reference}: missing registry entry`); return [] }
    const verifiedIds = entry.locators.filter(item => item.environment === environment && item.verified).map(item => item.payloadId)
    const currentId = currentMediaId(context)
    if (missingBase && currentId && !verifiedIds.includes(currentId)) {
      referenceConflicts.push(`assetId ${reference}: verified locator does not match exact Current relationship for ${context}`)
      return []
    }
    const id = verifiedIds.length === 1 ? verifiedIds[0] : verifiedIds.length > 1 ? currentId : undefined
    if (verifiedIds.length > 1 && (!id || !verifiedIds.includes(id))) {
      referenceConflicts.push(`assetId ${reference}: exact verified Current relationship required for ${context ?? 'asset metadata'}`)
      return []
    }
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
    media: (reference: string, context?: string) => {
      const placeholder = placeholderIds.get(reference)
      if (placeholder) return placeholder
      const matches = matchMedia(reference, context)
      if (matches.length !== 1) {
        referenceConflicts.push(`media ${reference}: expected one verified Current relationship, found ${matches.length}`)
        return -100000 - referenceConflicts.length
      }
      return exact(matches, `media ${reference}`, () => true).id
    },
  }
  const projection = projectMemoryV2(source, resolver)
  for (const day of source.days ?? []) for (const moment of day.moments ?? []) for (const placement of moment.placements ?? []) {
    if (!placement.legacyUnresolvedMedia) continue
    const currentDay = inventory.days.find(item => item.dayKey === `day-${String(day.day).padStart(2, '0')}`)
    const currentMoment = rows(currentDay?.moments).find(item => item.momentKey === moment.momentKey)
    const currentPlacement = rows(currentMoment?.placements).find(item => item.placementKey === placement.placementKey)
    if (!currentPlacement || currentPlacement.type !== 'photo' || currentPlacement.media != null) {
      referenceConflicts.push(`placement ${placement.placementKey}: legacy unresolved photo must match a null Current relationship`)
    }
  }
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
  // A different locale is not evidence of ownership of this locale's text or
  // localized array rows. Missing locale Base needs a reviewed adoption plan.
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
      ...envelope,
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

// This exception is V2 Current-only. Geo Base and unknown shapes stay protected.
function emptyCurrentGeo(value: unknown): boolean {
  if (value == null) return true
  if (typeof value !== 'object' || Array.isArray(value)) return false
  const fields = ['name', 'latitude', 'longitude', 'crs', 'provenance', 'originalCRS', 'approval']
  return Object.entries(value).every(([key, item]) => {
    if (!fields.includes(key)) return false
    if (item == null) return true
    if (key !== 'name' && key !== 'approval') return false
    if (typeof item !== 'object' || Array.isArray(item)) return false
    const keys = key === 'name' ? ['zh-TW', 'en'] : ['snapshot', 'audience', 'confirmedBy']
    return Object.entries(item).every(([field, part]) => keys.includes(field) && part == null)
  })
}
function protectedDays(days: V2Record[]): boolean {
  return days.some(day => {
    const { moments, ...rest } = day
    if (containsTravelGeo(rest)) return true
    if (moments == null) return false
    if (!Array.isArray(moments)) return true
    return moments.some(moment => {
      if (!moment || typeof moment !== 'object' || Array.isArray(moment)) return true
      const { geo, ...other } = moment
      return !emptyCurrentGeo(geo) || containsTravelGeo(other)
    })
  })
}

// The same bounded, scoped inventory feeds both dry-run and apply. No unrelated
// collections are scanned; each reference must resolve exactly once.
export async function readMemoryV2Inventory(payload: Payload, source: MemorySourceV2, registry?: MediaRegistry, environment?: string, req?: PayloadRequest): Promise<V2Inventory> {
  const options = { req, depth: 0 as const, draft: true, locale: source.locale, fallbackLocale: false as const, limit: 2 }
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
    const ids = entry && environment ? entry.locators.filter(item => item.environment === environment && item.verified).map(item => item.payloadId) : []
    const sourcePath = hashReference ? entry?.sourcePath : reference
    if (sourcePath && !sourcePath.startsWith(`travels/${source.slug}/`)) throw new Error(`Cross-owner media reference: ${sourcePath}`)
    if (!ids.length && !sourcePath) continue
    for (const id of ids.length ? ids : [undefined]) {
      const result = await payload.find({ ...options, collection: 'media', where: id ? { id: { equals: id } } : { sourcePath: { equals: sourcePath } } })
      for (const item of result.docs) {
        if (item.relatedTravelRecord && (item.relatedTravelRecord.relationTo !== 'travel-memories' || item.relatedTravelRecord.value !== memory?.id)) {
          throw new Error(`Media ownership mismatch: ${reference}`)
        }
        if (!media.some(row => row.id === item.id)) media.push({ ...item, sourcePath: item.sourcePath ?? undefined })
      }
    }
  }
  const allMemory = await payload.find({ ...options, locale: 'all', collection: 'travel-memories', where: { slug: { equals: source.slug } } })
  if (allMemory.docs.length !== memories.docs.length || allMemory.docs[0]?.id !== memory?.id) throw new Error('BLOCK: V2 locale owner mismatch')
  const allDays = memory ? await payload.find({ ...options, locale: 'all', collection: 'travel-memory-days', limit: 100, where: { memory: { equals: memory.id } } }) : undefined
  if (allDays?.hasNextPage || !isDeepStrictEqual((allDays?.docs ?? []).map(d => d.id).sort(), (days?.docs ?? []).map(d => d.id).sort())) throw new Error('BLOCK: V2 locale day inventory mismatch')
  const allMedia: V2Record[] = []
  for (const item of media) {
    const result = await payload.find({ ...options, locale: 'all', collection: 'media', where: { id: { equals: item.id } } })
    if (result.docs.length !== 1 || result.docs[0].id !== item.id) throw new Error('BLOCK: V2 Media inventory mismatch')
    allMedia.push(result.docs[0] as unknown as V2Record)
  }
  return { allLocales: { memory: allMemory.docs[0] as unknown as V2Record, days: (allDays?.docs ?? []) as unknown as V2Record[], media: allMedia }, memory: memory ? { ...memory } : undefined, days: (days?.docs ?? []).map(item => ({ ...item })), media, members, plans }
}

export async function importMemoryV2(payload: Payload, source: MemorySourceV2, options: {
  apply: boolean; assetRoot: string; sourceFile: string; registry?: MediaRegistry; environment?: string; req?: PayloadRequest
}) {
  const read = (req?: PayloadRequest) => readMemoryV2Inventory(payload, source, options.registry, options.environment, req)
  if (!options.apply) return planMemoryV2(source, await read(), options.registry, options.environment)
  const req = options.req ?? await createLocalReq({ locale: source.locale, fallbackLocale: false }, payload)
  if (req.payload !== payload) throw new Error('BLOCK: V2 requires its own request transaction: payload mismatch')
  if (req.transactionID) throw new Error('BLOCK: V2 requires its own request transaction: active transaction')
  let started = false
  let committing = false
  try {
    started = await initTransaction(req)
    await lockTravelGeoRequest(req)
    const inventory = await read(req)
    const plan = planMemoryV2(source, inventory, options.registry, options.environment)
    if (plan.missingBase || plan.conflicts.length) throw new Error(`BLOCK: ${plan.missingBase ? 'missing v2 baseline' : plan.conflicts.join('; ')}`)
    // A DB transaction cannot undo storage uploads. No new Media is staged here.
    if (plan.assets.some(asset => asset.action === 'create')) throw new Error('BLOCK: V2 new Media requires separate verified intake before apply')
    if (inventory.media.length) {
      const ids = inventory.media.map(item => item.id).sort((a, b) => a - b)
      if (!ids.every(Number.isSafeInteger)) throw new Error('BLOCK: V2 Media identity invalid')
      const tx = payload.db.sessions?.[await req.transactionID!]?.db as typeof payload.db.drizzle
      const locked = await tx.execute(sql`select id from public.media where id in (${sql.join(ids.map(id => sql`${id}`), sql`, `)}) order by id for update nowait`)
      if (!isDeepStrictEqual(locked.rows.map(row => row.id).sort((a, b) => Number(a) - Number(b)), ids)) throw new Error('BLOCK: V2 Media lock identity mismatch')
    }
    const current = await read(req)
    if (!isDeepStrictEqual(inventory, current)) throw new Error('BLOCK: V2 inventory changed before write')
    const common = { req, locale: source.locale, fallbackLocale: false as const }
    for (const asset of plan.assets.filter(item => item.action === 'update')) {
      await payload.update({ ...common, collection: 'media', id: asset.id!, data: changedData(asset.data, inventory.media.find(item => item.id === asset.id)) as never })
    }
    const parentData = changedData(plan.parent.data, inventory.memory)
    const memory = inventory.memory
      ? plan.parent.action === 'update'
        ? await payload.update({ ...common, collection: 'travel-memories', id: inventory.memory.id, draft: inventory.memory._status !== 'published', data: parentData as never })
        : inventory.memory
      : await payload.create({ ...common, collection: 'travel-memories', data: { ...parentData, _status: 'draft' } as never })
    for (const day of plan.days) {
      if (day.action === 'create') await payload.create({ ...common, collection: 'travel-memory-days', data: { ...writable(day.data), memory: memory.id, _status: 'draft' } as never })
      else if (day.action === 'update') await payload.update({ ...common, collection: 'travel-memory-days', id: day.id!, draft: inventory.days.find(item => item.id === day.id)?._status !== 'published', data: changedData(day.data, inventory.days.find(item => item.id === day.id)) as never })
    }
    const content = await read(req)
    assertContent(plan.parent.data, content.memory)
    for (const day of plan.days) {
      const saved = content.days.find(item => item.dayKey === day.dayKey)
      if (day.id != null && day.id !== saved?.id) throw new Error('BLOCK: V2 Day identity changed')
      assertContent(day.data, saved)
    }
    assertOtherLocales(inventory.allLocales, content.allLocales, source.locale)
    for (const day of inventory.days.filter(item => !plan.days.some(target => target.dayKey === item.dayKey))) {
      if (!isDeepStrictEqual(day, content.days.find(item => item.id === day.id))) throw new Error('BLOCK: V2 non-target Day changed')
    }
    for (const asset of plan.assets) assertContent(asset.data, content.media.find(item => item.id === asset.id))
    if (protectedDays(content.allLocales?.days ?? []) || containsTravelGeo(content.allLocales?.memory?.sourceMetadata)) throw new Error('BLOCK: V2 protected geo appeared during write')
    const oldMetadata = (inventory.memory?.sourceMetadata ?? {}) as V2Record
    await payload.update({ ...common, collection: 'travel-memories', id: memory.id, draft: memory._status !== 'published', data: { sourceMetadata: {
      ...oldMetadata, sourceFile: options.sourceFile, parserVersion: 'memory-source-v2',
      sourceHash: createHash('sha256').update(JSON.stringify(source)).digest('hex'),
      lastImportedAt: new Date().toISOString(), baseProjection: plan.nextEnvelope,
    } } })
    const verified = await read(req)
    if (verified.memory?.id !== memory.id || protectedDays(verified.allLocales?.days ?? []) || containsTravelGeo(verified.allLocales?.memory?.sourceMetadata)) throw new Error('BLOCK: V2 final owner or geo read-back mismatch')
    if (!isDeepStrictEqual((verified.memory?.sourceMetadata as V2Record)?.baseProjection, plan.nextEnvelope)) throw new Error('BLOCK: V2 Base read-back mismatch')
    assertContent(plan.parent.data, verified.memory)
    for (const day of plan.days) assertContent(day.data, verified.days.find(item => item.dayKey === day.dayKey))
    assertOtherLocales(inventory.allLocales, verified.allLocales, source.locale)
    committing = true
    await commitTransaction(req)
    return { ...plan, applied: true, memoryId: memory.id }
  } catch (error) {
    if (started && req.transactionID) {
      try { await payload.db.rollbackTransaction(await req.transactionID); delete req.transactionID }
      catch (rollbackError) { throw new AggregateError([error, rollbackError], 'V2 failed; rollback effects UNKNOWN') }
    }
    if (committing) throw new AggregateError([error], 'V2 commit acknowledgement failed; effects UNKNOWN; do not retry')
    throw error
  }
}

function assertContent(expected: V2Record, actual?: V2Record) {
  const matches = (wanted: unknown, saved: unknown): boolean => {
    if (wanted == null) return saved == null
    if (Array.isArray(wanted)) return Array.isArray(saved) && wanted.length === saved.length && wanted.every((item, i) => matches(item, saved[i]))
    if (typeof wanted === 'object') return Boolean(saved && typeof saved === 'object') && Object.entries(wanted).every(([key, value]) => matches(value, (saved as V2Record)[key]))
    return isDeepStrictEqual(wanted, saved)
  }
  const { geoAccessRevision: _revision, ...data } = writable(expected)
  if (!matches(data, actual)) throw new Error('BLOCK: V2 content read-back mismatch')
}
function assertOtherLocales(before: V2Inventory['allLocales'], after: V2Inventory['allLocales'], locale: string) {
  const compare = (a: unknown, b: unknown): void => {
    if (!a || typeof a !== 'object') return
    if (Array.isArray(a)) {
      for (const row of a) {
        const saved = Array.isArray(b) ? b.find(item => row && typeof row === 'object' ? item?.id === row.id : isDeepStrictEqual(item, row)) : undefined
        if (saved === undefined) throw new Error('BLOCK: V2 stable row removed')
        compare(row, saved)
      }
      return
    }
    const record = a as V2Record
    for (const other of ['zh-TW', 'en']) if (other !== locale && Object.hasOwn(record, other) && !isDeepStrictEqual(record[other], (b as V2Record)?.[other])) throw new Error('BLOCK: V2 other locale changed')
    for (const [key, value] of Object.entries(record)) if (!['sourceMetadata', 'zh-TW', 'en'].includes(key)) compare(value, (b as V2Record)?.[key])
  }
  if (before?.memory) compare(before.memory, after?.memory)
  compare(before?.days, after?.days)
  compare(before?.media, after?.media)
}

function writable(value: V2Record): V2Record {
  const { id: _id, createdAt: _created, updatedAt: _updated, sourceMetadata: _metadata, days: _days, ...data } = value
  return data
}

function changedData(value: V2Record, current?: V2Record): V2Record {
  return Object.fromEntries(Object.entries(writable(value)).filter(([key, item]) => !isDeepStrictEqual(item, current?.[key])))
}
