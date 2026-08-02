import { buildTravelProjection, travelProjectionHash } from './travel-seed-reconciliation'
import {
  buildTravelMemoryDayProjections,
  type TravelMemoryDaySourceProjection,
} from './travel-memory-day-projections'
import type { MediaSeed, TravelSeed } from './seed-content'
import { presentationStyleForSlug } from '@/lib/travel-memory'
import type { TravelMemoryDay } from '@/payload/payload-types'

type TravelMemoryDayMoment = NonNullable<TravelMemoryDay['moments']>[number]
type TravelMemoryDayPlacement = NonNullable<TravelMemoryDayMoment['placements']>[number]

export type Phase19MemoryInventory = {
  id: number
  slug: string
  presentationStyle?: string | null
}

export type Phase19BackfillPlan = {
  styleUpdates: {
    id: number
    slug: string
    before: string | null
    after: string
  }[]
  dayCreates: Record<string, unknown>[]
  missingMemories: string[]
  missingMedia: string[]
  unassignedVideos: { slug: string; title?: string; youtubeUrl: string }[]
}

export function buildPhase19TravelMemoryBackfillPlan(input: {
  memories: Phase19MemoryInventory[]
  travels: TravelSeed[]
  mediaItems: MediaSeed[]
  mediaIdsBySourcePath: Map<string, number>
}): Phase19BackfillPlan {
  const memoriesBySlug = new Map(input.memories.map((memory) => [memory.slug, memory]))
  const completedTravels = input.travels.filter((travel) => travel.status === 'completed')
  const styleUpdates: Phase19BackfillPlan['styleUpdates'] = []
  const dayCreates: Record<string, unknown>[] = []
  const missingMemories: string[] = []
  const missingMedia: string[] = []
  const unassignedVideos: Phase19BackfillPlan['unassignedVideos'] = []

  for (const travel of completedTravels) {
    const memory = memoriesBySlug.get(travel.slug)
    if (!memory) {
      missingMemories.push(travel.slug)
      continue
    }

    const style = presentationStyleForSlug(travel.slug)
    if (style && memory.presentationStyle !== style) {
      styleUpdates.push({
        id: memory.id,
        slug: travel.slug,
        before: memory.presentationStyle ?? null,
        after: style,
      })
    }

    const projection = buildTravelMemoryDayProjections(travel, input.mediaItems)
    unassignedVideos.push(
      ...projection.unassignedVideos.map((video) => ({ slug: travel.slug, ...video })),
    )
    missingMedia.push(...projection.unmatchedMedia)

    for (const day of projection.days) {
      const materialized = materializeDay(day, memory.id, input.mediaIdsBySourcePath)
      dayCreates.push(materialized.data)
      missingMedia.push(...materialized.missingMedia)
    }
  }

  return {
    styleUpdates,
    dayCreates,
    missingMemories: [...new Set(missingMemories)].sort(),
    missingMedia: [...new Set(missingMedia)].sort(),
    unassignedVideos,
  }
}

function materializeDay(
  source: TravelMemoryDaySourceProjection,
  memoryId: number,
  mediaIdsBySourcePath: Map<string, number>,
) {
  const missingMedia: string[] = []
  const projection = buildTravelProjection({
    dayKey: source.dayKey,
    day: source.day,
    dateLabel: source.dateLabel,
    title: source.title,
    theme: source.theme,
    story: source.story,
    moments: source.moments.map((moment) => ({
      momentKey: moment.momentKey,
      time: moment.time,
      location: moment.location,
      title: moment.title,
      body: moment.body,
      placements: moment.placements.flatMap<TravelMemoryDayPlacement>((placement) => {
        if (placement.type === 'photo') {
          const sourcePath = placement.mediaSourcePath
          const mediaId = sourcePath ? mediaIdsBySourcePath.get(sourcePath) : undefined
          if (!sourcePath || !mediaId) {
            if (sourcePath) missingMedia.push(sourcePath)
            return []
          }
          return [{
            placementKey: placement.placementKey,
            type: 'photo',
            role: placement.role,
            media: mediaId,
            caption: placement.caption,
          }]
        }
        return [{
          placementKey: placement.placementKey,
          type: 'youtube',
          role: placement.role,
          youtubeUrl: placement.youtubeUrl,
          caption: placement.caption,
        }]
      }),
    })),
    meals: source.meals,
    lodging: source.lodging,
  })

  return {
    data: {
      memory: memoryId,
      dayIdentity: `${memoryId}:${source.dayKey}`,
      ...projection,
      _status: 'published',
      sourceMetadata: {
        parserVersion: 'phase-19-v1',
        sourceHash: travelProjectionHash(projection),
        baseProjection: projection,
      },
    },
    missingMedia,
  }
}
