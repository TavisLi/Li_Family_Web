import { randomUUID } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import type { CollectionBeforeValidateHook, Field } from 'payload'
import { canManageContent } from '../access/is-admin'

export function travelGeoField(): Field {
  return {
    name: 'geo', type: 'group', required: false,
    // Raw geo, provenance and review snapshots remain Admin-only. Publishing a
    // safe DTO is a separate consumer boundary; field access also blocks queries.
    access: { read: ({ req }) => canManageContent({ user: req.user }) },
    fields: [
      { name: 'name', type: 'text', localized: true, required: false },
      { name: 'latitude', type: 'number', min: -90, max: 90, required: false },
      { name: 'longitude', type: 'number', min: -180, max: 180, required: false },
      { name: 'crs', type: 'text', required: false },
      { name: 'provenance', type: 'textarea', required: false },
      { name: 'originalCRS', type: 'text', required: false },
      {
        name: 'approval', type: 'group', required: false, admin: { readOnly: true },
        fields: [
          { name: 'snapshot', type: 'textarea', required: false },
          { name: 'audience', type: 'select', enumName: 'travel_geo_audience', required: false, options: ['family', 'public'] },
          { name: 'confirmedBy', type: 'text', required: false },
        ],
      },
    ],
  }
}

export function travelGeoAccessRevisionField(): Field {
  return {
    name: 'geoAccessRevision', type: 'text', required: false,
    access: { read: ({ req }) => canManageContent({ user: req.user }) },
    admin: { hidden: true, readOnly: true },
  }
}

export function travelGeoStopsField(): Field {
  return {
    name: 'geoStops', type: 'array', dbName: 'geo_stops', required: false,
    // Stop existence/order and identity are also private until a safe projection.
    access: { read: ({ req }) => canManageContent({ user: req.user }) },
    fields: [
      { name: 'stopKey', type: 'text', required: false, admin: { readOnly: true } },
      travelGeoField(),
    ],
  }
}

type Row = Record<string, unknown>
export function geoRecord(value: unknown): Row | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : undefined
}

// Trusted approval writes are scoped to a server request, never a client-supplied
// context/field. The review service is the only caller allowed to grant approval.
const approvalRequests = new WeakSet<object>()
export async function withTravelGeoApproval<T>(req: object, write: () => Promise<T>): Promise<T> {
  approvalRequests.add(req)
  try { return await write() } finally { approvalRequests.delete(req) }
}

export function travelGeoGuard(kind: 'plan' | 'memory' | 'parent'): CollectionBeforeValidateHook {
  return ({ data, originalDoc, req }) => guardTravelGeoIdentity(kind, data ?? {}, originalDoc, approvalRequests.has(req), Boolean(req.context.isRestoringVersion))
}

export function guardTravelGeoIdentity(kind: 'plan' | 'memory' | 'parent', data: Row, original?: Row, approvalWrite = false, restoring = false): Row {
  const next = { ...data }
  const accessChanged = restoring || ['isPrivate', '_status'].some(key => Object.hasOwn(data, key) && data[key] !== original?.[key])
  next.geoAccessRevision = accessChanged || !original?.geoAccessRevision ? randomUUID() : original.geoAccessRevision
  if (kind === 'parent') return next
  if (kind === 'memory' && original) {
    for (const key of ['memory', 'dayKey']) {
      if (Object.hasOwn(data, key) && relation(data[key]) !== relation(original[key])) throw new Error('Geo owner identity change requires reviewed mapping')
    }
  }
  const field = kind === 'plan' ? 'planningSections' : 'moments'
  if (!Object.hasOwn(data, field)) return next
  next[field] = rows(data[field], original?.[field], kind === 'plan' ? 'anchor' : 'momentKey', (row, before) => {
    if (kind === 'plan') {
      if (Object.hasOwn(row, 'geoStops')) row.geoStops = rows(row.geoStops, before?.geoStops, 'stopKey', protectGeo)
    } else {
      row = protectGeo(row, before)
      if (Object.hasOwn(row, 'placements')) row.placements = rows(row.placements, before?.placements, 'placementKey', value => value)
    }
    return row
  })
  return next

  function protectGeo(row: Row, before?: Row): Row {
    if (!Object.hasOwn(row, 'geo')) return row
    const geo = geoRecord(row.geo)
    const previous = geoRecord(before?.geo)
    if (!geo) {
      if (previous) throw new Error('Geo removal requires separate review')
      return row
    }
    const oldApproval = previous?.approval
    if (!approvalWrite && Object.hasOwn(geo, 'approval') && !isDeepStrictEqual(geo.approval, oldApproval) && geo.approval != null) throw new Error('Geo approval requires explicit Admin review')
    const merged = { ...previous, ...geo }
    const content = ({ approval: _approval, ...value }: Row) => value
    if (!approvalWrite && (restoring || !isDeepStrictEqual(content(merged), content(previous ?? {})))) merged.approval = null
    return { ...row, geo: merged }
  }
}

function relation(value: unknown): unknown { return geoRecord(value)?.id ?? value }

function rows(value: unknown, previous: unknown, key: string, transform: (row: Row, before?: Row) => Row): Row[] {
  if (!Array.isArray(value)) throw new Error('Geo row removal requires separate review')
  const old = Array.isArray(previous) ? previous.map(geoRecord).filter((item): item is Row => Boolean(item)) : []
  const seen = new Set<string>()
  const result = value.map(candidate => {
    const row = geoRecord(candidate)
    if (!row) throw new Error('Stable identity requires a row')
    const before = old.find(item => row.id != null && item.id === row.id) ?? old.find(item => row[key] && item[key] === row[key])
    if (before && (typeof before[key] !== 'string' || !before[key])) throw new Error('Legacy identity requires reviewed mapping')
    if (before && Object.hasOwn(row, key) && row[key] !== before[key]) throw new Error('Stable identity change requires reviewed mapping')
    if (!before && row.id != null && old.length && key !== 'anchor' && typeof row[key] === 'string' && row[key]) throw new Error('Unknown row identity requires reviewed mapping')
    const identity = row[key] ?? before?.[key] ?? (key === 'anchor' ? undefined : `${key}:${randomUUID()}`)
    if (typeof identity !== 'string' || !identity.trim() || seen.has(identity)) throw new Error('Stable keys must be nonempty and unique')
    seen.add(identity)
    return transform({ ...before, ...row, [key]: identity, id: before?.id ?? randomUUID() }, before)
  })
  for (const before of old) {
    if (!result.some(row => row[key] === before[key]) && hasGeo(before)) throw new Error('Geo row removal or identity change requires separate review')
  }
  return result
}

function hasGeo(row: Row): boolean {
  if (geoRecord(row.geo)) return true
  return Array.isArray(row.geoStops) && row.geoStops.some(item => Boolean(geoRecord(item)?.geo))
}
