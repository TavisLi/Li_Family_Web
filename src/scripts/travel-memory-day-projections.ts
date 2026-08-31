import type { MediaSeed, TravelSeed } from './seed-content'

export type TravelMemoryPlacementSourceProjection = {
  placementKey: string
  type: 'photo' | 'youtube'
  role: 'inline'
  mediaSourcePath?: string
  youtubeUrl?: string
  caption?: string
}

export type TravelMemoryMomentSourceProjection = {
  momentKey: string
  time?: string
  location?: string
  title: string
  body?: string
  transport?: string
  placements: TravelMemoryPlacementSourceProjection[]
}

export type TravelMemoryDaySourceProjection = {
  dayKey: string
  day: number
  date: string
  dateLabel?: string
  title: string
  theme?: string
  story?: string
  moments: TravelMemoryMomentSourceProjection[]
  meals?: { breakfast?: string; lunch?: string; dinner?: string }
  lodging?: string
}

export type TravelMemoryDayProjectionResult = {
  days: TravelMemoryDaySourceProjection[]
  duplicatePlacements: string[]
  unmatchedMedia: string[]
  unassignedVideos: { title?: string; youtubeUrl: string }[]
}

export function buildTravelMemoryDayProjections(
  travel: TravelSeed,
  mediaItems: MediaSeed[],
): TravelMemoryDayProjectionResult {
  const itineraryMedia = mediaItems.filter(
    (item) =>
      item.ownerType === 'travel' &&
      item.ownerSlug === travel.slug &&
      item.usage === 'itinerary',
  )
  const validDays = new Set((travel.dailyItinerary ?? []).map((item) => item.day))
  const unmatchedMedia = itineraryMedia
    .filter((item) => !item.day || !item.sectionId || !validDays.has(item.day))
    .map((item) => item.sourcePath)
  const duplicatePlacements = duplicateValues(itineraryMedia.map((item) => item.sourcePath))

  const mediaByDay = new Map<number, MediaSeed[]>()
  for (const item of itineraryMedia) {
    if (!item.day || !item.sectionId || !validDays.has(item.day)) continue
    const items = mediaByDay.get(item.day) ?? []
    items.push(item)
    mediaByDay.set(item.day, items)
  }

  const videosByDay = new Map<number, NonNullable<TravelSeed['externalVideos']>>()
  const unassignedVideos: TravelMemoryDayProjectionResult['unassignedVideos'] = []
  for (const video of travel.externalVideos ?? []) {
    const day = dayFromDatedVideoTitle(video.title, travel.startDate)
    if (!day || !travel.dailyItinerary?.some((item) => item.day === day)) {
      unassignedVideos.push({ title: video.title, youtubeUrl: video.youtubeUrl })
      continue
    }
    const videos = videosByDay.get(day) ?? []
    videos.push(video)
    videosByDay.set(day, videos)
  }

  const days = (travel.dailyItinerary ?? []).map((sourceDay) => {
    const segmentMoments = (sourceDay.segments ?? []).map((segment, index) => ({
      momentKey: segmentMomentKey(segment.time, index),
      ...(segment.time ? { time: segment.time } : {}),
      title: segment.activity,
      ...(segment.notes ? { body: segment.notes } : {}),
      ...(segment.transport ? { transport: segment.transport } : {}),
      placements: [],
    }))

    const photoMoments = mediaMoments(mediaByDay.get(sourceDay.day) ?? [])
    const videos = videosByDay.get(sourceDay.day) ?? []
    const videoMoments: TravelMemoryMomentSourceProjection[] = videos.length
      ? [
          {
            momentKey: 'daily-videos',
            title: '當日影片',
            placements: videos.map((video) => ({
              placementKey: `youtube:${canonicalYouTubeIdentity(video.youtubeUrl)}`,
              type: 'youtube',
              role: 'inline',
              youtubeUrl: video.youtubeUrl,
              ...(video.title ? { caption: video.title } : {}),
            })),
          },
        ]
      : []

    return {
      dayKey: `day-${String(sourceDay.day).padStart(2, '0')}`,
      day: sourceDay.day,
      ...(sourceDay.dateLabel ? { dateLabel: sourceDay.dateLabel } : {}),
      date: dateForDay(travel.startDate, sourceDay.day),
      title: sourceDay.title,
      ...(sourceDay.theme ? { theme: sourceDay.theme } : {}),
      ...(sourceDay.story ? { story: sourceDay.story } : {}),
      moments: [...segmentMoments, ...photoMoments, ...videoMoments].sort(compareMoments),
      ...(sourceDay.meals ? { meals: sourceDay.meals } : {}),
      ...(sourceDay.lodging ? { lodging: sourceDay.lodging } : {}),
    }
  })

  return { days, duplicatePlacements, unmatchedMedia, unassignedVideos }
}

function duplicateValues(values: string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }
  return [...duplicates].sort()
}

function canonicalYouTubeIdentity(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([A-Za-z0-9_-]{6,})/)
  return match?.[1] ?? url
}

function dateForDay(startDate: string, day: number): string {
  const date = new Date(`${startDate.slice(0, 10)}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + day - 1)
  return date.toISOString()
}

function mediaMoments(media: MediaSeed[]): TravelMemoryMomentSourceProjection[] {
  const groups = new Map<string, MediaSeed[]>()
  for (const item of media) {
    if (!item.sectionId) continue
    const items = groups.get(item.sectionId) ?? []
    items.push(item)
    groups.set(item.sectionId, items)
  }

  return [...groups.entries()].map(([momentKey, items]) => {
    const ordered = [...items].sort(
      (left, right) => (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER),
    )
    const first = ordered[0]

    return {
      momentKey,
      ...(first.time ? { time: first.time } : {}),
      ...(first.location ? { location: first.location } : {}),
      title: first.location || first.caption || momentKey,
      placements: ordered.map((item) => ({
        placementKey: item.sourcePath,
        type: 'photo',
        role: 'inline',
        mediaSourcePath: item.sourcePath,
        ...(item.caption ? { caption: item.caption } : {}),
      })),
    }
  })
}

function segmentMomentKey(time: string | undefined, index: number): string {
  const normalizedTime = time
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return normalizedTime ? `itinerary-${normalizedTime}` : `itinerary-${index + 1}`
}

function dayFromDatedVideoTitle(title: string | undefined, startDate: string): number | null {
  const match = title?.match(/(?:^|\D)(20\d{2})(\d{2})(\d{2})(?:\D|$)/)
  if (!match) return null

  const videoDate = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  const [year, month, day] = startDate.slice(0, 10).split('-').map(Number)
  const tripStart = Date.UTC(year, month - 1, day)
  const difference = Math.floor((videoDate - tripStart) / 86_400_000)
  return difference >= 0 ? difference + 1 : null
}

function compareMoments(
  left: TravelMemoryMomentSourceProjection,
  right: TravelMemoryMomentSourceProjection,
): number {
  if (!left.time && !right.time) return left.momentKey.localeCompare(right.momentKey)
  if (!left.time) return 1
  if (!right.time) return -1
  return left.time.localeCompare(right.time)
}
