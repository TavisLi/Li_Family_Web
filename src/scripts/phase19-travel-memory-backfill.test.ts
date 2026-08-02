import assert from 'node:assert/strict'

import type { MediaSeed, TravelSeed } from './seed-content'
import {
  buildPhase19TravelMemoryBackfillPlan,
  type Phase19DayInventory,
} from './phase19-travel-memory-backfill'

const travels: TravelSeed[] = [
  {
    slug: '201307-hainan',
    title: '海南',
    status: 'completed',
    isPrivate: false,
    startDate: '2013-07-27',
    endDate: '2013-08-03',
    externalDocIdentifier: 'hainan.md',
    dailyItinerary: [{ day: 3, title: '三亞市區觀光' }],
  },
  {
    slug: '202308-east-australia',
    title: '東澳',
    status: 'completed',
    isPrivate: false,
    startDate: '2023-08-07',
    endDate: '2023-08-15',
    externalDocIdentifier: 'australia.md',
    dailyItinerary: [{ day: 1, title: '抵達墨爾本' }],
  },
  {
    slug: '202602-thailand-phuket',
    title: '布吉',
    status: 'completed',
    isPrivate: false,
    startDate: '2026-02-10',
    endDate: '2026-02-17',
    externalDocIdentifier: 'phuket.md',
    dailyItinerary: [{ day: 1, title: '抵達布吉' }],
  },
]
const media: MediaSeed[] = [{
  absolutePath: '/tmp/guanyin.jpeg',
  altText: '海上觀音',
  caption: '南山文化旅遊區的海上觀音。',
  day: 3,
  location: '南山文化旅遊區',
  ownerSlug: '201307-hainan',
  ownerType: 'travel',
  sectionId: 'nanshan-sea-guanyin',
  sourcePath: 'content-source/assets/travels/201307-hainan/itinerary/guanyin.jpeg',
  tags: [],
  time: '11:00',
  usage: 'itinerary',
}]

const plan = buildPhase19TravelMemoryBackfillPlan({
  memories: [
    { id: 1, slug: '201307-hainan' },
    { id: 2, slug: '202308-east-australia' },
    { id: 3, slug: '202602-thailand-phuket' },
  ],
  travels,
  mediaItems: media,
  mediaIdsBySourcePath: new Map([[media[0].sourcePath, 99]]),
  currentDays: [],
})

assert.deepEqual(plan.styleUpdates.map(({ slug, after }) => ({ slug, after })), [
  { slug: '201307-hainan', after: 'family-scrapbook' },
  { slug: '202308-east-australia', after: 'cinematic-timeline' },
  { slug: '202602-thailand-phuket', after: 'editorial-journal' },
])
assert.equal(plan.dayCreates.length, 3)
assert.deepEqual(plan.missingMemories, [])
assert.deepEqual(plan.missingMedia, [])
const hainanMoments = plan.dayCreates[0]?.moments as Array<{
  momentKey: string
  placements: Array<{ media: number }>
}>
assert.equal(
  hainanMoments.find((moment) => moment.momentKey === 'nanshan-sea-guanyin')
    ?.placements[0]?.media,
  99,
)

const existingDay = plan.dayCreates[0]
assert.ok(existingDay)
const currentDay = {
  ...existingDay,
  id: 91,
  dayIdentity: String(existingDay.dayIdentity),
} as Phase19DayInventory

const rerun = buildPhase19TravelMemoryBackfillPlan({
  memories: [{ id: 1, slug: '201307-hainan' }],
  travels: [travels[0]],
  mediaItems: media,
  mediaIdsBySourcePath: new Map([[media[0].sourcePath, 99]]),
  currentDays: [currentDay],
})
assert.equal(rerun.dayCreates.length, 0)
assert.equal(rerun.dayUpdates.length, 0)
assert.equal(rerun.dayPlans[0]?.action, 'skip')

const withoutBase = buildPhase19TravelMemoryBackfillPlan({
  memories: [{ id: 1, slug: '201307-hainan' }],
  travels: [travels[0]],
  mediaItems: media,
  mediaIdsBySourcePath: new Map([[media[0].sourcePath, 99]]),
  currentDays: [{ ...currentDay, sourceMetadata: undefined }],
})
assert.equal(withoutBase.dayCreates.length, 0)
assert.equal(withoutBase.dayUpdates.length, 0)
assert.equal(withoutBase.dayPlans[0]?.action, 'preserve-current')

const adminEdited = structuredClone(existingDay)
adminEdited.sourceMetadata = structuredClone(existingDay.sourceMetadata)
const adminMoments = adminEdited.moments as Array<{ momentKey: string; title: string }>
adminMoments[0].title = 'Admin 編輯標題'
const sourceChangedMedia = structuredClone(media)
sourceChangedMedia[0].location = 'Source 新地點'
const conflict = buildPhase19TravelMemoryBackfillPlan({
  memories: [{ id: 1, slug: '201307-hainan' }],
  travels: [travels[0]],
  mediaItems: sourceChangedMedia,
  mediaIdsBySourcePath: new Map([[media[0].sourcePath, 99]]),
  currentDays: [{ ...adminEdited, id: 91, dayIdentity: currentDay.dayIdentity }],
})
assert.equal(conflict.dayPlans[0]?.action, 'conflict')
assert.ok(conflict.dayPlans[0]?.conflicts.length)

console.log('phase 19 backfill planner tests passed')
