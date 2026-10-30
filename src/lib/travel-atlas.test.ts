import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildGoogleMapsNavigation,
  projectTravelAtlasEntries,
  resolveTravelAtlasSelection,
  resolveTravelAtlasState,
  validateWgs84Coordinate,
} from './travel-atlas'

test('accepts synthetic WGS84 coordinates at the equator and valid range edges', () => {
  assert.deepEqual(
    validateWgs84Coordinate({ crs: 'WGS84', longitude: 0, latitude: 0 }),
    { valid: true, coordinate: { crs: 'WGS84', longitude: 0, latitude: 0 } },
  )
  assert.equal(
    validateWgs84Coordinate({ crs: 'WGS84', longitude: 180, latitude: 90 }).valid,
    true,
  )
  assert.equal(
    validateWgs84Coordinate({ crs: 'WGS84', longitude: -180, latitude: -90 }).valid,
    true,
  )
})

test('rejects partial, non-finite, out-of-range, and unknown-CRS coordinates', () => {
  assert.deepEqual(
    validateWgs84Coordinate({ crs: 'WGS84', longitude: 121.5 }),
    { valid: false, reason: 'partial' },
  )
  assert.deepEqual(
    validateWgs84Coordinate({ crs: 'WGS84', longitude: Number.NaN, latitude: 25 }),
    { valid: false, reason: 'invalid-number' },
  )
  assert.deepEqual(
    validateWgs84Coordinate({ crs: 'WGS84', longitude: Number.POSITIVE_INFINITY, latitude: 25 }),
    { valid: false, reason: 'invalid-number' },
  )
  assert.deepEqual(
    validateWgs84Coordinate({ crs: 'WGS84', longitude: 181, latitude: 25 }),
    { valid: false, reason: 'out-of-range' },
  )
  assert.deepEqual(
    validateWgs84Coordinate({ crs: 'GCJ-02', longitude: 121.5, latitude: 25 }),
    { valid: false, reason: 'unsupported-crs' },
  )
})

test('projects only valid synthetic markers, keeps every list item, and groups exact coordinates only', () => {
  const entries = [
    {
      id: 'plan:stop-arrival',
      title: '抵達海岸',
      coordinate: { crs: 'WGS84', longitude: 121.5, latitude: 25 },
      item: { kind: 'plan' },
    },
    {
      id: 'memory:moment-sunrise',
      title: '晨光',
      coordinate: { crs: 'WGS84', longitude: 121.5, latitude: 25 },
      item: { kind: 'memory' },
    },
    {
      id: 'plan:stop-nearby',
      title: '抵達海岸',
      coordinate: { crs: 'WGS84', longitude: 121.50001, latitude: 25 },
      item: { kind: 'plan' },
    },
    {
      id: 'memory:moment-no-location',
      title: '沒有位置的故事',
      item: { kind: 'memory' },
    },
  ]

  const projection = projectTravelAtlasEntries(entries)

  assert.equal(projection.listItems, entries)
  assert.deepEqual(
    projection.markers.map((marker) => marker.id),
    ['plan:stop-arrival', 'memory:moment-sunrise', 'plan:stop-nearby'],
  )
  assert.deepEqual(
    projection.groups.map((group) => group.markers.map((marker) => marker.id)),
    [['plan:stop-arrival', 'memory:moment-sunrise'], ['plan:stop-nearby']],
  )
})

test('keeps the text list available for empty, loading, disabled, WebGL, and provider-failure states', () => {
  const populated = projectTravelAtlasEntries([
    {
      id: 'plan:stop-arrival',
      title: '抵達海岸',
      coordinate: { crs: 'WGS84', longitude: 121.5, latitude: 25 },
      item: 'synthetic',
    },
  ])
  const noCoordinates = projectTravelAtlasEntries([
    { id: 'memory:moment-no-location', title: '無地點故事', item: 'synthetic' },
  ])

  assert.deepEqual(resolveTravelAtlasState(populated, 'ready'), {
    status: 'ready',
    list: 'available',
  })
  assert.deepEqual(resolveTravelAtlasState(populated, 'loading'), {
    status: 'loading',
    list: 'available',
  })
  assert.deepEqual(resolveTravelAtlasState(populated, 'disabled'), {
    status: 'unavailable',
    reason: 'disabled',
    list: 'available',
  })
  assert.deepEqual(resolveTravelAtlasState(populated, 'webgl-unsupported'), {
    status: 'unavailable',
    reason: 'webgl-unsupported',
    list: 'available',
  })
  assert.deepEqual(resolveTravelAtlasState(populated, 'provider-error'), {
    status: 'unavailable',
    reason: 'provider-error',
    list: 'available',
  })
  assert.deepEqual(resolveTravelAtlasState(noCoordinates, 'ready'), {
    status: 'empty',
    reason: 'no-valid-coordinates',
    list: 'available',
  })
  assert.deepEqual(resolveTravelAtlasState(projectTravelAtlasEntries([]), 'ready'), {
    status: 'empty',
    reason: 'no-items',
    list: 'available',
  })
})

test('syncs list and marker selection by stable id and clears selections hidden by filtering', () => {
  const visibleIds = ['plan:stop-arrival', 'memory:moment-sunrise']

  assert.equal(resolveTravelAtlasSelection('plan:stop-arrival', visibleIds), 'plan:stop-arrival')
  assert.equal(resolveTravelAtlasSelection('plan:stop-arrival', ['memory:moment-sunrise']), null)
  assert.equal(resolveTravelAtlasSelection(null, visibleIds), null)
})

test('builds an explicit Google Maps URL with lat,lng order and encoded address fallback', () => {
  const coordinateResult = buildGoogleMapsNavigation({
    coordinate: { crs: 'WGS84', longitude: -122.4194, latitude: 37.7749 },
  })

  assert.equal(coordinateResult.status, 'ready')
  if (coordinateResult.status !== 'ready') return

  const coordinateUrl = new URL(coordinateResult.href)
  assert.equal(coordinateUrl.origin, 'https://www.google.com')
  assert.equal(coordinateUrl.pathname, '/maps/dir/')
  assert.equal(coordinateUrl.searchParams.get('api'), '1')
  assert.equal(coordinateUrl.searchParams.get('destination'), '37.7749,-122.4194')
  assert.equal(coordinateUrl.searchParams.has('origin'), false)
  assert.equal(coordinateResult.destination, 'coordinates')

  const addressResult = buildGoogleMapsNavigation({ coordinate: null, address: ' 台北 101 & 信義區 ' })
  assert.equal(addressResult.status, 'ready')
  if (addressResult.status !== 'ready') return

  const addressUrl = new URL(addressResult.href)
  assert.equal(addressUrl.searchParams.get('destination'), '台北 101 & 信義區')
  assert.match(addressUrl.search, /%26/)
  assert.equal(addressResult.destination, 'address')
})

test('does not navigate with unverified CRS or invalid coordinates', () => {
  assert.deepEqual(
    buildGoogleMapsNavigation({
      coordinate: { crs: 'GCJ-02', longitude: 121.5, latitude: 25 },
      address: '明確地址不得覆蓋未知 CRS',
    }),
    { status: 'unavailable', reason: 'unsupported-crs' },
  )
  assert.deepEqual(
    buildGoogleMapsNavigation({
      coordinate: { crs: 'GCJ-02' },
      address: '明確地址不得覆蓋未知 CRS',
    }),
    { status: 'unavailable', reason: 'unsupported-crs' },
  )
  assert.deepEqual(
    buildGoogleMapsNavigation({
      coordinate: { crs: 'WGS84', longitude: 181, latitude: 25 },
    }),
    { status: 'unavailable', reason: 'invalid-coordinate' },
  )
  assert.deepEqual(buildGoogleMapsNavigation({ coordinate: null, address: '   ' }), {
    status: 'unavailable',
    reason: 'missing-destination',
  })
})
