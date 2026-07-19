import assert from 'node:assert/strict'

import type { Field } from 'payload'

import { TravelMemories } from './TravelMemories'
import { TravelPlans } from './TravelPlans'
import { TravelRouteIdentities } from './TravelRouteIdentities'
import { Media } from './Media'
import { TimelineEvents } from './TimelineEvents'
import { HomeConfig } from '../globals/HomeConfig'
import { normalizeTravelSlug, validateTravelSlug } from './travel-shared-fields'

function fieldNames(fields: Field[]) {
  return fields.flatMap((field) => ('name' in field && typeof field.name === 'string' ? [field.name] : []))
}

function namedField(fields: Field[], name: string) {
  return fields.find((field) => 'name' in field && field.name === name)
}

const planFieldNames = fieldNames(TravelPlans.fields)
const memoryFieldNames = fieldNames(TravelMemories.fields)

assert.equal(TravelPlans.slug, 'travel-plans')
assert.equal(TravelMemories.slug, 'travel-memories')
assert.equal(TravelRouteIdentities.slug, 'travel-route-identities')
assert.equal(TravelRouteIdentities.admin?.hidden, true)

assert.ok(planFieldNames.includes('planningSections'))
assert.ok(planFieldNames.includes('memories'))
assert.ok(!planFieldNames.includes('status'))
assert.ok(!planFieldNames.includes('storySections'))

const planningSections = namedField(TravelPlans.fields, 'planningSections')
assert.ok(planningSections && planningSections.type === 'array')
const planningSectionFields = planningSections.fields
assert.ok(!fieldNames(planningSectionFields).includes('kind'))
assert.deepEqual(
  fieldNames(planningSectionFields),
  [
    'level',
    'title',
    'anchor',
    'displayDay',
    'displayDate',
    'displaySubtitle',
    'body',
    'links',
    'mediaItems',
    'interactions',
  ],
)

for (const name of ['displayDay', 'displayDate', 'displaySubtitle']) {
  const field = namedField(planningSectionFields, name)
  assert.ok(field && field.type === 'text')
  assert.equal(field.localized, true)
}

const interactions = namedField(planningSectionFields, 'interactions')
assert.ok(interactions && interactions.type === 'group')
assert.deepEqual(fieldNames(interactions.fields), [
  'commentsEnabled',
  'thumbsUpEnabled',
  'thumbsDownEnabled',
])

assert.ok(memoryFieldNames.includes('originPlan'))
assert.ok(memoryFieldNames.includes('storySections'))
assert.ok(memoryFieldNames.includes('itineraryImages'))
assert.ok(memoryFieldNames.includes('reminders'))
assert.ok(!memoryFieldNames.includes('status'))
assert.ok(!memoryFieldNames.includes('planningSections'))

const storySections = namedField(TravelMemories.fields, 'storySections')
assert.ok(storySections && storySections.type === 'array')
const storySectionFields = storySections.fields
assert.deepEqual(
  fieldNames(storySectionFields),
  [
    'level',
    'title',
    'anchor',
    'displayDay',
    'displayDate',
    'displaySubtitle',
    'body',
    'links',
    'mediaItems',
    'interactions',
  ],
)
for (const name of ['displayDay', 'displayDate', 'displaySubtitle']) {
  const field = namedField(storySectionFields, name)
  assert.ok(field && field.type === 'text')
  assert.equal(field.localized, true)
}
const storyInteractions = namedField(storySectionFields, 'interactions')
assert.ok(storyInteractions && storyInteractions.type === 'group')
assert.deepEqual(fieldNames(storyInteractions.fields), [
  'commentsEnabled',
  'thumbsUpEnabled',
  'thumbsDownEnabled',
])

const originPlan = TravelMemories.fields.find(
  (field) => 'name' in field && field.name === 'originPlan',
)
assert.ok(originPlan && originPlan.type === 'relationship')
assert.equal(originPlan.relationTo, 'travel-plans')
assert.equal(originPlan.required, false)
assert.equal(TravelPlans.hooks?.beforeValidate?.length, 1)
assert.equal(TravelMemories.hooks?.beforeValidate?.length, 1)
assert.equal(TravelPlans.hooks?.afterChange?.length, 1)
assert.equal(TravelMemories.hooks?.afterChange?.length, 1)
assert.equal(normalizeTravelSlug('  2027-Phuket  '), '2027-phuket')
assert.equal(validateTravelSlug('2027-phuket'), true)
assert.notEqual(validateTravelSlug('2027 Phuket'), true)

const readAccess = TravelPlans.access?.read
assert.equal(typeof readAccess, 'function')
if (typeof readAccess === 'function') {
  assert.equal(await readAccess({ req: { user: { role: 'admin' } } } as never), true)
  assert.deepEqual(await readAccess({ req: { user: { role: 'family' } } } as never), {
    _status: { equals: 'published' },
  })
  assert.deepEqual(await readAccess({ req: { user: null } } as never), {
    and: [
      { isPrivate: { equals: false } },
      { _status: { equals: 'published' } },
    ],
  })
}

const sourceMetadata = TravelPlans.fields.find(
  (field) => 'name' in field && field.name === 'sourceMetadata',
)
assert.ok(sourceMetadata && sourceMetadata.type === 'group')
assert.equal(sourceMetadata.admin?.readOnly, true)

for (const [fields, name] of [
  [Media.fields, 'relatedTravelRecord'],
  [TimelineEvents.fields, 'relatedTravelRecord'],
] as const) {
  const relationship = namedField(fields, name)
  assert.ok(relationship && relationship.type === 'relationship')
  assert.deepEqual(relationship.relationTo, ['travel-plans', 'travel-memories'])
  assert.equal(relationship.required, false)
}

const featuredTravelRecord = namedField(HomeConfig.fields, 'featuredTravelRecord')
assert.ok(featuredTravelRecord && featuredTravelRecord.type === 'relationship')
assert.deepEqual(featuredTravelRecord.relationTo, ['travel-plans', 'travel-memories'])
assert.equal(featuredTravelRecord.required, false)

assert.equal(namedField(Media.fields, 'relatedTravel'), undefined)
assert.equal(namedField(TimelineEvents.fields, 'relatedTravel'), undefined)
assert.equal(namedField(HomeConfig.fields, 'featuredTravel'), undefined)
