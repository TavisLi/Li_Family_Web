import type { Payload } from 'payload'

import type { SeedContent } from './seed-content'

export type DryRunAction = {
  collection: 'media' | 'travel-projects' | 'users'
  key: string
  action: 'create' | 'update'
  existingId?: number
}

export type DryRunSummary = {
  creates: number
  updates: number
  skips: number
  deletes: number
}

export async function buildPayloadDryRun(
  payload: Payload,
  seedContent: SeedContent,
): Promise<{
  actions: DryRunAction[]
  summary: DryRunSummary
  deletionRisk: string
}> {
  const actions: DryRunAction[] = []
  const [users, travels, media] = await Promise.all([
    payload.find({
      collection: 'users',
      depth: 0,
      limit: 1000,
      pagination: false,
    }),
    payload.find({
      collection: 'travel-projects',
      depth: 0,
      limit: 1000,
      pagination: false,
    }),
    payload.find({
      collection: 'media',
      depth: 0,
      limit: 2000,
      pagination: false,
    }),
  ])
  const userIdBySlug = new Map(users.docs.map((user) => [user.slug, user.id]))
  const travelIdBySlug = new Map(travels.docs.map((travel) => [travel.slug, travel.id]))
  const mediaIdBySourcePath = new Map(
    media.docs.flatMap((item) => (item.sourcePath ? [[item.sourcePath, item.id] as const] : [])),
  )

  for (const member of seedContent.members) {
    const existingId = userIdBySlug.get(member.slug)

    actions.push({
      collection: 'users',
      key: member.slug,
      action: existingId ? 'update' : 'create',
      existingId,
    })
  }

  for (const travel of seedContent.travels) {
    const existingId = travelIdBySlug.get(travel.slug)

    actions.push({
      collection: 'travel-projects',
      key: travel.slug,
      action: existingId ? 'update' : 'create',
      existingId,
    })
  }

  for (const media of seedContent.media) {
    const existingId = mediaIdBySourcePath.get(media.sourcePath)

    actions.push({
      collection: 'media',
      key: media.sourcePath,
      action: existingId ? 'update' : 'create',
      existingId,
    })
  }

  return {
    actions,
    summary: summarizeDryRunActions(actions),
    deletionRisk: 'No delete operation is implemented by the Phase 9 seed workflow.',
  }
}

export function summarizeDryRunActions(actions: DryRunAction[]): DryRunSummary {
  return actions.reduce<DryRunSummary>(
    (summary, item) => {
      if (item.action === 'create') {
        summary.creates += 1
      } else {
        summary.updates += 1
      }

      return summary
    },
    {
      creates: 0,
      updates: 0,
      skips: 0,
      deletes: 0,
    },
  )
}
