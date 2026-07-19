import type { TravelProjection } from './travel-seed-reconciliation'

type TravelLocale = 'en' | 'zh-TW'

type TravelSectionProjection = {
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

type TravelPlanProjection = TravelProjection & {
  slug: string
  planningSections?: TravelSectionProjection[]
}

type DailyHighlightProjection = {
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

type TravelMemoryProjection = TravelProjection & {
  slug: string
  dailyHighlights?: DailyHighlightProjection[]
  travelLedger?: {
    flights?: Record<string, unknown>[]
    lodgings?: Record<string, unknown>[]
  }
  storySections?: TravelSectionProjection[]
  externalVideos?: { title?: unknown; url: string }[]
}

export function buildTravelPlanProjection(value: Record<string, unknown>): TravelPlanProjection {
  if (typeof value.slug !== 'string' || !value.slug) {
    throw new Error('Travel Plan source 缺少 canonical slug。')
  }

  const projection: TravelPlanProjection = { slug: value.slug }
  copyFields(projection, value, [
    'title',
    'isPrivate',
    'startDate',
    'endDate',
    'summary',
    'coverImage',
    'members',
    '_status',
  ])

  if (Array.isArray(value.party) && value.party.length) {
    projection.guestParticipants = value.party.flatMap((participant) => {
      if (!isRecord(participant) || !hasValue(participant.name)) return []
      return [{ name: participant.name, note: participant.note }]
    })
  }

  if (Array.isArray(value.sourceSections) && value.sourceSections.length) {
    projection.planningSections = value.sourceSections.map((section) =>
      mapSection(section, 'Plan'),
    )
    assertUniqueAnchors(projection.planningSections, 'Plan')
  }

  return projection
}

export function buildTravelMemoryProjection(
  value: Record<string, unknown>,
): TravelMemoryProjection {
  if (typeof value.slug !== 'string' || !value.slug) {
    throw new Error('Travel Memory source 缺少 canonical slug。')
  }

  const projection: TravelMemoryProjection = { slug: value.slug }
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
    projection.storySections = value.sourceSections.map((section) =>
      mapSection(section, 'Memory'),
    )
    assertUniqueAnchors(projection.storySections, 'Memory')
  }

  const externalVideos = mapRecords(value.externalVideos, (video) => {
    if (typeof video.youtubeUrl !== 'string') {
      throw new Error('Travel Memory source 含有無法轉換的 external video。')
    }
    return {
      ...(hasValue(video.title) ? { title: video.title } : {}),
      url: video.youtubeUrl,
    }
  })
  if (externalVideos.length) projection.externalVideos = externalVideos

  const reminders = mapRecords(value.reminders, (reminder) => {
    if (!hasValue(reminder.category)) {
      throw new Error('Travel Memory source 含有無法轉換的 reminder。')
    }
    const items = mapRecords(reminder.items, (item) => {
      if (!hasValue(item.text)) {
        throw new Error('Travel Memory source 含有無法轉換的 reminder item。')
      }
      return { text: item.text }
    })
    return { category: reminder.category, ...(items.length ? { items } : {}) }
  })
  if (reminders.length) projection.reminders = reminders

  return projection
}

export function materializeTravelLocale<T>(value: T, locale: TravelLocale): T {
  return materializeValue(value, locale, []) as T
}

function mapSection(section: unknown, target: 'Memory' | 'Plan'): TravelSectionProjection {
  if (
    !isRecord(section) ||
    typeof section.level !== 'number' ||
    typeof section.anchor !== 'string' ||
    !hasValue(section.title) ||
    !hasValue(section.body)
  ) {
    throw new Error(`Travel ${target} source 含有無法轉換的 section。`)
  }

  const mapped: TravelSectionProjection = {
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

function mapDailyHighlight(day: Record<string, unknown>): DailyHighlightProjection {
  if (!hasValue(day.title)) {
    throw new Error('Travel Memory source 含有無法轉換的 daily itinerary。')
  }
  const mapped: DailyHighlightProjection = { title: day.title }
  copyFields(mapped, day, ['day', ['date', 'dateLabel'], 'theme', 'lodging'])

  const segments = mapRecords(day.segments, (segment) => {
    if (!hasValue(segment.activity)) {
      throw new Error('Travel Memory source 含有無法轉換的 itinerary segment。')
    }
    return pickRecord(segment, [
      ['activity', 'activity'],
      ['time', 'time'],
      ['transport', 'transport'],
      ['notes', 'notes'],
    ]) as NonNullable<DailyHighlightProjection['segments']>[number]
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

function mapRecords<T>(
  value: unknown,
  mapper: (record: Record<string, unknown>) => T | undefined,
): T[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!isRecord(item)) return []
    const mapped = mapper(item)
    return mapped === undefined ? [] : [mapped]
  })
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

function materializeValue(value: unknown, locale: TravelLocale, path: string[]): unknown {
  if (path.join('.') === 'sourceMetadata.baseProjection') return value
  if (Array.isArray(value)) return value.map((item) => materializeValue(item, locale, path))
  if (!isRecord(value)) return value
  if (isLocalizedValue(value)) {
    return materializeValue(value[locale] ?? value['zh-TW'] ?? value.en, locale, path)
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [
      key,
      materializeValue(nested, locale, [...path, key]),
    ]),
  )
}

function isLocalizedValue(value: Record<string, unknown>): boolean {
  const keys = Object.keys(value)
  return keys.length > 0 && keys.every((key) => key === 'zh-TW' || key === 'en')
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
