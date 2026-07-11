import type { Payload } from 'payload'

import type { SeedContent } from './seed-content'
import { mediaRecordMatchesSeed } from './seed-media-compare'
import { attachSourceSectionMediaIds } from './travel-section-media'
import {
  buildTravelProjection,
  reconcileTravelSeed,
  type ReconciliationMode,
  type ReconciliationConflict,
  type TravelProjection,
} from './travel-seed-reconciliation'

export type DryRunAction = {
  collection: 'media' | 'travel-projects' | 'users'
  key: string
  action: 'conflict' | 'create' | 'preserve' | 'skip' | 'update'
  existingId?: number
  conflicts?: ReconciliationConflict[]
}

export type DryRunSummary = {
  creates: number
  updates: number
  skips: number
  preserves: number
  conflicts: number
  deletes: number
}

export async function buildPayloadDryRun(
  payload: Payload,
  seedContent: SeedContent,
  mode: ReconciliationMode = 'safe',
): Promise<{
  actions: DryRunAction[]
  summary: DryRunSummary
  deletionRisk: string
}> {
  const actions: DryRunAction[] = []
  const [users, travels, media] = await Promise.all([
    payload.find({
      collection: 'users',
      depth: 0,
      limit: 1000,
      pagination: false,
    }),
    payload.find({
      collection: 'travel-projects',
      depth: 0,
      limit: 1000,
      pagination: false,
    }),
    payload.find({
      collection: 'media',
      depth: 0,
      limit: 2000,
      pagination: false,
    }),
  ])
  const userIdBySlug = new Map(users.docs.map((user) => [user.slug, user.id]))
  const travelBySlug = new Map(travels.docs.map((travel) => [travel.slug, travel]))
  const mediaRecordBySourcePath = new Map(
    media.docs.flatMap((item) => (item.sourcePath ? [[item.sourcePath, item] as const] : [])),
  )

  for (const member of seedContent.members) {
    const existingId = userIdBySlug.get(member.slug)

    actions.push({
      collection: 'users',
      key: member.slug,
      action: existingId ? 'update' : 'create',
      existingId,
    })
  }

  for (const travel of seedContent.travels) {
    const existing = travelBySlug.get(travel.slug)
    const assets = seedContent.media.filter(
      (item) => item.ownerType === 'travel' && item.ownerSlug === travel.slug,
    )
    const mediaIdBySourcePath = new Map(
      assets.flatMap((item) => {
        const existingMedia = mediaRecordBySourcePath.get(item.sourcePath)
        return existingMedia ? [[item.sourcePath, Number(existingMedia.id)] as const] : []
      }),
    )
    const idsFor = (usages: string[]) =>
      assets
        .filter((item) => usages.includes(item.usage))
        .map((item) => mediaIdBySourcePath.get(item.sourcePath))
        .filter((id): id is number => typeof id === 'number')
    const coverImage = idsFor(['cover', 'gallery'])[0]
    const source = buildTravelProjection({
      ...attachSourceSectionMediaIds({ mediaBySourcePath: mediaIdBySourcePath, mediaItems: assets, travel }),
      coverImage,
      galleryImages: idsFor(['gallery', 'cover']),
      itineraryImages: idsFor(['itinerary']),
    })
    const metadata = existing ? sourceMetadataFrom(existing) : undefined
    const plan = reconcileTravelSeed({
      slug: travel.slug,
      base: metadata?.baseProjection,
      source,
      current: existing ? buildTravelProjection(existing as unknown as TravelProjection) : undefined,
      mode,
    })
    const action =
      plan.action === 'create'
        ? 'create'
        : plan.action === 'apply-source'
          ? 'update'
          : plan.action === 'conflict'
            ? 'conflict'
            : plan.action === 'preserve-current'
              ? 'preserve'
              : 'skip'

    actions.push({
      collection: 'travel-projects',
      key: travel.slug,
      action,
      existingId: existing ? Number(existing.id) : undefined,
      conflicts: plan.conflicts.length ? plan.conflicts : undefined,
    })
  }

  for (const media of seedContent.media) {
    const existing = mediaRecordBySourcePath.get(media.sourcePath)

    actions.push({
      collection: 'media',
      key: media.sourcePath,
      action: existing ? (mediaRecordMatchesSeed(existing, media) ? 'skip' : 'update') : 'create',
      existingId: existing?.id,
    })
  }

  return {
    actions,
    summary: summarizeDryRunActions(actions),
    deletionRisk: 'No delete operation is implemented by the Phase 9 seed workflow.',
  }
}

function sourceMetadataFrom(value: unknown): { baseProjection?: TravelProjection } | undefined {
  if (!value || typeof value !== 'object' || !('sourceMetadata' in value)) {
    return undefined
  }

  const metadata = value.sourceMetadata
  if (!metadata || typeof metadata !== 'object') {
    return undefined
  }

  const baseProjection = 'baseProjection' in metadata ? metadata.baseProjection : undefined
  return {
    baseProjection:
      baseProjection && typeof baseProjection === 'object' && !Array.isArray(baseProjection)
        ? (baseProjection as TravelProjection)
        : undefined,
  }
}

export function summarizeDryRunActions(actions: DryRunAction[]): DryRunSummary {
  return actions.reduce<DryRunSummary>(
    (summary, item) => {
      if (item.action === 'create') {
        summary.creates += 1
      } else if (item.action === 'update') {
        summary.updates += 1
      } else if (item.action === 'skip') {
        summary.skips += 1
      } else if (item.action === 'preserve') {
        summary.preserves += 1
      } else {
        summary.conflicts += 1
      }

      return summary
    },
    {
      creates: 0,
      updates: 0,
      skips: 0,
      preserves: 0,
      conflicts: 0,
      deletes: 0,
    },
  )
}
