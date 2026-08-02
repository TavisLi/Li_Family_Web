import type { Media, TravelMemory, TravelMemoryDay } from '@/payload/payload-types'

export const travelMemoryPresentationStyles = [
  'editorial-journal',
  'cinematic-timeline',
  'family-scrapbook',
] as const satisfies readonly NonNullable<TravelMemory['presentationStyle']>[]

export type TravelMemoryPresentationStyle =
  (typeof travelMemoryPresentationStyles)[number]

const presentationStyleSet = new Set<string>(travelMemoryPresentationStyles)

const initialPresentationStyles = {
  '201307-hainan': 'family-scrapbook',
  '202308-east-australia': 'cinematic-timeline',
  '202602-thailand-phuket': 'editorial-journal',
} as const satisfies Record<string, TravelMemoryPresentationStyle>

export type TravelMemoryOverviewDay = Pick<
  TravelMemoryDay,
  'date' | 'day' | 'dayKey' | 'theme' | 'title'
> & {
  heroMedia?: Media | null
}

export type TravelMemoryOverview = Pick<
  TravelMemory,
  | 'coverImage'
  | 'endDate'
  | 'isPrivate'
  | 'slug'
  | 'startDate'
  | 'summary'
  | 'title'
> & {
  presentationStyle: TravelMemoryPresentationStyle
  days: TravelMemoryOverviewDay[]
}

export type TravelMemoryDayView = {
  memory: TravelMemoryOverview
  day: TravelMemoryDay
  previousDay: Pick<TravelMemoryDay, 'dayKey' | 'title'> | null
  nextDay: Pick<TravelMemoryDay, 'dayKey' | 'title'> | null
}

type TravelMemoryMoment = NonNullable<TravelMemoryDay['moments']>[number]
type TravelMemoryPlacement = NonNullable<TravelMemoryMoment['placements']>[number]

export type TravelMemoryGalleryItem = Pick<
  TravelMemoryPlacement,
  'caption' | 'placementKey' | 'role'
> & {
  dayKey: TravelMemoryDay['dayKey']
  day: TravelMemoryDay['day']
  momentKey: TravelMemoryMoment['momentKey']
  location?: TravelMemoryMoment['location']
  time?: TravelMemoryMoment['time']
  media: Media
}

export type TravelMemoryGallery = {
  memory: TravelMemoryOverview
  selectedDayKey: string | null
  items: TravelMemoryGalleryItem[]
}

export function resolveTravelMemoryPresentationStyle(
  value: unknown,
): TravelMemoryPresentationStyle {
  return typeof value === 'string' && presentationStyleSet.has(value)
    ? (value as TravelMemoryPresentationStyle)
    : 'editorial-journal'
}

export function presentationStyleForSlug(
  slug: string,
): TravelMemoryPresentationStyle | null {
  return initialPresentationStyles[slug as keyof typeof initialPresentationStyles] ?? null
}

export function toTravelMemoryOverview(
  memory: TravelMemory,
  sourceDays: TravelMemoryDay[],
): TravelMemoryOverview {
  const days = sortDays(sourceDays)

  return {
    title: memory.title,
    slug: memory.slug,
    isPrivate: memory.isPrivate,
    startDate: memory.startDate,
    endDate: memory.endDate,
    summary: memory.summary,
    coverImage: memory.coverImage,
    presentationStyle: resolveTravelMemoryPresentationStyle(memory.presentationStyle),
    days: days.map((day) => ({
      title: day.title,
      dayKey: day.dayKey,
      day: day.day,
      date: day.date,
      theme: day.theme,
      heroMedia: firstPhoto(day),
    })),
  }
}

export function toTravelMemoryDayView(
  memory: TravelMemory,
  sourceDays: TravelMemoryDay[],
  dayKey: string,
): TravelMemoryDayView | null {
  const days = sortDays(sourceDays)
  const index = days.findIndex((day) => day.dayKey === dayKey)
  if (index < 0) return null

  return {
    memory: toTravelMemoryOverview(memory, days),
    day: days[index],
    previousDay: adjacentDay(days[index - 1]),
    nextDay: adjacentDay(days[index + 1]),
  }
}

export function toTravelMemoryGallery(
  memory: TravelMemory,
  sourceDays: TravelMemoryDay[],
  selectedDayKey?: string | null,
): TravelMemoryGallery {
  const days = sortDays(sourceDays)
  const selected = selectedDayKey && days.some((day) => day.dayKey === selectedDayKey)
    ? selectedDayKey
    : null
  const visibleDays = selected ? days.filter((day) => day.dayKey === selected) : days

  return {
    memory: toTravelMemoryOverview(memory, days),
    selectedDayKey: selected,
    items: visibleDays.flatMap((day) =>
      (day.moments ?? []).flatMap((moment) =>
        (moment.placements ?? []).flatMap((placement) => {
          if (
            placement.type !== 'photo' ||
            !placement.media ||
            typeof placement.media !== 'object'
          ) return []
          return [{
            placementKey: placement.placementKey,
            role: placement.role,
            caption: placement.caption,
            dayKey: day.dayKey,
            day: day.day,
            momentKey: moment.momentKey,
            location: moment.location,
            time: moment.time,
            media: placement.media,
          }]
        }),
      ),
    ),
  }
}

function sortDays(days: TravelMemoryDay[]): TravelMemoryDay[] {
  return [...days].sort((left, right) => left.day - right.day)
}

function firstPhoto(day: TravelMemoryDay): Media | null {
  for (const moment of day.moments ?? []) {
    for (const placement of moment.placements ?? []) {
      if (placement.type === 'photo' && typeof placement.media === 'object') {
        return placement.media
      }
    }
  }
  return null
}

function adjacentDay(
  day: TravelMemoryDay | undefined,
): Pick<TravelMemoryDay, 'dayKey' | 'title'> | null {
  return day ? { dayKey: day.dayKey, title: day.title } : null
}
