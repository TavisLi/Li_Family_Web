import {
  buildTravelProjection,
  reconcileTravelSeed,
  travelProjectionHash,
  type TravelProjection,
  type TravelReconciliationPlan,
} from './travel-seed-reconciliation'
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
  dayPlans: TravelReconciliationPlan[]
  dayCreates: Record<string, unknown>[]
  dayUpdates: { id: number; patch: TravelProjection }[]
  missingMemories: string[]
  missingMedia: string[]
  duplicatePlacements: string[]
  unassignedVideos: { slug: string; title?: string; youtubeUrl: string }[]
}

export type Phase19DayInventory = Record<string, unknown> & {
  id: number
  dayIdentity: string
  sourceMetadata?: { baseProjection?: unknown } | null
}

export function buildPhase19TravelMemoryBackfillPlan(input: {
  memories: Phase19MemoryInventory[]
  travels: TravelSeed[]
  mediaItems: MediaSeed[]
  mediaIdsBySourcePath: Map<string, number>
  currentDays: Phase19DayInventory[]
  mode?: 'payload-wins' | 'safe' | 'source-wins'
}): Phase19BackfillPlan {
  const memoriesBySlug = new Map(input.memories.map((memory) => [memory.slug, memory]))
  const completedTravels = input.travels.filter((travel) => travel.status === 'completed')
  const styleUpdates: Phase19BackfillPlan['styleUpdates'] = []
  const dayCreates: Record<string, unknown>[] = []
  const dayUpdates: Phase19BackfillPlan['dayUpdates'] = []
  const dayPlans: TravelReconciliationPlan[] = []
  const missingMemories: string[] = []
  const missingMedia: string[] = []
  const unassignedVideos: Phase19BackfillPlan['unassignedVideos'] = []
  const duplicatePlacements: string[] = []
  const currentDaysByIdentity = new Map(
    input.currentDays.map((day) => [day.dayIdentity, day]),
  )

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
    duplicatePlacements.push(...projection.duplicatePlacements)

    for (const day of projection.days) {
      const materialized = materializeDay(day, memory.id, input.mediaIdsBySourcePath)
      const dayIdentity = `${memory.id}:${day.dayKey}`
      const currentDay = currentDaysByIdentity.get(dayIdentity)
      const plan = reconcileTravelSeed({
        slug: dayIdentity,
        base: asProjection(currentDay?.sourceMetadata?.baseProjection),
        source: materialized.projection,
        current: currentDay ? dayProjection(currentDay) : undefined,
        mode: input.mode,
      })
      dayPlans.push(plan)

      if (plan.action === 'create') {
        dayCreates.push(materialized.data)
      } else if (plan.action === 'apply-source' && currentDay) {
        dayUpdates.push({
          id: currentDay.id,
          patch: {
            ...plan.patch,
            sourceMetadata: materialized.data.sourceMetadata,
          },
        })
      }
      missingMedia.push(...materialized.missingMedia)
    }
  }

  return {
    styleUpdates,
    dayPlans,
    dayCreates,
    dayUpdates,
    missingMemories: [...new Set(missingMemories)].sort(),
    missingMedia: [...new Set(missingMedia)].sort(),
    duplicatePlacements: [...new Set(duplicatePlacements)].sort(),
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
    date: source.date,
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
      transport: moment.transport,
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
    projection,
  }
}

function dayProjection(day: Record<string, unknown>): TravelProjection {
  return buildTravelProjection({
    dayKey: day.dayKey,
    day: day.day,
    date: day.date,
    dateLabel: day.dateLabel,
    title: day.title,
    theme: day.theme,
    story: day.story,
    moments: day.moments,
    meals: day.meals,
    lodging: day.lodging,
  })
}

function asProjection(value: unknown): TravelProjection | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? buildTravelProjection(value as TravelProjection)
    : undefined
}
