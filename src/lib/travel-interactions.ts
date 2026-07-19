import type { Comment } from '@/payload/payload-types'

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

export function buildTravelInteractionThreads(
  associatedIds: string[],
  comments: Comment[],
  locked = false,
): Record<string, TravelInteractionThread> {
  const threads = Object.fromEntries(
    [...new Set(associatedIds)].map((associatedId) => [
      associatedId,
      emptyThread(associatedId, locked),
    ]),
  )

  if (locked) return threads

  for (const comment of comments) {
    const thread = threads[comment.associatedId]
    if (!thread) continue

    const reaction = normalizeReaction(comment.reaction)

    if (reaction) {
      thread.reactions[reaction] += 1
    }

    if (comment.commentText?.trim()) {
      thread.comments.push({
        id: comment.id,
        associatedId: comment.associatedId,
        authorName: authorName(comment.user),
        commentText: comment.commentText,
        reaction,
        createdAt: comment.createdAt,
      })
    }
  }

  return threads
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

function normalizeReaction(reaction: Comment['reaction']): TravelReaction | null {
  return reaction === 'up' || reaction === 'down' ? reaction : null
}

function authorName(user: Comment['user']): string {
  if (typeof user === 'number') {
    return '家人'
  }

  return user.displayName || user.email || '家人'
}
