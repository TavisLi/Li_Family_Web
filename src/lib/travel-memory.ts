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

export type TravelMemoryDaySummary = Pick<TravelMemoryDay, 'day' | 'dayKey' | 'title'>
type TravelMemoryOverviewDaySource = Pick<
  TravelMemoryDay,
  'date' | 'day' | 'dayKey' | 'theme' | 'title'
> & Partial<Pick<TravelMemoryDay, 'moments'>>

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

export type TravelMemorySource = Pick<
  TravelMemory,
  | 'coverImage'
  | 'endDate'
  | 'isPrivate'
  | 'presentationStyle'
  | 'slug'
  | 'startDate'
  | 'summary'
  | 'title'
> & {
  galleryImages?: TravelMemory['galleryImages']
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
  dayKey: TravelMemoryDay['dayKey'] | null
  day: TravelMemoryDay['day'] | null
  momentKey: TravelMemoryMoment['momentKey'] | null
  location?: TravelMemoryMoment['location']
  time?: TravelMemoryMoment['time']
  media: Media
  unclassified: boolean
}

export type TravelMemoryGallery = {
  memory: TravelMemoryOverview
  selectedDayKey: string | null
  selectedLocation: string | null
  locations: string[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  items: TravelMemoryGalleryItem[]
}

type TravelMemoryGalleryFilters = {
  dayKey?: string | null
  location?: string | null
  page?: number
  pageSize?: number
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
  memory: TravelMemorySource,
  sourceDays: TravelMemoryOverviewDaySource[],
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
  memory: TravelMemorySource,
  day: TravelMemoryDay,
  navigationDays: TravelMemoryDaySummary[],
): TravelMemoryDayView | null {
  const days = sortDays(navigationDays)
  const index = days.findIndex((item) => item.dayKey === day.dayKey)
  if (index < 0) return null

  return {
    memory: toTravelMemoryOverview(memory, days),
    day,
    previousDay: adjacentDay(days[index - 1]),
    nextDay: adjacentDay(days[index + 1]),
  }
}

export function toTravelMemoryGallery(
  memory: TravelMemorySource,
  sourceDays: TravelMemoryDay[],
  filters: TravelMemoryGalleryFilters = {},
): TravelMemoryGallery {
  const days = sortDays(sourceDays)
  const selectedDayKey = filters.dayKey && days.some((day) => day.dayKey === filters.dayKey)
    ? filters.dayKey
    : null
  const classifiedItems = days.flatMap((day) =>
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
          unclassified: false,
        } satisfies TravelMemoryGalleryItem]
      }),
    ),
  )
  const classifiedMediaIds = new Set(classifiedItems.map((item) => item.media.id))
  const unclassifiedItems = (memory.galleryImages ?? []).flatMap((item) => {
    if (typeof item !== 'object' || classifiedMediaIds.has(item.id)) return []
    return [{
      placementKey: `gallery:${item.id}`,
      role: 'gallery',
      caption: item.altText,
      dayKey: null,
      day: null,
      momentKey: null,
      media: item,
      unclassified: true,
    } satisfies TravelMemoryGalleryItem]
  })
  const allItems: TravelMemoryGalleryItem[] = [...classifiedItems, ...unclassifiedItems]
  const locations = [...new Set(
    classifiedItems.flatMap((item) => item.location ? [item.location] : []),
  )].sort((left, right) => left.localeCompare(right, 'zh-Hant'))
  const selectedLocation = filters.location && locations.includes(filters.location)
    ? filters.location
    : null
  const filteredItems = allItems.filter((item) =>
    (!selectedDayKey || item.dayKey === selectedDayKey) &&
    (!selectedLocation || item.location === selectedLocation),
  )
  const pageSize = Math.min(Math.max(filters.pageSize ?? 24, 1), 60)
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize))
  const page = Math.min(Math.max(filters.page ?? 1, 1), totalPages)
  const offset = (page - 1) * pageSize

  return {
    memory: toTravelMemoryOverview(memory, days),
    selectedDayKey,
    selectedLocation,
    locations,
    page,
    pageSize,
    totalItems: filteredItems.length,
    totalPages,
    items: filteredItems.slice(offset, offset + pageSize),
  }
}

function sortDays<T extends { day: number }>(days: T[]): T[] {
  return [...days].sort((left, right) => left.day - right.day)
}

function firstPhoto(day: TravelMemoryOverviewDaySource): Media | null {
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
  day: TravelMemoryDaySummary | undefined,
): Pick<TravelMemoryDay, 'dayKey' | 'title'> | null {
  return day ? { dayKey: day.dayKey, title: day.title } : null
}
