import { isDeepStrictEqual } from 'node:util'
import { commitTransaction, initTransaction, killTransaction, type PayloadRequest } from 'payload'
import { reconcileTravelGeo, canonicalGeo } from '../lib/travel-geo-value'
import { travelAtlasOwnerIdentity, type TravelAtlasOwnerTuple } from '../lib/travel-atlas'
import { canManageContent } from '../payload/access/is-admin'
import { geoRecord } from '../payload/collections/travel-geo'
import { lockTravelGeoRequest } from '../payload/collections/travel-geo-lock'
import { geoContent, geoRows, geoRowPatch, geoReviewRevision, readGeoReviewTarget } from '../payload/collections/travel-geo-review'

type Row = Record<string, unknown>
type Kind = 'plan' | 'memory'

export function prepareTravelGeoWrite(kind: Kind, doc: Row, envelope: unknown, owner: TravelAtlasOwnerTuple, source: unknown) {
  const identity = travelAtlasOwnerIdentity(owner)
  const entry = geoRows(doc, kind).find(item => travelAtlasOwnerIdentity(item.owner) === identity)
  if (!entry) throw new Error('Exact geo owner not found; reviewed identity mapping required')
  const base = geoRecord(envelope)
  const baselines = geoRecord(base?.atlasGeoV1)
  const current = geoContent(entry.geo)
  const result = reconcileTravelGeo(source, baselines?.[identity], current)
  return {
    ...result, beforeImage: structuredClone(current),
    patch: result.action === 'update' ? result.value as Row : undefined,
    nextBase: result.base === baselines?.[identity] ? envelope : { ...base, atlasGeoV1: { ...baselines, [identity]: result.base } },
  }
}

// Deliberately separate from the legacy importers. Caller supplies an exact
// reviewed identity, all-locale Source and a revision from the same inventory.
export async function writeTravelGeo(req: PayloadRequest, kind: Kind, id: number, owner: TravelAtlasOwnerTuple, source: unknown, expectedRevision: string) {
  if (!canManageContent({ user: req.user })) throw new Error('Admin-controlled geo import required')
  const started = await initTransaction(req)
  try {
    await lockTravelGeoRequest(req)
    const { doc, parent } = await readGeoReviewTarget(req, kind, id)
    if (geoReviewRevision(doc, parent) !== expectedRevision) throw new Error('Geo import conflict: Current changed')
    const metadataOwner = parent ?? doc
    const metadata = geoRecord(metadataOwner.sourceMetadata)
    const envelope = metadata?.baseProjection
    const plan = prepareTravelGeoWrite(kind, doc, envelope, owner, source)
    if (plan.action === 'conflict') throw new Error('Geo reconciliation conflict')
    if (plan.patch) {
      const names = geoRecord(plan.patch.name)!
      for (const locale of ['zh-TW', 'en'] as const) {
        await req.payload.update({ collection: kind === 'plan' ? 'travel-plans' : 'travel-memory-days', id,
          data: geoRowPatch(doc, kind, owner, { ...plan.patch, name: names[locale], approval: null }) as never,
          locale, fallbackLocale: false, draft: doc._status !== 'published', overrideAccess: false, req })
      }
    }
    const readBack = await readGeoReviewTarget(req, kind, id)
    const saved = geoRows(readBack.doc, kind).find(item => travelAtlasOwnerIdentity(item.owner) === travelAtlasOwnerIdentity(owner))
    if (plan.patch && (!saved || canonicalGeo(geoContent(saved.geo)) !== canonicalGeo(plan.patch) || geoRecord(saved.geo.approval)?.snapshot)) throw new Error('Geo content read-back mismatch')
    if (plan.patch && nonTargetGeoRevision(doc, kind, owner) !== nonTargetGeoRevision(readBack.doc, kind, owner)) throw new Error('Geo write changed non-target data')
    // Do not advance Base until content has been read back in the same locked
    // transaction. Preserve the owning envelope, other locales/days/assets.
    if (!isDeepStrictEqual(plan.nextBase, envelope)) {
      await req.payload.update({ collection: kind === 'plan' ? 'travel-plans' : 'travel-memories', id: metadataOwner.id as number,
        data: { sourceMetadata: { ...metadata, baseProjection: plan.nextBase } } as never,
        draft: metadataOwner._status !== 'published', overrideAccess: false, req })
      const verified = await readGeoReviewTarget(req, kind, id)
      if (!isDeepStrictEqual(geoRecord((verified.parent ?? verified.doc).sourceMetadata)?.baseProjection, plan.nextBase)) throw new Error('Geo Base read-back mismatch')
      if (metadataNonTargetRevision(metadataOwner, kind === 'plan' ? owner : undefined) !== metadataNonTargetRevision(verified.parent ?? verified.doc, kind === 'plan' ? owner : undefined)) throw new Error('Geo Base write changed non-target data')
    }
    if (started) await commitTransaction(req)
    return { action: plan.action, beforeImage: plan.beforeImage,
      stats: { create: 0, update: Number(plan.action === 'update'), preserve: Number(plan.action === 'preserve'), conflict: 0, skip: Number(plan.action === 'skip'), delete: 0 } }
  } catch (error) { if (started) await killTransaction(req); throw error }
}

function nonTargetGeoRevision(doc: Row, kind: Kind, owner: TravelAtlasOwnerTuple): string {
  const copy = structuredClone(doc)
  const entry = geoRows(copy, kind).find(item => travelAtlasOwnerIdentity(item.owner) === travelAtlasOwnerIdentity(owner))
  if (entry) entry.row.geo = null
  delete copy.updatedAt
  delete copy.geoAccessRevision
  return geoReviewRevision(copy)
}

function metadataNonTargetRevision(doc: Row, owner?: TravelAtlasOwnerTuple): string {
  const copy = structuredClone(doc)
  delete copy.updatedAt
  delete copy.geoAccessRevision
  const metadata = geoRecord(copy.sourceMetadata)
  if (metadata) delete metadata.baseProjection
  if (owner) {
    const entry = geoRows(copy, 'plan').find(item => travelAtlasOwnerIdentity(item.owner) === travelAtlasOwnerIdentity(owner))
    if (entry) entry.row.geo = null
  }
  return geoReviewRevision(copy)
}
