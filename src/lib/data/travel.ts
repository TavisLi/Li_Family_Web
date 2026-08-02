import 'server-only'

import type { HomeConfig, User } from '@/payload/payload-types'
import {
  toTravelMemoryDayView,
  toTravelMemoryGallery,
  toTravelMemoryOverview,
  type TravelMemoryDayView,
  type TravelMemoryGallery,
  type TravelMemoryOverview,
} from '@/lib/travel-memory'
import {
  mergeTravelRuntimeRecords,
  resolveTravelRuntimeRelationship,
  toTravelRuntimeRecord,
  type TravelRuntimeRecord,
} from '@/lib/travel-runtime'
import {
  buildTravelInteractionThreads,
  type TravelInteractionThread,
  type TravelReaction,
} from '@/lib/travel-interactions'
import { getCurrentUser, userReq } from './auth'
import { getPayloadClient } from './payload'
import { readTravelMemoryChildAfterOwner } from './travel-memory-child-access'

const DEFAULT_LIMIT = 6
const TRAVEL_LIMIT = 24

export type {
  TravelCommentSummary,
  TravelInteractionThread,
  TravelReaction,
} from '@/lib/travel-interactions'

export type TravelInteractionResult =
  | {
      status: 'ok'
      thread: TravelInteractionThread
    }
  | {
      status: 'locked' | 'unauthorized'
      message: string
    }

export async function getFeaturedTravelProjects(
  limit = DEFAULT_LIMIT,
  currentUser?: User | null,
): Promise<TravelRuntimeRecord[]> {
  const payload = await getPayloadClient()
  const user = currentUser === undefined ? await getCurrentUser() : currentUser
  const plans = await payload.find({
    collection: 'travel-plans',
    depth: 1,
    limit,
    overrideAccess: false,
    sort: '-startDate',
    ...userReq(user),
  })
  const memories = await payload.find({
    collection: 'travel-memories',
    depth: 1,
    limit,
    overrideAccess: false,
    sort: '-startDate',
    ...userReq(user),
  })

  return mergeTravelRuntimeRecords(plans.docs, memories.docs, limit)
}

export async function getTravelProjects(limit = TRAVEL_LIMIT): Promise<TravelRuntimeRecord[]> {
  return getFeaturedTravelProjects(limit)
}

export async function getTravelRecordByRelationship(
  relationship: HomeConfig['featuredTravelRecord'],
  currentUser?: User | null,
): Promise<TravelRuntimeRecord | null> {
  if (!relationship) return null

  const payload = await getPayloadClient()
  const user = currentUser === undefined ? await getCurrentUser() : currentUser
  const sourceId =
    typeof relationship.value === 'object' ? relationship.value.id : relationship.value

  if (relationship.relationTo === 'travel-plans') {
    const result = await payload.find({
      collection: 'travel-plans',
      depth: 1,
      limit: 1,
      overrideAccess: false,
      where: {
        id: {
          equals: sourceId,
        },
      },
      ...userReq(user),
    })
    const record = result.docs[0]

    return record
      ? resolveTravelRuntimeRelationship(relationship, [
          toTravelRuntimeRecord('travel-plans', record),
        ])
      : null
  }

  const result = await payload.find({
    collection: 'travel-memories',
    depth: 1,
    limit: 1,
    overrideAccess: false,
    where: {
      id: {
        equals: sourceId,
      },
    },
    ...userReq(user),
  })
  const record = result.docs[0]

  return record
    ? resolveTravelRuntimeRelationship(relationship, [
        toTravelRuntimeRecord('travel-memories', record),
      ])
    : null
}

export async function getTravelProjectBySlug(slug: string): Promise<TravelRuntimeRecord | null> {
  const payload = await getPayloadClient()
  const user = await getCurrentUser()
  const plans = await payload.find({
    collection: 'travel-plans',
    depth: 1,
    limit: 1,
    overrideAccess: false,
    where: {
      slug: {
        equals: slug,
      },
    },
    ...userReq(user),
  })
  const memories = plans.docs[0]
    ? null
    : await payload.find({
        collection: 'travel-memories',
        depth: 1,
        limit: 1,
        overrideAccess: false,
        where: {
          slug: {
            equals: slug,
          },
        },
        ...userReq(user),
      })

  if (plans.docs[0]) return toTravelRuntimeRecord('travel-plans', plans.docs[0])
  if (memories?.docs[0]) {
    return toTravelRuntimeRecord('travel-memories', memories.docs[0])
  }

  return null
}

export async function getTravelMemoryOverviewBySlug(
  slug: string,
): Promise<TravelMemoryOverview | null> {
  const context = await getTravelMemoryReadContext(slug)
  if (!context) return null
  const days = await context.payload.find({
    collection: 'travel-memory-days',
    depth: 0,
    limit: 64,
    overrideAccess: false,
    select: { date: true, day: true, dayKey: true, theme: true, title: true },
    sort: 'day',
    where: { memory: { equals: context.memory.id } },
    ...userReq(context.user),
  })
  return toTravelMemoryOverview(context.memory, days.docs)
}

export async function getTravelMemoryDayBySlug(
  slug: string,
  dayKey: string,
): Promise<TravelMemoryDayView | null> {
  return readTravelMemoryChildAfterOwner({
    readOwner: () => getTravelMemoryReadContext(slug),
    readChild: async (context) => {
      const [target, navigation] = await Promise.all([
        context.payload.find({
          collection: 'travel-memory-days',
          depth: 2,
          limit: 1,
          overrideAccess: false,
          where: {
            and: [
              { memory: { equals: context.memory.id } },
              { dayKey: { equals: dayKey } },
            ],
          },
          ...userReq(context.user),
        }),
        context.payload.find({
          collection: 'travel-memory-days',
          depth: 0,
          limit: 64,
          overrideAccess: false,
          select: { day: true, dayKey: true, title: true },
          sort: 'day',
          where: { memory: { equals: context.memory.id } },
          ...userReq(context.user),
        }),
      ])
      const targetDay = target.docs[0]
      if (!targetDay) return null
      return toTravelMemoryDayView(context.memory, targetDay, navigation.docs)
    },
  })
}

export async function getTravelMemoryGalleryBySlug(
  slug: string,
  filters: { dayKey?: string | null; location?: string | null; page?: number } = {},
): Promise<TravelMemoryGallery | null> {
  return readTravelMemoryChildAfterOwner({
    readOwner: () => getTravelMemoryReadContext(slug, true),
    readChild: async (context) => {
      const days = await context.payload.find({
        collection: 'travel-memory-days',
        depth: 2,
        limit: 64,
        overrideAccess: false,
        sort: 'day',
        where: { memory: { equals: context.memory.id } },
        ...userReq(context.user),
      })
      return toTravelMemoryGallery(context.memory, days.docs, filters)
    },
  })
}

async function getTravelMemoryReadContext(slug: string, includeGallery = false) {
  const payload = await getPayloadClient()
  const user = await getCurrentUser()
  const memoryResult = await payload.find({
    collection: 'travel-memories',
    depth: 1,
    limit: 1,
    overrideAccess: false,
    select: {
      coverImage: true,
      endDate: true,
      isPrivate: true,
      presentationStyle: true,
      slug: true,
      startDate: true,
      summary: true,
      title: true,
      ...(includeGallery ? { galleryImages: true } : {}),
    },
    where: { slug: { equals: slug } },
    ...userReq(user),
  })
  const memory = memoryResult.docs[0]
  if (!memory) return null
  return { memory, payload, user }
}

export async function getTravelInteractionThread(
  associatedId: string,
): Promise<TravelInteractionThread> {
  const threads = await getTravelInteractionThreads([associatedId])

  return threads[associatedId]
}

export async function getTravelInteractionThreads(
  associatedIds: string[],
): Promise<Record<string, TravelInteractionThread>> {
  const uniqueIds = [...new Set(associatedIds)]
  if (uniqueIds.length === 0) return {}

  const user = await getCurrentUser()

  if (!user) {
    return buildTravelInteractionThreads(uniqueIds, [], true)
  }

  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'comments',
    depth: 1,
    overrideAccess: false,
    pagination: false,
    req: {
      user,
    },
    sort: 'createdAt',
    where: {
      and: [
        {
          associatedType: {
            equals: 'travel',
          },
        },
        {
          associatedId: {
            in: uniqueIds,
          },
        },
      ],
    },
  })

  return buildTravelInteractionThreads(uniqueIds, result.docs)
}

export async function submitTravelInteraction(input: {
  associatedId: string
  commentText?: string
  reaction?: TravelReaction
}): Promise<TravelInteractionResult> {
  const user = await getCurrentUser()

  if (!user) {
    return {
      status: 'locked',
      message: '家人模式限定：請先登入後再留言或表態。',
    }
  }

  const commentText = input.commentText?.trim()

  if (!commentText && !input.reaction) {
    return {
      status: 'unauthorized',
      message: '請輸入留言，或選擇一個表態。',
    }
  }

  const payload = await getPayloadClient()

  await payload.create({
    collection: 'comments',
    data: {
      associatedType: 'travel',
      associatedId: input.associatedId,
      commentText,
      reaction: input.reaction ?? 'none',
      user: user.id,
    },
    overrideAccess: false,
    req: {
      user,
    },
  })

  return {
    status: 'ok',
    thread: await getTravelInteractionThread(input.associatedId),
  }
}
