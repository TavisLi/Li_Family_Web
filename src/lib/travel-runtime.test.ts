import assert from 'node:assert/strict'

import type { HomeConfig, TravelMemory, TravelPlan } from '@/payload/payload-types'
import {
  mergeTravelRuntimeRecords,
  resolveTravelRuntimeRelationship,
  toTravelRuntimeRecord,
} from './travel-runtime'

const plan: TravelPlan = {
  id: 11,
  title: '重慶測試計畫',
  slug: '202607-chongqing-yangtze-river',
  startDate: '2026-07-01T00:00:00.000Z',
  endDate: '2026-07-08T00:00:00.000Z',
  members: [],
  guestParticipants: [{ name: 'Guest', note: 'Plan guest', id: 'guest-1' }],
  planningSections: [
    {
      level: 2,
      title: '行前確認',
      anchor: 'checklist',
      body: '確認護照與行李。',
      links: [{ label: 'Checklist', url: 'https://example.com', id: 'link-1' }],
      interactions: {
        commentsEnabled: true,
        thumbsUpEnabled: false,
        thumbsDownEnabled: true,
      },
      id: 'section-1',
    },
  ],
  sourceMetadata: { sourceFile: 'content-source/travels/chongqing.md' },
  updatedAt: '2026-07-17T00:00:00.000Z',
  createdAt: '2026-07-16T00:00:00.000Z',
  _status: 'published',
}

const record = toTravelRuntimeRecord('travel-plans', plan)

assert.equal(record.id, 'travel-plans:11')
assert.equal(record.kind, 'plan')
assert.equal(record.status, 'planning')
assert.equal(record.slug, plan.slug)
assert.equal(record.externalDocIdentifier, plan.sourceMetadata?.sourceFile)
assert.deepEqual(record.party, plan.guestParticipants)
assert.deepEqual(record.sourceSections, [
  {
    level: 2,
    title: '行前確認',
    anchor: 'checklist',
    body: '確認護照與行李。',
    links: [{ label: 'Checklist', url: 'https://example.com', id: 'link-1' }],
    mediaItems: undefined,
    enableComments: true,
    enableThumbsUp: false,
    enableThumbsDown: true,
    id: 'section-1',
  },
])

const memory: TravelMemory = {
  id: 11,
  title: '海南旅行回憶',
  slug: '201307-hainan',
  startDate: '2013-07-01T00:00:00.000Z',
  endDate: '2013-07-08T00:00:00.000Z',
  participants: [],
  guestParticipants: [{ name: 'Memory guest', id: 'guest-2' }],
  presentationStyle: 'family-scrapbook',
  originPlan: plan,
  galleryImages: [],
  itineraryImages: [],
  dailyHighlights: [
    {
      title: '抵達三亞',
      story: '第一天的回憶。',
      segments: [{ activity: '抵達飯店', id: 'segment-1' }],
      id: 'day-1',
    },
  ],
  travelLedger: {
    flights: [{ flightNumber: 'CI123', route: 'TPE → SYX', id: 'flight-1' }],
    lodgings: [{ hotel: '亞龍灣飯店', startDate: '2013-07-01', endDate: '2013-07-03' }],
  },
  storySections: [
    {
      level: 2,
      title: '旅程開場',
      anchor: 'opening',
      body: '海南回憶正文。',
      interactions: {
        commentsEnabled: false,
        thumbsUpEnabled: true,
        thumbsDownEnabled: false,
      },
      id: 'story-1',
    },
  ],
  externalVideos: [{ title: '海南影片', url: 'https://youtu.be/example', id: 'video-1' }],
  sourceMetadata: { sourceFile: 'content-source/travels/hainan.md' },
  updatedAt: '2026-07-17T00:00:00.000Z',
  createdAt: '2026-07-16T00:00:00.000Z',
  _status: 'published',
}

const memoryRecord = toTravelRuntimeRecord('travel-memories', memory)

assert.equal(memoryRecord.id, 'travel-memories:11')
assert.equal(memoryRecord.kind, 'memory')
assert.equal(memoryRecord.status, 'completed')
assert.equal(memoryRecord.presentationStyle, 'family-scrapbook')
assert.deepEqual(memoryRecord.originPlan, {
  collection: 'travel-plans',
  sourceId: plan.id,
})
assert.deepEqual(memoryRecord.party, memory.guestParticipants)
assert.equal(memoryRecord.dailyItinerary?.[0]?.day, 1)
assert.equal(memoryRecord.dailyItinerary?.[0]?.segments?.[0]?.activity, '抵達飯店')
assert.equal(memoryRecord.flights?.[0]?.flightNumber, 'CI123')
assert.equal(memoryRecord.lodgings?.[0]?.dateRange, '2013-07-01 - 2013-07-03')
assert.deepEqual(memoryRecord.externalVideos, [
  {
    title: '海南影片',
    youtubeUrl: 'https://youtu.be/example',
    id: 'video-1',
  },
])
assert.equal(memoryRecord.sourceSections?.[0]?.anchor, 'opening')
assert.equal(memoryRecord.sourceSections?.[0]?.enableComments, false)

const merged = mergeTravelRuntimeRecords([plan], [memory], 1)

assert.deepEqual(
  merged.map(({ id, slug }) => ({ id, slug })),
  [{ id: 'travel-plans:11', slug: '202607-chongqing-yangtze-river' }],
)

assert.equal(
  resolveTravelRuntimeRelationship(
    { relationTo: 'travel-plans', value: plan },
    [record, memoryRecord],
  )?.id,
  record.id,
)
assert.equal(
  resolveTravelRuntimeRelationship(
    { relationTo: 'travel-memories', value: memory.id } as NonNullable<
      HomeConfig['featuredTravelRecord']
    >,
    [record, memoryRecord],
  )?.id,
  memoryRecord.id,
)
assert.equal(
  resolveTravelRuntimeRelationship(
    { relationTo: 'travel-plans', value: plan },
    [],
  ),
  null,
)

console.log('travel runtime tests passed')
