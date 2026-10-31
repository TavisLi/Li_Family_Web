// Legacy projections cannot safely round-trip geo or its approval metadata.
export function containsTravelGeo(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsTravelGeo)
  if (!value || typeof value !== 'object') return false
  return Object.entries(value).some(([key, item]) =>
    (key === 'atlasGeoV1' && item != null) ||
    (key === 'geo' && item != null) ||
    (key === 'geoStops' && Array.isArray(item) && item.length > 0) ||
    containsTravelGeo(item),
  )
}
