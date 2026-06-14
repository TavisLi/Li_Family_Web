'use server'

import { revalidatePath } from 'next/cache'

import { submitBlogInteraction, type BlogReaction } from '@/lib/data/posts'

export async function submitBlogInteractionAction(input: {
  associatedId: string
  postSlug: string
  commentText?: string
  reaction?: BlogReaction
}) {
  const result = await submitBlogInteraction(input)

  revalidatePath('/blog')
  revalidatePath(`/blog/${input.postSlug}`)

  return result
}
