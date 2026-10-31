import { createHash } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import { commitTransaction, initTransaction, killTransaction, type Endpoint, type PayloadRequest } from 'payload'
import { canonicalGeo } from '../../lib/travel-geo-value'
import { travelAtlasOwnerIdentity, type TravelAtlasOwnerTuple } from '../../lib/travel-atlas'
import { canManageContent } from '../access/is-admin'
import { geoRecord, withTravelGeoApproval } from './travel-geo'
import { lockTravelGeoRequest } from './travel-geo-lock'

type Row = Record<string, unknown>
type Kind = 'plan' | 'memory'

function sorted(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sorted)
  const record = geoRecord(value)
  return record ? Object.fromEntries(Object.keys(record).sort().map(key => [key, sorted(record[key])])) : value
}
export function geoReviewRevision(doc: unknown, parent?: unknown): string {
  return createHash('sha256').update(JSON.stringify(sorted([doc, parent ?? null]))).digest('hex')
}
export function geoApprovalValue(value: unknown): Row | null {
  const approval = geoRecord(value)
  if (!approval || ['snapshot', 'audience', 'confirmedBy'].every(key => approval[key] == null)) return null
  return { snapshot: approval.snapshot, audience: approval.audience, confirmedBy: approval.confirmedBy }
}
export function geoContent(value: unknown): Row {
  const geo = geoRecord(value) ?? {}
  const names = geoRecord(geo.name)
  return {
    name: { 'zh-TW': names?.['zh-TW'] ?? null, en: names?.en ?? null },
    latitude: geo.latitude ?? null, longitude: geo.longitude ?? null,
    crs: geo.crs ?? null, provenance: geo.provenance ?? null, originalCRS: geo.originalCRS ?? null,
  }
}
export function geoApprovalSnapshot(owner: TravelAtlasOwnerTuple, geo: unknown, audience: 'family' | 'public', doc: Row, parent?: Row): string {
  if (!doc.geoAccessRevision || (parent && !parent.geoAccessRevision)) throw new Error('Geo access revision is missing')
  return JSON.stringify([
    'geo-review-v1', travelAtlasOwnerIdentity(owner), canonicalGeo(geoContent(geo)), audience,
    doc.geoAccessRevision, doc._status, parent?.geoAccessRevision ?? null,
    (parent ?? doc)._status, (parent ?? doc).isPrivate,
  ])
}

export async function readGeoReviewTarget(req: PayloadRequest, kind: Kind, id: number) {
  const doc = await req.payload.findByID({ collection: kind === 'plan' ? 'travel-plans' : 'travel-memory-days', id,
    locale: 'all', fallbackLocale: false, depth: 0, draft: true, overrideAccess: false, req })
  const row = doc as unknown as Row
  const memory = geoRecord(row.memory)?.id ?? row.memory
  const parent = kind === 'memory' ? await req.payload.findByID({ collection: 'travel-memories', id: memory as number,
    locale: 'all', fallbackLocale: false, depth: 0, draft: true, overrideAccess: false, req }) : undefined
  return { doc: row, parent: parent as unknown as Row | undefined }
}

export function geoRows(doc: Row, kind: Kind): { owner: TravelAtlasOwnerTuple; geo: Row; row: Row; section?: Row }[] {
  const rows = kind === 'plan' ? doc.planningSections : doc.moments
  if (!Array.isArray(rows)) return []
  const result: { owner: TravelAtlasOwnerTuple; geo: Row; row: Row; section?: Row }[] = []
  const seen = new Set<string>()
  for (const value of rows) {
    const row = geoRecord(value)
    if (!row) throw new Error('Geo identity requires a row')
    const sectionKey = kind === 'plan' ? row.anchor : doc.dayKey
    const memory = geoRecord(doc.memory)?.id ?? doc.memory
    const ownerId = kind === 'plan' ? doc.id : memory
    const stops = kind === 'plan' ? row.geoStops : [row]
    if (!Array.isArray(stops)) continue
    for (const value of stops) {
      const stop = geoRecord(value)
      if (!stop) throw new Error('Geo identity requires a row')
      const key = kind === 'plan' ? stop.stopKey : stop.momentKey
      const owner = [kind, ownerId, sectionKey, key] as TravelAtlasOwnerTuple
      const identity = travelAtlasOwnerIdentity(owner)
      if (seen.has(identity)) throw new Error('Geo identities must be unique')
      seen.add(identity)
      const geo = geoRecord(stop.geo)
      if (geo) result.push({ owner, geo, row: stop, ...(kind === 'plan' ? { section: row } : {}) })
    }
  }
  return result
}

export function geoRowPatch(doc: Row, kind: Kind, owner: TravelAtlasOwnerTuple, geo: Row): Row {
  const target = travelAtlasOwnerIdentity(owner)
  const entries = geoRows(doc, kind)
  const entry = entries.find(item => travelAtlasOwnerIdentity(item.owner) === target)
  if (!entry) throw new Error('Exact geo owner not found')
  // Sparse array patches are completed by the identity hook using the locked,
  // locale-hoisted Current. Passing locale:all documents into writes is unsafe.
  const rows = (kind === 'plan' ? doc.planningSections : doc.moments) as Row[]
  return kind === 'plan' ? { planningSections: rows.map(section => ({ id: section.id, anchor: section.anchor,
    ...(section === entry.section ? { geoStops: (section.geoStops as Row[]).map(stop => ({ id: stop.id, stopKey: stop.stopKey,
      ...(stop === entry.row ? { geo } : {}) })) } : {}),
  })) } : { moments: rows.map(moment => ({ id: moment.id, momentKey: moment.momentKey, ...(moment === entry.row ? { geo } : {}) })) }
}

export async function reviewTravelGeo(req: PayloadRequest, kind: Kind, id: number, input: unknown) {
  if (!canManageContent({ user: req.user })) throw new Error('Admin geo review required')
  const body = geoRecord(input)
  if (!body || !['approve', 'revoke'].includes(String(body.action)) || typeof body.expectedRevision !== 'string' ||
    typeof body.sectionOrDayKey !== 'string' || typeof body.itemKey !== 'string') throw new Error('Invalid geo review request')
  if (body.action === 'approve' && body.audience !== 'family' && body.audience !== 'public') throw new Error('Explicit audience required')
  const started = await initTransaction(req)
  try {
    await lockTravelGeoRequest(req)
    let { doc, parent } = await readGeoReviewTarget(req, kind, id)
    if (geoReviewRevision(doc, parent) !== body.expectedRevision) throw new Error('Geo review conflict: Current changed')
    // Legacy records acquire an epoch inside the same approved review, after
    // checking the caller's exact before-image and before binding approval.
    if (parent && !parent.geoAccessRevision) {
      await req.payload.update({ collection: 'travel-memories', id: parent.id as number, data: {},
        locale: 'zh-TW', fallbackLocale: false, draft: parent._status !== 'published', overrideAccess: false, req })
    }
    if (!doc.geoAccessRevision) {
      await req.payload.update({ collection: kind === 'plan' ? 'travel-plans' : 'travel-memory-days', id, data: {},
        locale: 'zh-TW', fallbackLocale: false, draft: doc._status !== 'published', overrideAccess: false, req })
    }
    if (!doc.geoAccessRevision || (parent && !parent.geoAccessRevision)) ({ doc, parent } = await readGeoReviewTarget(req, kind, id))
    const entry = geoRows(doc, kind).find(item => item.owner[2] === body.sectionOrDayKey && item.owner[3] === body.itemKey)
    if (!entry) throw new Error('Exact geo owner not found')
    const content = geoContent(entry.geo)
    canonicalGeo(content)
    if (body.action === 'approve' && (content.crs !== 'WGS84' || typeof content.latitude !== 'number' || typeof content.longitude !== 'number')) throw new Error('Confirmed WGS84 coordinates required')
    const approval = body.action === 'revoke' ? null : {
      snapshot: geoApprovalSnapshot(entry.owner, entry.geo, body.audience as 'family' | 'public', doc, parent),
      audience: body.audience, confirmedBy: String(req.user!.id),
    }
    await withTravelGeoApproval(req, () => req.payload.update({ collection: kind === 'plan' ? 'travel-plans' : 'travel-memory-days', id,
      data: geoRowPatch(doc, kind, entry.owner, { approval }) as never, locale: 'zh-TW', fallbackLocale: false,
      draft: doc._status !== 'published', overrideAccess: false, req }))
    const readBack = await readGeoReviewTarget(req, kind, id)
    const saved = geoRows(readBack.doc, kind).find(item => travelAtlasOwnerIdentity(item.owner) === travelAtlasOwnerIdentity(entry.owner))
    if (!saved || canonicalGeo(geoContent(saved.geo)) !== canonicalGeo(content) ||
      !isDeepStrictEqual(geoApprovalValue(saved.geo.approval), geoApprovalValue(approval))) throw new Error('Geo review read-back mismatch')
    if (started) await commitTransaction(req)
    return { result: body.action === 'approve' ? 'approved' : 'revoked', revision: geoReviewRevision(readBack.doc, readBack.parent) }
  } catch (error) {
    if (started) await killTransaction(req)
    throw error
  }
}

export function travelGeoReviewEndpoints(kind: Kind): Endpoint[] {
  return ['get', 'post'].map(method => ({ path: '/:id/geo-review', method: method as 'get' | 'post', handler: async req => {
    if (!canManageContent({ user: req.user })) return Response.json({ error: 'Admin geo review required' }, { status: 403 })
    const id = Number(req.routeParams?.id)
    if (!Number.isSafeInteger(id) || id <= 0) return Response.json({ error: 'Invalid owner' }, { status: 400 })
    const privateResponse = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
    if (method === 'post') {
      try { return privateResponse(await reviewTravelGeo(req, kind, id, await req.json!())) }
      catch { return privateResponse({ error: 'Geo review rejected; refresh Current before reviewing' }, 409) }
    }
    const started = await initTransaction(req)
    try {
      await lockTravelGeoRequest(req)
      const { doc, parent } = await readGeoReviewTarget(req, kind, id)
      const result = { revision: geoReviewRevision(doc, parent) }
      if (started) await commitTransaction(req)
      return privateResponse(result)
    } catch (error) { if (started) await killTransaction(req); throw error }
  } }))
}
