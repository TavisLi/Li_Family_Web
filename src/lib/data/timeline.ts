import 'server-only'

import type { TimelineEvent } from '@/payload/payload-types'
import { getFamilySession, userReq, type FamilySession } from './auth'
import { getPayloadClient } from './payload'
import { groupTimelineEventsByYear, type TimelineYearGroup } from './phase-7-domain'

const TIMELINE_PAGE_LIMIT = 8
const TIMELINE_YEAR_LIMIT = 80

export type TimelineIndexData = {
  events: TimelineEvent[]
  groups: TimelineYearGroup<TimelineEvent>[]
  familySession: FamilySession
  hasNextPage: boolean
  page: number
  selectedYear?: number
  totalPages: number
  yearOptions: number[]
}

export async function getTimelineIndex(options: {
  year?: number
  page?: number
  limit?: number
} = {}): Promise<TimelineIndexData> {
  const familySession = await getFamilySession()
  const payload = await getPayloadClient()
  const page = options.page ?? 1
  const limit = options.limit ?? TIMELINE_PAGE_LIMIT
  const where = options.year
    ? {
        year: {
          equals: options.year,
        },
      }
    : undefined

  const [eventsResult, yearsResult] = await Promise.all([
    payload.find({
      collection: 'timeline-events',
      depth: 2,
      limit,
      overrideAccess: false,
      page,
      pagination: true,
      sort: '-eventDate',
      where,
      ...userReq(familySession.user),
    }),
    payload.find({
      collection: 'timeline-events',
      depth: 0,
      limit: TIMELINE_YEAR_LIMIT,
      overrideAccess: false,
      pagination: false,
      sort: '-year',
      ...userReq(familySession.user),
    }),
  ])

  return {
    events: eventsResult.docs,
    groups: groupTimelineEventsByYear(eventsResult.docs, {
      includePrivate: familySession.isFamilyMode,
    }),
    familySession,
    hasNextPage: Boolean(eventsResult.hasNextPage),
    page,
    selectedYear: options.year,
    totalPages: eventsResult.totalPages || 1,
    yearOptions: uniqueYears(yearsResult.docs),
  }
}

export async function getTimelineHomeWidget(
  familySession: FamilySession,
): Promise<TimelineEvent | null> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'timeline-events',
    depth: 1,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    sort: '-eventDate',
    ...userReq(familySession.user),
  })

  return result.docs[0] ?? null
}

function uniqueYears(events: Pick<TimelineEvent, 'year'>[]): number[] {
  return [...new Set(events.map((event) => event.year))].sort((left, right) => right - left)
}
