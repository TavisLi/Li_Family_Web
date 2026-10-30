export interface Wgs84Coordinate {
  readonly crs: 'WGS84'
  readonly longitude: number
  readonly latitude: number
}

export interface TravelAtlasEntry<T = unknown> {
  /** Stable identity from the owning Plan section or Memory Moment. */
  readonly id: string
  readonly title: string
  readonly coordinate?: unknown
  readonly item: T
}

export interface TravelAtlasMapMarker<T = unknown> {
  readonly id: string
  readonly title: string
  readonly coordinate: Wgs84Coordinate
  readonly item: T
}

export interface TravelAtlasMarkerGroup<T = unknown> {
  readonly id: string
  readonly coordinate: Wgs84Coordinate
  readonly markers: readonly TravelAtlasMapMarker<T>[]
}

export interface TravelAtlasProjection<T = unknown> {
  readonly listItems: readonly TravelAtlasEntry<T>[]
  readonly markers: readonly TravelAtlasMapMarker<T>[]
  readonly groups: readonly TravelAtlasMarkerGroup<T>[]
}

export type TravelAtlasRendererAvailability =
  | 'disabled'
  | 'loading'
  | 'ready'
  | 'webgl-unsupported'
  | 'provider-error'

export type TravelAtlasState =
  | { status: 'loading'; list: 'available' }
  | { status: 'ready'; list: 'available' }
  | { status: 'empty'; reason: 'no-items' | 'no-valid-coordinates'; list: 'available' }
  | {
      status: 'unavailable'
      reason: 'disabled' | 'webgl-unsupported' | 'provider-error'
      list: 'available'
    }

export type CoordinateValidationResult =
  | { valid: true; coordinate: Wgs84Coordinate }
  | {
      valid: false
      reason: 'missing' | 'partial' | 'invalid-shape' | 'invalid-number' | 'out-of-range' | 'unsupported-crs'
    }

/** Validate an explicit WGS84 pair; this does not convert other coordinate systems. */
export function validateWgs84Coordinate(input: unknown): CoordinateValidationResult {
  if (input === null || input === undefined) {
    return { valid: false, reason: 'missing' }
  }

  if (typeof input !== 'object' || Array.isArray(input)) {
    return { valid: false, reason: 'invalid-shape' }
  }

  const value = input as Record<string, unknown>
  if (Object.hasOwn(value, 'crs') && value.crs !== 'WGS84') {
    return { valid: false, reason: 'unsupported-crs' }
  }

  const hasLongitude = value.longitude !== null && value.longitude !== undefined
  const hasLatitude = value.latitude !== null && value.latitude !== undefined

  if (!hasLongitude && !hasLatitude) {
    return { valid: false, reason: 'missing' }
  }

  if (!hasLongitude || !hasLatitude) {
    return { valid: false, reason: 'partial' }
  }

  if (value.crs !== 'WGS84') {
    return { valid: false, reason: 'unsupported-crs' }
  }

  if (
    typeof value.longitude !== 'number' ||
    typeof value.latitude !== 'number' ||
    !Number.isFinite(value.longitude) ||
    !Number.isFinite(value.latitude)
  ) {
    return { valid: false, reason: 'invalid-number' }
  }

  if (
    value.longitude < -180 ||
    value.longitude > 180 ||
    value.latitude < -90 ||
    value.latitude > 90
  ) {
    return { valid: false, reason: 'out-of-range' }
  }

  return {
    valid: true,
    coordinate: {
      crs: 'WGS84',
      longitude: value.longitude,
      latitude: value.latitude,
    },
  }
}

/**
 * Build a renderer-neutral projection from entries already authorized for the
 * current reader. Invalid or missing coordinates omit only the marker; every
 * entry remains available to the text list. Exact coordinate matches group;
 * names, proximity, and array positions never establish identity.
 */
export function projectTravelAtlasEntries<T>(
  authorizedEntries: readonly TravelAtlasEntry<T>[],
): TravelAtlasProjection<T> {
  const markers: TravelAtlasMapMarker<T>[] = []
  const groups = new Map<string, { id: string; coordinate: Wgs84Coordinate; markers: TravelAtlasMapMarker<T>[] }>()

  for (const entry of authorizedEntries) {
    const result = validateWgs84Coordinate(entry.coordinate)
    if (!result.valid) continue

    const marker = { id: entry.id, title: entry.title, coordinate: result.coordinate, item: entry.item }
    markers.push(marker)

    const groupId = `coordinate:${result.coordinate.longitude},${result.coordinate.latitude}`
    const group = groups.get(groupId)
    if (group) {
      group.markers.push(marker)
    } else {
      groups.set(groupId, { id: groupId, coordinate: result.coordinate, markers: [marker] })
    }
  }

  return { listItems: authorizedEntries, markers, groups: [...groups.values()] }
}

/** Resolve renderer state without ever removing the equivalent text list. */
export function resolveTravelAtlasState<T>(
  projection: TravelAtlasProjection<T>,
  availability: TravelAtlasRendererAvailability,
): TravelAtlasState {
  if (projection.listItems.length === 0) {
    return { status: 'empty', reason: 'no-items', list: 'available' }
  }

  if (projection.markers.length === 0) {
    return { status: 'empty', reason: 'no-valid-coordinates', list: 'available' }
  }

  if (availability === 'loading') {
    return { status: 'loading', list: 'available' }
  }

  if (availability === 'ready') {
    return { status: 'ready', list: 'available' }
  }

  return { status: 'unavailable', reason: availability, list: 'available' }
}

/** Keep selection by stable item identity; clear it when the visible set changes. */
export function resolveTravelAtlasSelection(
  selectedItemId: string | null,
  visibleItemIds: readonly string[],
): string | null {
  return selectedItemId !== null && visibleItemIds.includes(selectedItemId) ? selectedItemId : null
}

export type GoogleMapsNavigationResult =
  | { status: 'ready'; href: string; destination: 'coordinates' | 'address' }
  | { status: 'unavailable'; reason: 'missing-destination' | 'invalid-coordinate' | 'unsupported-crs' }

/**
 * Build, but do not open or request, a Google Maps URL. Call only after the
 * reader explicitly selects an already-authorized destination. No origin or
 * other travel stops are included; unverified coordinate systems are rejected.
 */
export function buildGoogleMapsNavigation(input: {
  coordinate?: unknown
  address?: unknown
}): GoogleMapsNavigationResult {
  const coordinateResult = validateWgs84Coordinate(input.coordinate)

  if (coordinateResult.valid) {
    return googleMapsUrl(
      `${coordinateResult.coordinate.latitude},${coordinateResult.coordinate.longitude}`,
      'coordinates',
    )
  }

  if (coordinateResult.reason !== 'missing') {
    return {
      status: 'unavailable',
      reason: coordinateResult.reason === 'unsupported-crs' ? 'unsupported-crs' : 'invalid-coordinate',
    }
  }

  const address = typeof input.address === 'string' ? input.address.trim() : ''
  return address ? googleMapsUrl(address, 'address') : { status: 'unavailable', reason: 'missing-destination' }
}

function googleMapsUrl(
  destination: string,
  destinationType: 'coordinates' | 'address',
): GoogleMapsNavigationResult {
  const query = new URLSearchParams({ api: '1', destination })
  return {
    status: 'ready',
    href: `https://www.google.com/maps/dir/?${query.toString()}`,
    destination: destinationType,
  }
}
