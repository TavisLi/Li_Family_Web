export type TimelineEventLike = {
  id: number
  title: string
  eventDate: string
  year: number
  isPrivate?: boolean | null
}

export type TimelineYearGroup<T extends TimelineEventLike> = {
  year: number
  events: T[]
}

export type BucketStatus = 'pool' | 'in-progress' | 'completed'

export type BucketItemLike = {
  id: number
  title: string
  status: BucketStatus
  priority?: number | null
}

export type BucketColumnSummary = Record<BucketStatus, number>

export type WrappedAvailabilityInput = {
  currentDate: Date
  snapshot:
    | {
        year: number
        status: 'draft' | 'published'
        publishedAt?: string | null
      }
    | null
    | undefined
}

export type BucketCompletionInput = {
  bucketId: number
  title: string
  description?: string | null
  completedAt: string
  isPrivate?: boolean | null
}

export type BucketCompletionTimelineEvent = {
  title: string
  slug: string
  eventDate: string
  year: number
  summary: string
  description: string
  sourceType: 'bucket-item'
  isPrivate: boolean
  sortOrder: number
}

export function groupTimelineEventsByYear<T extends TimelineEventLike>(
  events: T[],
  options: {
    includePrivate: boolean
  },
): TimelineYearGroup<T>[] {
  const groups = events
    .filter((event) => options.includePrivate || !event.isPrivate)
    .reduce<Map<number, T[]>>((map, event) => {
      const current = map.get(event.year) ?? []
      current.push(event)
      map.set(event.year, current)

      return map
    }, new Map())

  return [...groups.entries()]
    .sort(([leftYear], [rightYear]) => rightYear - leftYear)
    .map(([year, groupEvents]) => ({
      year,
      events: groupEvents.sort((left, right) => compareDateDesc(left.eventDate, right.eventDate)),
    }))
}

export function summarizeBucketColumns(items: BucketItemLike[]): BucketColumnSummary {
  return items.reduce<BucketColumnSummary>(
    (summary, item) => ({
      ...summary,
      [item.status]: summary[item.status] + 1,
    }),
    {
      pool: 0,
      'in-progress': 0,
      completed: 0,
    },
  )
}

export function isWrappedAvailable({
  currentDate,
  snapshot,
}: WrappedAvailabilityInput): boolean {
  if (!snapshot || snapshot.status !== 'published' || !snapshot.publishedAt) {
    return false
  }

  const month = currentDate.getUTCMonth()
  const publishedAt = new Date(snapshot.publishedAt)

  return month === 11 && publishedAt.getTime() <= currentDate.getTime()
}

export function buildBucketCompletionTimelineEvent(
  input: BucketCompletionInput,
): BucketCompletionTimelineEvent {
  const completedAt = new Date(input.completedAt)
  const isoDate = completedAt.toISOString()
  const summary = input.description?.trim() || '這個願望已被家人一起完成，正式收進時空膠囊。'

  return {
    title: `完成願望：${input.title}`,
    slug: `bucket-${input.bucketId}-${isoDate.slice(0, 10)}`,
    eventDate: isoDate,
    year: completedAt.getUTCFullYear(),
    summary,
    description: summary,
    sourceType: 'bucket-item',
    isPrivate: input.isPrivate ?? true,
    sortOrder: 0,
  }
}

function compareDateDesc(left: string, right: string): number {
  return new Date(right).getTime() - new Date(left).getTime()
}
