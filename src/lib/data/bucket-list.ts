import 'server-only'

import type { BucketItem } from '@/payload/payload-types'
import { getPayloadClient } from './payload'
import { requireFamilyUser, userReq, type FamilySession } from './auth'
import {
  buildBucketCompletionTimelineEvent,
  summarizeBucketColumns,
  type BucketColumnSummary,
  type BucketStatus,
} from './phase-7-domain'

const BUCKET_LIMIT = 60
const QUICK_VIEW_LIMIT = 3

export type BucketListData = {
  items: BucketItem[]
  columns: Record<BucketStatus, BucketItem[]>
  summary: BucketColumnSummary
}

export type BucketMutationResult =
  | {
      status: 'ok'
      item: BucketItem
      message: string
    }
  | {
      status: 'error'
      message: string
    }

export async function getBucketListData(): Promise<BucketListData> {
  const user = await requireFamilyUser('/family/login?next=/bucket-list')
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'bucket-items',
    depth: 2,
    limit: BUCKET_LIMIT,
    overrideAccess: false,
    pagination: false,
    req: {
      user,
    },
    sort: ['status', 'priority', '-createdAt'],
  })

  return bucketListFromItems(result.docs)
}

export async function getBucketQuickView(
  familySession: FamilySession,
): Promise<BucketItem[]> {
  if (!familySession.isFamilyMode) {
    return []
  }

  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'bucket-items',
    depth: 1,
    limit: QUICK_VIEW_LIMIT,
    overrideAccess: false,
    pagination: false,
    sort: ['priority', '-createdAt'],
    where: {
      status: {
        equals: 'in-progress',
      },
    },
    ...userReq(familySession.user),
  })

  return result.docs
}

export async function createBucketItem(input: {
  title: string
  description?: string
  priority?: number
  targetDate?: string
}): Promise<BucketMutationResult> {
  const title = input.title.trim()

  if (!title) {
    return {
      status: 'error',
      message: '請輸入願望名稱。',
    }
  }

  const user = await requireFamilyUser('/family/login?next=/bucket-list')
  const payload = await getPayloadClient()
  const item = await payload.create({
    collection: 'bucket-items',
    data: {
      title,
      description: input.description?.trim(),
      priority: input.priority ?? 3,
      targetDate: input.targetDate || undefined,
      createdBy: user.id,
      status: 'pool',
      isPrivate: true,
    },
    overrideAccess: false,
    req: {
      user,
    },
  })

  return {
    status: 'ok',
    item,
    message: '願望已加入願望池。',
  }
}

export async function moveBucketItem(input: {
  id: number
  status: BucketStatus
}): Promise<BucketMutationResult> {
  if (input.status === 'completed') {
    return completeBucketItem(input.id)
  }

  const user = await requireFamilyUser('/family/login?next=/bucket-list')
  const payload = await getPayloadClient()
  const item = await payload.update({
    collection: 'bucket-items',
    id: input.id,
    data: {
      status: input.status,
      completedAt: null,
      completedBy: null,
    },
    overrideAccess: false,
    req: {
      user,
    },
  })

  return {
    status: 'ok',
    item,
    message: '願望狀態已更新。',
  }
}

export async function completeBucketItem(id: number): Promise<BucketMutationResult> {
  const user = await requireFamilyUser('/family/login?next=/bucket-list')
  const payload = await getPayloadClient()
  const existing = await payload.findByID({
    collection: 'bucket-items',
    id,
    depth: 1,
    overrideAccess: false,
    req: {
      user,
    },
  })

  if (existing.status === 'completed' && existing.timelineEvent) {
    return {
      status: 'ok',
      item: existing,
      message: '願望已經收進時空膠囊。',
    }
  }

  const completedAt = new Date().toISOString()
  const completed = await payload.update({
    collection: 'bucket-items',
    id,
    data: {
      status: 'completed',
      completedAt,
      completedBy: user.id,
    },
    overrideAccess: false,
    req: {
      user,
    },
  })
  const timelineEventData = buildBucketCompletionTimelineEvent({
    bucketId: completed.id,
    title: completed.title,
    description: completed.description,
    completedAt,
    isPrivate: completed.isPrivate,
  })
  const timelineEvent = await payload.create({
    collection: 'timeline-events',
    data: {
      ...timelineEventData,
      relatedMembers: [user.id],
    },
    overrideAccess: false,
    req: {
      user,
    },
  })
  const item = await payload.update({
    collection: 'bucket-items',
    id,
    data: {
      timelineEvent: timelineEvent.id,
    },
    overrideAccess: false,
    req: {
      user,
    },
  })

  return {
    status: 'ok',
    item,
    message: '願望完成，已同步寫入時空膠囊。',
  }
}

function bucketListFromItems(items: BucketItem[]): BucketListData {
  return {
    items,
    columns: {
      pool: items.filter((item) => item.status === 'pool'),
      'in-progress': items.filter((item) => item.status === 'in-progress'),
      completed: items.filter((item) => item.status === 'completed'),
    },
    summary: summarizeBucketColumns(items),
  }
}
