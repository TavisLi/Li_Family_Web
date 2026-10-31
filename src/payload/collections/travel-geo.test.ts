import assert from 'node:assert/strict'
import { TravelPlans } from './TravelPlans'
import { TravelMemoryDays } from './TravelMemoryDays'
import { guardTravelGeoIdentity } from './travel-geo'

const planFields = TravelPlans.fields.find(field => 'name' in field && field.name === 'planningSections')
assert.ok(planFields && 'fields' in planFields)
assert.ok(planFields.fields.some(field => 'name' in field && field.name === 'geoStops'), 'Plan needs persisted optional stops')
const dayFields = TravelMemoryDays.fields.find(field => 'name' in field && field.name === 'moments')
assert.ok(dayFields && 'fields' in dayFields)
assert.ok(dayFields.fields.some(field => 'name' in field && field.name === 'geo'), 'Moment needs optional geo')

const geo = { name: 'Place', latitude: 0, longitude: 0, crs: 'WGS84', approval: { snapshot: 'old', audience: 'public' } }
const original = { id: 1, memory: 2, dayKey: 'day-01', geoAccessRevision: 'epoch', moments: [
  { id: 'row', momentKey: 'one', geo, title: 'Old', placements: [{ id: 'p-row', placementKey: 'p', media: 30, caption: 'keep' }] },
] }
const moments = (value: Record<string, unknown>) => value.moments as typeof original.moments
const sections = (value: Record<string, unknown>) => value.planningSections as { geoStops: { stopKey: string }[] }[]
const guard = (data: Record<string, unknown>, before = original) => guardTravelGeoIdentity('memory', data, before)
const edited = guard({ moments: [{ id: 'row', momentKey: 'one', title: 'New' }] })
assert.deepEqual(moments(edited)[0].geo, geo, 'unrelated Admin edits preserve omitted geo')
assert.deepEqual(moments(edited)[0].placements, original.moments[0].placements)
assert.throws(() => guard({ moments: [{ id: 'row', momentKey: 'changed', geo }] }), /identity/)
assert.throws(() => guard({ memory: 3 }), /identity/)
assert.throws(() => guard({ dayKey: 'day-02' }), /identity/)
assert.throws(() => guard({ moments: [] }), /geo.*remov/i)
assert.throws(() => guard({ moments: [{ id: 'row', momentKey: 'one', geo: { ...geo, approval: { snapshot: 'forged' } } }] }), /approval/)
const changed = guard({ moments: [{ id: 'row', momentKey: 'one', geo: { ...geo, latitude: 1 } }] })
assert.equal(moments(changed)[0].geo.approval, null, 'editing a reviewed value revokes its approval')
const reordered = guard({ moments: [{ momentKey: 'one', title: 'Renamed' }] })
assert.equal(moments(reordered)[0].id, 'row', 'stable keys preserve Payload row IDs')
const fresh = guardTravelGeoIdentity('plan', { planningSections: [{ anchor: 'section', geoStops: [{ geo: { name: 'New' } }] }] })
assert.ok(sections(fresh)[0].geoStops[0].stopKey)
const saved = guardTravelGeoIdentity('plan', fresh, { id: 4, ...fresh })
assert.equal(sections(saved)[0].geoStops[0].stopKey, sections(fresh)[0].geoStops[0].stopKey)
assert.throws(() => guardTravelGeoIdentity('plan', { planningSections: [{ anchor: 's', geoStops: [{ stopKey: 'a' }, { stopKey: 'a' }] }] }), /unique/)
console.log('Optional geo model and persistent identity PASS')

assert.equal(TravelPlans.versions && typeof TravelPlans.versions === 'object' && TravelPlans.versions.maxPerDoc, 0,
  'geo review writes must not prune existing Travel history')

const withNewMoment = guard({ moments: [
  { id: 'row', momentKey: 'one' },
  { id: 'new-client-id', title: 'Admin-added moment', placements: [{ id: 'new-placement-client-id', media: 31 }] },
] })
assert.ok(moments(withNewMoment)[1]!.momentKey)
assert.notEqual(moments(withNewMoment)[1]!.id, 'new-client-id', 'new rows receive server-owned row IDs')
assert.ok(moments(withNewMoment)[1]!.placements[0]!.placementKey)
