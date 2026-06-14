import 'server-only'

import { headers } from 'next/headers'

import type { Comment, TravelProject, User } from '@/payload/payload-types'
import { getPayloadClient } from './payload'

const DEFAULT_LIMIT = 6
const TRAVEL_LIMIT = 24

export type TravelReaction = 'up' | 'down'

export type TravelCommentSummary = {
  id: number
  associatedId: string
  authorName: string
  commentText: string | null
  reaction: TravelReaction | null
  createdAt: string
}

export type TravelInteractionThread = {
  associatedId: string
  locked: boolean
  comments: TravelCommentSummary[]
  reactions: {
    up: number
    down: number
  }
}

export type TravelInteractionResult =
  | {
      status: 'ok'
      thread: TravelInteractionThread
    }
  | {
      status: 'locked' | 'unauthorized'
      message: string
    }

export async function getFeaturedTravelProjects(limit = DEFAULT_LIMIT): Promise<TravelProject[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'travel-projects',
    depth: 1,
    limit,
    overrideAccess: false,
    sort: '-startDate',
  })

  return result.docs
}

export async function getTravelProjects(limit = TRAVEL_LIMIT): Promise<TravelProject[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'travel-projects',
    depth: 1,
    limit,
    overrideAccess: false,
    sort: '-startDate',
  })

  return result.docs
}

export async function getTravelProjectBySlug(slug: string): Promise<TravelProject | null> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'travel-projects',
    depth: 1,
    limit: 1,
    overrideAccess: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs[0] ?? null
}

export async function getTravelInteractionThread(
  associatedId: string,
): Promise<TravelInteractionThread> {
  const user = await getCurrentUser()

  if (!user) {
    return emptyThread(associatedId, true)
  }

  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'comments',
    depth: 1,
    limit: 100,
    overrideAccess: false,
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
            equals: associatedId,
          },
        },
      ],
    },
  })

  return summarizeComments(associatedId, result.docs)
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

async function getCurrentUser(): Promise<User | null> {
  const payload = await getPayloadClient()
  const requestHeaders = await headers()
  const result = await payload.auth({
    headers: requestHeaders,
  })

  if (!result.user) {
    return null
  }

  return result.user as User
}

function emptyThread(associatedId: string, locked: boolean): TravelInteractionThread {
  return {
    associatedId,
    locked,
    comments: [],
    reactions: {
      up: 0,
      down: 0,
    },
  }
}

function summarizeComments(
  associatedId: string,
  comments: Comment[],
): TravelInteractionThread {
  return comments.reduce<TravelInteractionThread>((thread, comment) => {
    const reaction = normalizeReaction(comment.reaction)

    if (reaction) {
      thread.reactions[reaction] += 1
    }

    if (comment.commentText?.trim()) {
      thread.comments.push({
        id: comment.id,
        associatedId,
        authorName: authorName(comment.user),
        commentText: comment.commentText,
        reaction,
        createdAt: comment.createdAt,
      })
    }

    return thread
  }, emptyThread(associatedId, false))
}

function normalizeReaction(reaction: Comment['reaction']): TravelReaction | null {
  return reaction === 'up' || reaction === 'down' ? reaction : null
}

function authorName(user: Comment['user']): string {
  if (typeof user === 'number') {
    return '家人'
  }

  return user.displayName || user.email || '家人'
}
