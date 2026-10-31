const contentFields = ['name', 'latitude', 'longitude', 'crs', 'provenance', 'originalCRS'] as const

// This validates a complete content value, not a Payload record or an approval.
// Missing keys are rejected so an incomplete Source cannot erase stored values.
export function canonicalGeo(value: unknown): string {
  const geo = completeObject(value, contentFields)
  const name = completeObject(geo.name, ['zh-TW', 'en'])
  for (const locale of ['zh-TW', 'en']) nullableText(name[locale])
  for (const field of ['crs', 'provenance', 'originalCRS']) nullableText(geo[field])
  const { latitude, longitude } = geo
  if (!(latitude === null && longitude === null) && !(
    typeof latitude === 'number' && Number.isFinite(latitude) && Math.abs(latitude) <= 90 &&
    typeof longitude === 'number' && Number.isFinite(longitude) && Math.abs(longitude) <= 180
  )) throw new Error('Geo coordinates must be a complete finite pair in range, or both null')
  return JSON.stringify({
    name: { 'zh-TW': name['zh-TW'], en: name.en },
    latitude, longitude, crs: geo.crs, provenance: geo.provenance, originalCRS: geo.originalCRS,
  })
}

type GeoReconciliation = {
  action: 'create' | 'update' | 'preserve' | 'conflict' | 'skip'
  value: unknown
  base: unknown
}

// `undefined` Current denotes a new entry; an existing entry without geo must
// pass null. Returned Base is only a candidate: the writer must read back the
// corresponding successful content write before accepting it.
export function reconcileTravelGeo(source: unknown, base: unknown, current: unknown): GeoReconciliation {
  const unchanged = (action: GeoReconciliation['action']): GeoReconciliation => ({ action, value: current, base })
  if (source === undefined) return unchanged('skip')
  if (source === null) return unchanged('conflict')
  const sourceValue = canonicalGeo(source)
  if (current === undefined && base === undefined) return { action: 'create', value: source, base: source }
  const baseValue = validCanonical(base)
  if (baseValue === undefined) return unchanged('preserve')
  const currentValue = validCanonical(current)
  if (sourceValue === baseValue) return unchanged('preserve')
  if (currentValue === sourceValue) return { action: 'preserve', value: current, base: source }
  if (currentValue === baseValue) return { action: 'update', value: source, base: source }
  return unchanged('conflict')
}

function validCanonical(value: unknown): string | undefined {
  try { return canonicalGeo(value) } catch { return undefined }
}

function completeObject(value: unknown, fields: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Geo requires a complete explicit object')
  const record = value as Record<string, unknown>
  if (Object.keys(record).length !== fields.length || fields.some(field => !Object.hasOwn(record, field))) {
    throw new Error('Geo requires every content field explicitly and no unknown fields')
  }
  return record
}

function nullableText(value: unknown): void {
  if (value !== null && typeof value !== 'string') throw new Error('Geo text must be an explicit string or null')
}
