import type { TravelSeed } from './seed-content'
import { materializeTravelLocale } from './travel-collection-copy-package'
import { buildTravelPlanProjection } from './travel-collection-copy-readiness'
import { buildTravelMemoryProjection } from './travel-memory-copy-transformer'
import {
  buildTravelProjection,
  reconcileTravelSeed,
  travelProjectionHash,
  type ReconciliationMode,
  type TravelReconciliationPlan,
  type TravelProjection,
} from './travel-seed-reconciliation'

export type TravelSeedCollection = 'travel-memories' | 'travel-plans'

export type TravelSeedTarget = {
  collection: TravelSeedCollection
  data: TravelProjection & {
    sourceMetadata: {
      sourceFile: string
      sourceHash: string
      parserVersion: 'phase-17-memory-v1' | 'phase-17-plan-v1'
      baseProjection: TravelProjection
      lastImportedAt?: string
    }
  }
  source: TravelProjection
  sourceHash: string
}

type TravelSeedDocument = TravelProjection & { id: number | string }

export type TravelSeedStore = {
  find(args: {
    collection: TravelSeedCollection
    depth: 0
    limit: 1
    where: { slug: { equals: string } }
  }): Promise<{ docs: TravelSeedDocument[] }>
  create(args: {
    collection: TravelSeedCollection
    data: TravelProjection
  }): Promise<{ id: number | string }>
  update(args: {
    collection: TravelSeedCollection
    data: TravelProjection
    id: number | string
  }): Promise<{ id: number | string }>
}

export type TravelSeedWriteResult = {
  action: TravelReconciliationPlan['action']
  conflicts: TravelReconciliationPlan['conflicts']
  current?: TravelProjection
  id?: number | string
}

export type TravelSeedStatBucket = 'created' | 'skipped' | 'updated'

export function travelSeedStatBucket(
  action: TravelSeedWriteResult['action'],
  mode: ReconciliationMode,
): TravelSeedStatBucket {
  if (action === 'create') return 'created'
  if (action === 'conflict' || action === 'skip' || action === 'already-converged') {
    return 'skipped'
  }
  if (action === 'preserve-current' && mode === 'safe') return 'skipped'
  return 'updated'
}

export function buildTravelSeedTarget(
  travel: TravelSeed,
  data: TravelProjection,
): TravelSeedTarget {
  const collection = travel.status === 'planning' ? 'travel-plans' : 'travel-memories'
  const publishedData = { ...data, _status: 'published' as const }
  const source = buildTravelProjection(
    collection === 'travel-plans'
      ? buildTravelPlanProjection(publishedData)
      : buildTravelMemoryProjection(publishedData),
  )
  const sourceHash = travelProjectionHash(source)

  return {
    collection,
    source,
    sourceHash,
    data: {
      ...source,
      sourceMetadata: {
        sourceFile: travel.externalDocIdentifier,
        sourceHash,
        parserVersion:
          collection === 'travel-plans' ? 'phase-17-plan-v1' : 'phase-17-memory-v1',
        baseProjection: source,
      },
    },
  }
}

export async function writeTravelSeedTarget(input: {
  mode: ReconciliationMode
  now?: string
  store: TravelSeedStore
  target: TravelSeedTarget
}): Promise<TravelSeedWriteResult> {
  const existing = await input.store.find({
    collection: input.target.collection,
    depth: 0,
    limit: 1,
    where: { slug: { equals: String(input.target.source.slug) } },
  })
  const currentDocument = existing.docs[0]

  if (!currentDocument) {
    const created = await input.store.create({
      collection: input.target.collection,
      data: {
        ...input.target.data,
        sourceMetadata: {
          ...input.target.data.sourceMetadata,
          lastImportedAt: input.now ?? new Date().toISOString(),
        },
      },
    })
    return { action: 'create', conflicts: [], id: created.id }
  }

  const current = buildTravelProjection(currentDocument)
  const plan = reconcileTravelSeed({
    slug: String(input.target.source.slug),
    base: travelSeedBaseProjection(currentDocument),
    source: input.target.source,
    current,
    mode: input.mode,
  })

  if (plan.action === 'conflict') {
    return { action: plan.action, conflicts: plan.conflicts, current, id: currentDocument.id }
  }

  if (plan.action === 'skip' || plan.action === 'already-converged') {
    return { action: plan.action, conflicts: [], current, id: currentDocument.id }
  }

  if (plan.action === 'preserve-current' && input.mode === 'safe') {
    return { action: plan.action, conflicts: [], current, id: currentDocument.id }
  }

  const sourceMetadata = {
    ...input.target.data.sourceMetadata,
    ...(plan.action === 'apply-source'
      ? { lastImportedAt: input.now ?? new Date().toISOString() }
      : {}),
  }
  const updated = await input.store.update({
    collection: input.target.collection,
    id: currentDocument.id,
    data:
      plan.action === 'apply-source'
        ? { ...plan.patch, sourceMetadata }
        : { sourceMetadata },
  })

  return { action: plan.action, conflicts: [], current, id: updated.id }
}

export function travelSeedBaseProjection(
  value: unknown,
): TravelProjection | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  if (!('sourceMetadata' in value)) return undefined

  const metadata = value.sourceMetadata
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return undefined
  const baseProjection = 'baseProjection' in metadata ? metadata.baseProjection : undefined
  return baseProjection && typeof baseProjection === 'object' && !Array.isArray(baseProjection)
    ? buildTravelProjection(
        materializeTravelLocale(baseProjection as TravelProjection, 'zh-TW'),
      )
    : undefined
}
