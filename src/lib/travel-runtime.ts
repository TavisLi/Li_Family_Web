import type {
  HomeConfig,
  Media,
  TravelMemory,
  TravelPlan,
  User,
} from '@/payload/payload-types'

export type TravelRuntimeSection = {
  level: number
  title: string
  anchor: string
  displayDay?: string | null
  displayDate?: string | null
  displaySubtitle?: string | null
  body: string
  links?:
    | {
        label: string
        url: string
        id?: string | null
      }[]
    | null
  mediaItems?: (number | Media)[] | null
  enableComments?: boolean | null
  enableThumbsUp?: boolean | null
  enableThumbsDown?: boolean | null
  id?: string | null
}

type TravelRuntimeDailyHighlight = Omit<
  NonNullable<TravelMemory['dailyHighlights']>[number],
  'day'
> & {
  day: number
}

type TravelRuntimeFlight = NonNullable<
  NonNullable<TravelMemory['travelLedger']>['flights']
>[number]

type TravelRuntimeLodging = NonNullable<
  NonNullable<TravelMemory['travelLedger']>['lodgings']
>[number] & {
  dateRange?: string | null
}

type TravelRuntimeBase = {
  id: string
  sourceId: number
  title: string
  slug: string
  isPrivate?: boolean | null
  startDate: string
  endDate: string
  summary?: string | null
  externalDocIdentifier?: string | null
  originPlan?: {
    collection: 'travel-plans'
    sourceId: number
  } | null
  coverImage?: (number | null) | Media
  members?: (number | User)[] | null
  party?:
    | {
        name: string
        note?: string | null
        id?: string | null
      }[]
    | null
  sourceSections?: TravelRuntimeSection[] | null
  galleryImages?: (number | Media)[] | null
  itineraryImages?: (number | Media)[] | null
  dailyItinerary?: TravelRuntimeDailyHighlight[] | null
  flights?: TravelRuntimeFlight[] | null
  lodgings?: TravelRuntimeLodging[] | null
  externalVideos?:
    | {
        title: string
        youtubeUrl: string
        id?: string | null
      }[]
    | null
}

export type TravelRuntimeRecord = TravelRuntimeBase &
  (
    | {
        collection: 'travel-plans'
        kind: 'plan'
        status: 'planning'
      }
    | {
        collection: 'travel-memories'
        kind: 'memory'
        status: 'completed'
      }
  )

export function mergeTravelRuntimeRecords(
  plans: TravelPlan[],
  memories: TravelMemory[],
  limit: number,
): TravelRuntimeRecord[] {
  return [
    ...plans.map((plan) => toTravelRuntimeRecord('travel-plans', plan)),
    ...memories.map((memory) => toTravelRuntimeRecord('travel-memories', memory)),
  ]
    .sort((left, right) => right.startDate.localeCompare(left.startDate))
    .slice(0, limit)
}

export function resolveTravelRuntimeRelationship(
  relationship: HomeConfig['featuredTravelRecord'],
  records: TravelRuntimeRecord[],
): TravelRuntimeRecord | null {
  if (!relationship) return null
  const sourceId =
    typeof relationship.value === 'object' ? relationship.value.id : relationship.value

  return (
    records.find(
      (record) =>
        record.collection === relationship.relationTo &&
        record.sourceId === sourceId,
    ) ?? null
  )
}

export function toTravelRuntimeRecord(
  collection: 'travel-plans',
  record: TravelPlan,
): TravelRuntimeRecord
export function toTravelRuntimeRecord(
  collection: 'travel-memories',
  record: TravelMemory,
): TravelRuntimeRecord
export function toTravelRuntimeRecord(
  collection: 'travel-plans' | 'travel-memories',
  record: TravelPlan | TravelMemory,
): TravelRuntimeRecord {
  if (collection === 'travel-memories') {
    const memory = record as TravelMemory

    return {
      id: `${collection}:${memory.id}`,
      sourceId: memory.id,
      collection,
      kind: 'memory',
      status: 'completed',
      title: memory.title,
      slug: memory.slug,
      isPrivate: memory.isPrivate,
      startDate: memory.startDate,
      endDate: memory.endDate,
      summary: memory.summary,
      externalDocIdentifier: memory.sourceMetadata?.sourceFile,
      originPlan: memory.originPlan
        ? {
            collection: 'travel-plans',
            sourceId:
              typeof memory.originPlan === 'object'
                ? memory.originPlan.id
                : memory.originPlan,
          }
        : null,
      coverImage: memory.coverImage,
      members: memory.participants,
      party: memory.guestParticipants,
      sourceSections: runtimeSections(memory.storySections),
      galleryImages: memory.galleryImages,
      itineraryImages: memory.itineraryImages,
      dailyItinerary: memory.dailyHighlights?.map((highlight, index) => ({
        ...highlight,
        day: highlight.day ?? index + 1,
      })),
      flights: memory.travelLedger?.flights,
      lodgings: memory.travelLedger?.lodgings?.map((lodging) => ({
        ...lodging,
        dateRange: lodging.dateRange || dateRange(lodging.startDate, lodging.endDate),
      })),
      externalVideos: memory.externalVideos?.map((video) => ({
        title: video.title || 'Travel video',
        youtubeUrl: video.url,
        id: video.id,
      })),
    }
  }

  const plan = record as TravelPlan

  return {
    id: `${collection}:${plan.id}`,
    sourceId: plan.id,
    collection,
    kind: 'plan',
    status: 'planning',
    title: plan.title,
    slug: plan.slug,
    isPrivate: plan.isPrivate,
    startDate: plan.startDate,
    endDate: plan.endDate,
    summary: plan.summary,
    externalDocIdentifier: plan.sourceMetadata?.sourceFile,
    coverImage: plan.coverImage,
    members: plan.members,
    party: plan.guestParticipants,
    sourceSections: runtimeSections(plan.planningSections),
  }
}

function runtimeSections(
  sections: TravelPlan['planningSections'] | TravelMemory['storySections'],
): TravelRuntimeSection[] | undefined {
  return sections?.map((section) => ({
    level: section.level,
    title: section.title,
    anchor: section.anchor,
    ...(section.displayDay !== undefined ? { displayDay: section.displayDay } : {}),
    ...(section.displayDate !== undefined ? { displayDate: section.displayDate } : {}),
    ...(section.displaySubtitle !== undefined
      ? { displaySubtitle: section.displaySubtitle }
      : {}),
    body: section.body,
    links: section.links?.map((link) => ({
      label: link.label || link.url,
      url: link.url,
      id: link.id,
    })),
    mediaItems: section.mediaItems,
    enableComments: section.interactions?.commentsEnabled,
    enableThumbsUp: section.interactions?.thumbsUpEnabled,
    enableThumbsDown: section.interactions?.thumbsDownEnabled,
    id: section.id,
  }))
}

function dateRange(startDate: string | null | undefined, endDate: string | null | undefined) {
  if (startDate && endDate) return `${startDate} - ${endDate}`

  return startDate || endDate || null
}
