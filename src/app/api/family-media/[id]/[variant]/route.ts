import { getFamilySession, userReq } from '@/lib/data/auth'
import { familyMediaResponse } from '@/lib/data/family-media-response'
import { getPrivateFamilyPhoto } from '@/lib/data/family-r2'
import { getPayloadClient } from '@/lib/data/payload'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request, { params }: { params: Promise<{ id: string; variant: string }> }) {
  const [target, session] = await Promise.all([params, getFamilySession()])
  return familyMediaResponse({
    ...target,
    canReadFamily: session.isFamilyMode,
    async findFamilyKey(id) {
      const payload = await getPayloadClient()
      const doc = await payload.findByID({ collection: 'media', id, depth: 0, overrideAccess: false, disableErrors: true,
        ...userReq(session.user), select: { familyAssetKey: true } })
      return doc?.familyAssetKey
    },
    getPrivatePhoto: key => getPrivateFamilyPhoto(key, request.signal),
  })
}
