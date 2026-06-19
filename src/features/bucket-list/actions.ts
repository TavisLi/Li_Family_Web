'use server'

import { revalidatePath } from 'next/cache'

import {
  completeBucketItem,
  createBucketItem,
  moveBucketItem,
} from '@/lib/data/bucket-list'
import type { BucketStatus } from '@/lib/data/phase-7-domain'

export async function createBucketItemAction(input: {
  title: string
  description?: string
  priority?: number
  targetDate?: string
}) {
  const result = await createBucketItem(input)

  revalidateBucketViews()

  return result
}

export async function moveBucketItemAction(input: {
  id: number
  status: BucketStatus
}) {
  const result = await moveBucketItem(input)

  revalidateBucketViews()

  return result
}

export async function completeBucketItemAction(id: number) {
  const result = await completeBucketItem(id)

  revalidateBucketViews()
  revalidatePath('/timeline')

  return result
}

function revalidateBucketViews() {
  revalidatePath('/')
  revalidatePath('/bucket-list')
}
