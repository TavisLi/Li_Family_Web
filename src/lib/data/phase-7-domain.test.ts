import assert from 'node:assert/strict'

import {
  buildBucketCompletionTimelineEvent,
  groupTimelineEventsByYear,
  isWrappedAvailable,
  summarizeBucketColumns,
} from './phase-7-domain'

const timelineEvents = [
  {
    id: 1,
    title: '公開的海南記憶',
    eventDate: '2013-07-03T00:00:00.000Z',
    year: 2013,
    isPrivate: false,
  },
  {
    id: 2,
    title: '家人限定的東澳小事',
    eventDate: '2023-08-06T00:00:00.000Z',
    year: 2023,
    isPrivate: true,
  },
  {
    id: 3,
    title: '重慶行前願望',
    eventDate: '2026-07-01T00:00:00.000Z',
    year: 2026,
    isPrivate: true,
  },
]

assert.deepEqual(
  groupTimelineEventsByYear(timelineEvents, { includePrivate: false }).map((group) => ({
    year: group.year,
    titles: group.events.map((event) => event.title),
  })),
  [
    {
      year: 2013,
      titles: ['公開的海南記憶'],
    },
  ],
)

assert.deepEqual(
  groupTimelineEventsByYear(timelineEvents, { includePrivate: true }).map((group) => group.year),
  [2026, 2023, 2013],
)

assert.deepEqual(
  summarizeBucketColumns([
    { id: 1, title: '一起完成家庭相簿', status: 'pool', priority: 3 },
    { id: 2, title: '重慶三峽倒數準備', status: 'in-progress', priority: 1 },
    { id: 3, title: '整理東澳影片', status: 'completed', priority: 2 },
  ]),
  {
    pool: 1,
    'in-progress': 1,
    completed: 1,
  },
)

assert.equal(
  isWrappedAvailable({
    currentDate: new Date('2026-12-20T00:00:00.000Z'),
    snapshot: {
      year: 2026,
      status: 'published',
      publishedAt: '2026-12-18T00:00:00.000Z',
    },
  }),
  true,
)

assert.equal(
  isWrappedAvailable({
    currentDate: new Date('2026-06-14T00:00:00.000Z'),
    snapshot: {
      year: 2026,
      status: 'published',
      publishedAt: '2026-06-01T00:00:00.000Z',
    },
  }),
  false,
)

assert.deepEqual(
  buildBucketCompletionTimelineEvent({
    bucketId: 42,
    title: '一起看一次跨年煙火',
    description: '從願望清單移入時空膠囊。',
    completedAt: '2026-12-31T15:00:00.000Z',
    isPrivate: true,
  }),
  {
    title: '完成願望：一起看一次跨年煙火',
    slug: 'bucket-42-2026-12-31',
    eventDate: '2026-12-31T15:00:00.000Z',
    year: 2026,
    summary: '從願望清單移入時空膠囊。',
    description: '從願望清單移入時空膠囊。',
    sourceType: 'bucket-item',
    isPrivate: true,
    sortOrder: 0,
  },
)
