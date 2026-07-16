import type { TravelProject } from '@/payload/payload-types'
import type { TravelSeed } from './seed-content'
import {
  buildTravelProjection,
  travelProjectionHash,
  type TravelProjection,
} from './travel-seed-reconciliation'

const unsupportedMemoryFields = [
  'railSegments',
  'cabinAssignments',
  'foodRecommendations',
  'costItems',
  'optionalActivities',
] as const

type MemorySectionCopy = {
  level: number
  title: unknown
  anchor: string
  displayDay?: unknown
  displayDate?: unknown
  displaySubtitle?: unknown
  body: unknown
  links?: { label?: unknown; url: string }[]
  mediaItems?: unknown[]
  interactions: {
    commentsEnabled: boolean
    thumbsUpEnabled: boolean
    thumbsDownEnabled: boolean
  }
}

type DailyHighlightCopy = {
  day?: number
  dateLabel?: unknown
  title: unknown
  theme?: unknown
  segments?: {
    time?: unknown
    activity: unknown
    transport?: unknown
    notes?: unknown
  }[]
  meals?: { breakfast?: unknown; lunch?: unknown; dinner?: unknown }
  lodging?: unknown
}

type MemoryProjection = TravelProjection & {
  slug: string
  dailyHighlights?: DailyHighlightCopy[]
  travelLedger?: {
    flights?: Record<string, unknown>[]
    lodgings?: Record<string, unknown>[]
  }
  storySections?: MemorySectionCopy[]
  externalVideos?: { title?: unknown; url: string }[]
}

export type TravelMemoryCopyDraft = {
  data: MemoryProjection & {
    sourceMetadata: {
      sourceFile: string
      sourceHash: string
      parserVersion: 'phase-17-memory-v1'
      baseProjection: MemoryProjection
    }
  }
  baseProjection: MemoryProjection
  expectedSourceHash: string
}

export function buildTravelMemoryCopyDraft(
  project: TravelProject,
  source: TravelSeed,
): TravelMemoryCopyDraft {
  if (project.status !== 'completed') {
    throw new Error('Travel Memory copy draft requires a completed TravelProject.')
  }

  const legacyBase = project.sourceMetadata?.baseProjection
  if (!isRecord(legacyBase)) {
    throw new Error('舊 Memory 缺少可轉換的 Base projection。')
  }

  const sourceFile = project.sourceMetadata?.sourceFile ?? project.externalDocIdentifier
  if (!sourceFile) {
    throw new Error('舊 Memory 缺少 source file identity。')
  }
  if (source.slug !== project.slug) {
    throw new Error('Memory Source slug 與 Payload Current 不一致。')
  }
  if (source.externalDocIdentifier !== sourceFile) {
    throw new Error('Memory Source file identity 與舊 migration evidence 不一致。')
  }

  assertNoUnsupportedMemoryFields(project as unknown as Record<string, unknown>, 'Current')
  assertNoUnsupportedMemoryFields(legacyBase, 'Base')
  assertNoUnsupportedMemoryFields(source as unknown as Record<string, unknown>, 'Source')

  const currentProjection = buildMemoryProjection(project as unknown as Record<string, unknown>)
  const baseProjection = buildTravelProjection(
    buildMemoryProjection(legacyBase),
  ) as MemoryProjection
  const liveSourceProjection = buildTravelProjection(
    buildMemoryProjection(source as unknown as Record<string, unknown>),
  ) as MemoryProjection

  if (
    JSON.stringify(comparableMemorySource(baseProjection)) !==
    JSON.stringify(comparableMemorySource(liveSourceProjection))
  ) {
    throw new Error('Memory Source 已相對舊 Base 改變；必須先重新執行 reconciliation。')
  }

  const expectedSourceHash = travelProjectionHash(baseProjection)
  return {
    data: {
      ...currentProjection,
      sourceMetadata: {
        sourceFile,
        sourceHash: expectedSourceHash,
        parserVersion: 'phase-17-memory-v1',
        baseProjection,
      },
    },
    baseProjection,
    expectedSourceHash,
  }
}

function buildMemoryProjection(value: Record<string, unknown>): MemoryProjection {
  if (typeof value.slug !== 'string' || !value.slug) {
    throw new Error('舊 Memory 缺少 canonical slug。')
  }

  const projection: MemoryProjection = { slug: value.slug }
  copyFields(projection, value, [
    'title',
    'isPrivate',
    'startDate',
    'endDate',
    'summary',
    'coverImage',
    'galleryImages',
    'itineraryImages',
    '_status',
  ])

  if (Array.isArray(value.members) && value.members.length) {
    projection.participants = value.members
  }
  if (Array.isArray(value.party) && value.party.length) {
    projection.guestParticipants = value.party.flatMap((participant) => {
      if (!isRecord(participant) || !hasValue(participant.name)) return []
      return [{ name: participant.name, note: participant.note }]
    })
  }

  const flights = mapRecords(value.flights, (flight) =>
    pickRecord(flight, [
      ['date', 'dateLabel'],
      ['airline', 'airline'],
      ['flightNumber', 'flightNumber'],
      ['route', 'route'],
      ['passengers', 'passengers'],
      ['departureTime', 'departureTime'],
      ['arrivalTime', 'arrivalTime'],
      ['terminal', 'terminal'],
      ['notes', 'notes'],
    ]),
  )
  const lodgings = mapRecords(value.lodgings, (lodging) =>
    pickRecord(lodging, [
      ['dateRange', 'dateRange'],
      ['hotel', 'hotel'],
      ['city', 'city'],
      ['address', 'address'],
      ['roomType', 'roomType'],
      ['bookingChannel', 'bookingChannel'],
      ['price', 'price'],
      ['highlights', 'highlights'],
    ]),
  )
  if (flights.length || lodgings.length) {
    projection.travelLedger = {
      ...(flights.length ? { flights } : {}),
      ...(lodgings.length ? { lodgings } : {}),
    }
  }

  const dailyHighlights = mapRecords(value.dailyItinerary, mapDailyHighlight)
  if (dailyHighlights.length) projection.dailyHighlights = dailyHighlights

  if (Array.isArray(value.sourceSections) && value.sourceSections.length) {
    projection.storySections = value.sourceSections.map(mapMemorySection)
    assertUniqueAnchors(projection.storySections, 'Memory')
  }

  const externalVideos = mapRecords(value.externalVideos, (video) => {
    if (typeof video.youtubeUrl !== 'string') {
      throw new Error('舊 Memory 含有無法轉換的 external video。')
    }
    return {
      ...(hasValue(video.title) ? { title: video.title } : {}),
      url: video.youtubeUrl,
    }
  })
  if (externalVideos.length) projection.externalVideos = externalVideos

  const reminders = mapRecords(value.reminders, (reminder) => {
    if (!hasValue(reminder.category)) {
      throw new Error('舊 Memory 含有無法轉換的 reminder。')
    }
    const items = mapRecords(reminder.items, (item) => {
      if (!hasValue(item.text)) {
        throw new Error('舊 Memory 含有無法轉換的 reminder item。')
      }
      return { text: item.text }
    })
    return { category: reminder.category, ...(items.length ? { items } : {}) }
  })
  if (reminders.length) projection.reminders = reminders

  return projection
}

function assertNoUnsupportedMemoryFields(
  value: Record<string, unknown>,
  sourceLabel: 'Base' | 'Current' | 'Source',
) {
  const unsupported = unsupportedMemoryFields.filter((field) => hasValue(value[field]))
  if (unsupported.length) {
    throw new Error(
      `Memory ${sourceLabel} 含有目標 schema 尚未承接的欄位：${unsupported.join(', ')}。`,
    )
  }
}

function assertUniqueAnchors(
  sections: readonly { anchor: string }[],
  targetLabel: 'Memory' | 'Plan',
) {
  const anchors = new Set<string>()
  for (const section of sections) {
    if (anchors.has(section.anchor)) {
      throw new Error(`${targetLabel} sections 含有重複 anchor：${section.anchor}。`)
    }
    anchors.add(section.anchor)
  }
}

function mapDailyHighlight(day: Record<string, unknown>): DailyHighlightCopy {
  if (!hasValue(day.title)) {
    throw new Error('舊 Memory 含有無法轉換的 daily itinerary。')
  }
  const mapped: DailyHighlightCopy = { title: day.title }
  copyFields(mapped, day, ['day', ['date', 'dateLabel'], 'theme', 'lodging'])

  const segments = mapRecords(day.segments, (segment) => {
    if (!hasValue(segment.activity)) {
      throw new Error('舊 Memory 含有無法轉換的 itinerary segment。')
    }
    return pickRecord(segment, [
      ['activity', 'activity'],
      ['time', 'time'],
      ['transport', 'transport'],
      ['notes', 'notes'],
    ]) as NonNullable<DailyHighlightCopy['segments']>[number]
  })
  if (segments.length) mapped.segments = segments

  if (isRecord(day.meals)) {
    const meals = pickRecord(day.meals, [
      ['breakfast', 'breakfast'],
      ['lunch', 'lunch'],
      ['dinner', 'dinner'],
    ])
    if (hasValue(meals)) mapped.meals = meals
  }
  return mapped
}

function mapMemorySection(section: unknown): MemorySectionCopy {
  if (
    !isRecord(section) ||
    typeof section.level !== 'number' ||
    typeof section.anchor !== 'string' ||
    !hasValue(section.title) ||
    !hasValue(section.body)
  ) {
    throw new Error('舊 Memory 含有無法轉換的 source section。')
  }

  const mapped: MemorySectionCopy = {
    level: section.level,
    title: section.title,
    anchor: section.anchor,
    body: section.body,
    interactions: {
      commentsEnabled: section.enableComments !== false,
      thumbsUpEnabled: section.enableThumbsUp !== false,
      thumbsDownEnabled: section.enableThumbsDown !== false,
    },
  }
  copyFields(mapped, section, ['displayDay', 'displayDate', 'displaySubtitle'])

  const links = mapRecords(section.links, (link) => {
    if (typeof link.url !== 'string') return undefined
    return { ...(hasValue(link.label) ? { label: link.label } : {}), url: link.url }
  })
  if (links.length) mapped.links = links
  if (Array.isArray(section.mediaItems) && section.mediaItems.length) {
    mapped.mediaItems = section.mediaItems
  }
  return mapped
}

function comparableMemorySource(projection: MemoryProjection): TravelProjection {
  const comparable = { ...projection }
  delete comparable.coverImage
  delete comparable.galleryImages
  delete comparable.itineraryImages
  delete comparable.participants
  delete comparable._status
  if (comparable.storySections) {
    comparable.storySections = comparable.storySections.map(
      ({ mediaItems: _mediaItems, ...section }) => section,
    )
  }
  return buildTravelProjection(comparable)
}

type FieldMapping = string | readonly [source: string, target: string]

function copyFields(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  fields: readonly FieldMapping[],
) {
  for (const field of fields) {
    const [sourceName, targetName] = typeof field === 'string' ? [field, field] : field
    if (hasValue(source[sourceName]) || typeof source[sourceName] === 'boolean') {
      target[targetName] = source[sourceName]
    }
  }
}

function pickRecord(
  source: Record<string, unknown>,
  fields: readonly (readonly [source: string, target: string])[],
): Record<string, unknown> {
  const target: Record<string, unknown> = {}
  copyFields(target, source, fields)
  return target
}

function mapRecords<T>(value: unknown, mapper: (record: Record<string, unknown>) => T | undefined): T[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!isRecord(item)) return []
    const mapped = mapper(item)
    return mapped === undefined ? [] : [mapped]
  })
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false
  if (Array.isArray(value)) return value.some(hasValue)
  if (typeof value === 'object') return Object.values(value).some(hasValue)
  return true
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
