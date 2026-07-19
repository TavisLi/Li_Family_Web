import assert from 'node:assert/strict'

import type { TravelSeed } from './seed-content'
import {
  buildTravelSeedTarget,
  travelSeedStatBucket,
  writeTravelSeedTarget,
} from './travel-seed-target'

assert.equal(travelSeedStatBucket('create', 'safe'), 'created')
assert.equal(travelSeedStatBucket('skip', 'safe'), 'skipped')
assert.equal(travelSeedStatBucket('already-converged', 'safe'), 'skipped')
assert.equal(travelSeedStatBucket('preserve-current', 'safe'), 'skipped')
assert.equal(travelSeedStatBucket('preserve-current', 'payload-wins'), 'updated')
assert.equal(travelSeedStatBucket('apply-source', 'source-wins'), 'updated')

const planningTravel: TravelSeed = {
  slug: '202801-family-plan',
  title: '2028 家庭旅行計畫',
  status: 'planning',
  isPrivate: true,
  startDate: '2028-01-10',
  endDate: '2028-01-16',
  externalDocIdentifier: '202801家庭旅行7日.md',
  lodgings: [
    {
      dateRange: '1/10~1/12',
      hotel: 'Legacy Hotel',
    },
  ],
  sourceSections: [
    {
      level: 2,
      title: '住宿安排',
      anchor: 'lodging-plan',
      body: '以這個 planning section 作為正式住宿內容。',
      enableComments: true,
      enableThumbsUp: false,
      enableThumbsDown: true,
    },
  ],
}

const planningTarget = buildTravelSeedTarget(planningTravel, {
  ...planningTravel,
  coverImage: 101,
})

assert.equal(planningTarget.collection, 'travel-plans')
assert.equal(planningTarget.source.slug, planningTravel.slug)
assert.equal(planningTarget.source._status, 'published')
assert.equal(planningTarget.source.coverImage, 101)
assert.equal(planningTarget.source.lodgings, undefined)
assert.deepEqual(planningTarget.source.planningSections, [
  {
    level: 2,
    title: '住宿安排',
    anchor: 'lodging-plan',
    body: '以這個 planning section 作為正式住宿內容。',
    interactions: {
      commentsEnabled: true,
      thumbsUpEnabled: false,
      thumbsDownEnabled: true,
    },
  },
])
assert.deepEqual(planningTarget.data.sourceMetadata, {
  sourceFile: planningTravel.externalDocIdentifier,
  sourceHash: planningTarget.sourceHash,
  parserVersion: 'phase-17-plan-v1',
  baseProjection: planningTarget.source,
})

const memoryTravel: TravelSeed = {
  slug: '202701-family-memory',
  title: '2027 家庭旅行回憶',
  status: 'completed',
  isPrivate: false,
  startDate: '2027-01-10',
  endDate: '2027-01-16',
  externalDocIdentifier: '202701家庭旅行7日.md',
  dailyItinerary: [
    {
      day: 1,
      date: '1/10',
      title: '抵達目的地',
      segments: [{ activity: '入住飯店' }],
    },
  ],
  sourceSections: [
    {
      level: 2,
      title: '旅行開場',
      anchor: 'opening',
      body: '第一天的家庭記錄。',
    },
  ],
}

const memoryTarget = buildTravelSeedTarget(memoryTravel, {
  ...memoryTravel,
  galleryImages: [201, 202],
})

assert.equal(memoryTarget.collection, 'travel-memories')
assert.deepEqual(memoryTarget.source.galleryImages, [201, 202])
assert.equal(
  (memoryTarget.source.dailyHighlights as { title: string }[] | undefined)?.[0]?.title,
  '抵達目的地',
)
assert.equal(
  (memoryTarget.source.storySections as { anchor: string }[] | undefined)?.[0]?.anchor,
  'opening',
)
assert.equal(memoryTarget.data.sourceMetadata.parserVersion, 'phase-17-memory-v1')

const writes: Record<string, unknown>[] = []
const createResult = await writeTravelSeedTarget({
  mode: 'safe',
  now: '2027-07-01T00:00:00.000Z',
  store: {
    async find(args) {
      writes.push({ operation: 'find', ...args })
      return { docs: [] }
    },
    async create(args) {
      writes.push({ operation: 'create', ...args })
      return { id: 301 }
    },
    async update(args) {
      writes.push({ operation: 'update', ...args })
      return { id: args.id }
    },
  },
  target: planningTarget,
})

assert.equal(createResult.action, 'create')
assert.equal(createResult.id, 301)
assert.equal(writes[0]?.collection, 'travel-plans')
assert.equal(writes[1]?.collection, 'travel-plans')
assert.equal(
  ((writes[1]?.data as Record<string, unknown>).sourceMetadata as Record<string, unknown>)
    .lastImportedAt,
  '2027-07-01T00:00:00.000Z',
)

const localizedBase = {
  ...planningTarget.source,
  title: { 'zh-TW': planningTravel.title, en: '2028 Family Travel Plan' },
  planningSections: [
    {
      level: 2,
      title: { 'zh-TW': '住宿安排', en: 'Lodging plan' },
      anchor: 'lodging-plan',
      body: {
        'zh-TW': '以這個 planning section 作為正式住宿內容。',
        en: 'The planning section owns lodging content.',
      },
      interactions: {
        commentsEnabled: true,
        thumbsUpEnabled: false,
        thumbsDownEnabled: true,
      },
    },
  ],
}
const localizedWrites: Record<string, unknown>[] = []
const localizedResult = await writeTravelSeedTarget({
  mode: 'safe',
  store: {
    async find() {
      return {
        docs: [
          {
            id: 302,
            ...planningTarget.source,
            sourceMetadata: { baseProjection: localizedBase },
          },
        ],
      }
    },
    async create(args) {
      localizedWrites.push({ operation: 'create', ...args })
      return { id: 302 }
    },
    async update(args) {
      localizedWrites.push({ operation: 'update', ...args })
      return { id: args.id }
    },
  },
  target: planningTarget,
})

assert.equal(localizedResult.action, 'skip')
assert.equal(localizedResult.conflicts.length, 0)
assert.equal(localizedWrites.length, 0)

const adminWrites: Record<string, unknown>[] = []
const adminEditResult = await writeTravelSeedTarget({
  mode: 'safe',
  store: {
    async find() {
      return {
        docs: [
          {
            id: 303,
            ...planningTarget.source,
            title: 'Admin 修正後的旅行名稱',
            sourceMetadata: { baseProjection: localizedBase },
          },
        ],
      }
    },
    async create(args) {
      adminWrites.push({ operation: 'create', ...args })
      return { id: 303 }
    },
    async update(args) {
      adminWrites.push({ operation: 'update', ...args })
      return { id: args.id }
    },
  },
  target: planningTarget,
})

assert.equal(adminEditResult.action, 'preserve-current')
assert.equal(adminWrites.length, 0)
