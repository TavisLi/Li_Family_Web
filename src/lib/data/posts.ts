import 'server-only'

import { headers } from 'next/headers'

import type { Category, Comment, Post, User } from '@/payload/payload-types'
import { getPayloadClient } from './payload'

const DEFAULT_LIMIT = 6
const BLOG_INDEX_LIMIT = 60

export type BlogReaction = 'heart' | 'cool' | 'applause'

export type BlogCommentSummary = {
  id: number
  associatedId: string
  authorName: string
  commentText: string | null
  reaction: BlogReaction | null
  createdAt: string
}

export type BlogInteractionThread = {
  associatedId: string
  locked: boolean
  comments: BlogCommentSummary[]
  reactions: Record<BlogReaction, number>
}

export type BlogInteractionResult =
  | {
      status: 'ok'
      thread: BlogInteractionThread
    }
  | {
      status: 'locked' | 'unauthorized'
      message: string
    }

export type BlogTagSummary = {
  tag: string
  count: number
}

export type BlogIndexData = {
  posts: Post[]
  categories: Category[]
  tags: BlogTagSummary[]
  selectedCategory?: string
  selectedTag?: string
}

export async function getLatestPosts(limit = DEFAULT_LIMIT): Promise<Post[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'posts',
    depth: 1,
    limit,
    overrideAccess: false,
    sort: '-publishedDate',
  })

  return result.docs
}

export async function getBlogIndex(options: {
  category?: string
  tag?: string
  limit?: number
} = {}): Promise<BlogIndexData> {
  const payload = await getPayloadClient()
  const user = await getCurrentUser()
  const [postsResult, categoriesResult] = await Promise.all([
    payload.find({
      collection: 'posts',
      depth: 2,
      limit: options.limit ?? BLOG_INDEX_LIMIT,
      overrideAccess: false,
      sort: '-publishedDate',
      ...(user ? { req: { user } } : {}),
    }),
    payload.find({
      collection: 'categories',
      depth: 0,
      limit: 100,
      overrideAccess: false,
      sort: 'title',
    }),
  ])
  const filteredPosts = postsResult.docs.filter((post) => {
    const categoryMatched = options.category ? postHasCategory(post, options.category) : true
    const tagMatched = options.tag ? postHasTag(post, options.tag) : true

    return categoryMatched && tagMatched
  })

  return {
    posts: filteredPosts,
    categories: categoriesResult.docs,
    tags: tagCloud(postsResult.docs),
    selectedCategory: options.category,
    selectedTag: options.tag,
  }
}

export async function getBlogPostBySlug(slug: string): Promise<Post | null> {
  const payload = await getPayloadClient()
  const user = await getCurrentUser()
  const result = await payload.find({
    collection: 'posts',
    depth: 2,
    limit: 1,
    overrideAccess: false,
    where: {
      slug: {
        equals: slug,
      },
    },
    ...(user ? { req: { user } } : {}),
  })

  return result.docs[0] ?? null
}

export async function getBlogTagCloud(): Promise<BlogTagSummary[]> {
  const { tags } = await getBlogIndex()

  return tags
}

export async function getBlogInteractionThread(
  associatedId: string,
): Promise<BlogInteractionThread> {
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
            equals: 'blog',
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

export async function submitBlogInteraction(input: {
  associatedId: string
  commentText?: string
  reaction?: BlogReaction
}): Promise<BlogInteractionResult> {
  const user = await getCurrentUser()

  if (!user) {
    return {
      status: 'locked',
      message: '家人模式限定：請先登入後再留言或送出暖心反應。',
    }
  }

  const commentText = input.commentText?.trim()

  if (!commentText && !input.reaction) {
    return {
      status: 'unauthorized',
      message: '請輸入留言，或選擇一個暖心反應。',
    }
  }

  const payload = await getPayloadClient()

  await payload.create({
    collection: 'comments',
    data: {
      associatedType: 'blog',
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
    thread: await getBlogInteractionThread(input.associatedId),
  }
}

export function blogInteractionId(post: Post): string {
  return `blog:${post.id}`
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

function emptyThread(associatedId: string, locked: boolean): BlogInteractionThread {
  return {
    associatedId,
    locked,
    comments: [],
    reactions: {
      applause: 0,
      cool: 0,
      heart: 0,
    },
  }
}

function summarizeComments(
  associatedId: string,
  comments: Comment[],
): BlogInteractionThread {
  return comments.reduce<BlogInteractionThread>((thread, comment) => {
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

function normalizeReaction(reaction: Comment['reaction']): BlogReaction | null {
  return reaction === 'heart' || reaction === 'cool' || reaction === 'applause' ? reaction : null
}

function authorName(user: Comment['user']): string {
  if (typeof user === 'number') {
    return '家人'
  }

  return user.displayName || user.email || '家人'
}

function postHasCategory(post: Post, categorySlug: string): boolean {
  return Boolean(
    post.categories?.some((category) =>
      typeof category === 'number' ? false : category.slug === categorySlug,
    ),
  )
}

function postHasTag(post: Post, tag: string): boolean {
  return Boolean(
    post.tags?.some((item) => item.tag.toLowerCase() === tag.toLowerCase()),
  )
}

function tagCloud(posts: Post[]): BlogTagSummary[] {
  const counts = new Map<string, number>()

  for (const post of posts) {
    for (const item of post.tags ?? []) {
      counts.set(item.tag, (counts.get(item.tag) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag))
}
