'use server'

import { revalidatePath } from 'next/cache'

import { submitTravelInteraction, type TravelReaction } from '@/lib/data/travel'

export async function submitTravelInteractionAction(input: {
  associatedId: string
  commentText?: string
  reaction?: TravelReaction
}) {
  const result = await submitTravelInteraction(input)
  const slug = input.associatedId.match(/^travel:([^:]+)/)?.[1]

  if (slug) {
    revalidatePath(`/travel/${slug}`)
  }

  return result
}
