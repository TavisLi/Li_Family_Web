import 'server-only'

import type { WrappedSnapshot } from '@/payload/payload-types'
import { requireFamilyUser, userReq, type FamilySession } from './auth'
import { getPayloadClient } from './payload'
import { isWrappedAvailable } from './phase-7-domain'

export type WrappedPageData = {
  snapshot: WrappedSnapshot | null
  available: boolean
  previewReason: 'locked-season' | 'no-published-snapshot'
}

export type WrappedHomeCta = {
  locked: boolean
  available: boolean
  year?: number
  summary?: string | null
}

export async function getWrappedPageData(): Promise<WrappedPageData> {
  const user = await requireFamilyUser('/family/login?next=/wrapped')
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'wrapped-snapshots',
    depth: 1,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    req: {
      user,
    },
    sort: '-year',
    where: {
      status: {
        equals: 'published',
      },
    },
  })
  const snapshot = result.docs[0] ?? null
  const available = isWrappedAvailable({
    currentDate: new Date(),
    snapshot,
  })

  return {
    snapshot,
    available,
    previewReason: snapshot ? 'locked-season' : 'no-published-snapshot',
  }
}

export async function getWrappedHomeCta(
  familySession: FamilySession,
): Promise<WrappedHomeCta> {
  if (!familySession.isFamilyMode) {
    return {
      locked: true,
      available: false,
    }
  }

  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'wrapped-snapshots',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    sort: '-year',
    where: {
      status: {
        equals: 'published',
      },
    },
    ...userReq(familySession.user),
  })
  const snapshot = result.docs[0] ?? null
  const available = isWrappedAvailable({
    currentDate: new Date(),
    snapshot,
  })

  return {
    locked: false,
    available,
    year: snapshot?.year,
    summary: snapshot?.summary,
  }
}
