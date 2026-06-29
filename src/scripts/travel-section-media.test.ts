import assert from 'node:assert/strict'

import { attachSourceSectionMediaIds } from './travel-section-media'
import type { MediaSeed, TravelSeed } from './seed-content'

const travel: TravelSeed = {
  title: '初探泰國普吉島',
  slug: '202602-thailand-phuket',
  status: 'completed',
  isPrivate: false,
  startDate: '2026-02-10',
  endDate: '2026-02-17',
  externalDocIdentifier: '202602泰國普吉島8日.md',
  sourceSections: [
    {
      level: 1,
      title: '每日行程',
      anchor: 'daily-itinerary',
      body: '__SECTION_BOUNDARY__',
    },
    {
      level: 2,
      title: 'Day 2 · 邁考海灘看飛機',
      anchor: 'mai-khao-flight-viewing',
      body: '看飛機低空掠過海灘上方。',
    },
    {
      level: 2,
      title: 'Day 3 · 自由活動',
      anchor: 'free-day',
      body: '自由活動。',
    },
  ],
}

const mediaItems: MediaSeed[] = [
  {
    sourcePath: 'content-source/assets/travels/202602-thailand-phuket/gallery/photo-001.jpeg',
    absolutePath: '/tmp/photo-001.jpeg',
    altText: '邁考海灘飛機',
    tags: [],
    ownerType: 'travel',
    ownerSlug: '202602-thailand-phuket',
    usage: 'itinerary',
    sectionId: 'mai-khao-flight-viewing',
  },
  {
    sourcePath: 'content-source/assets/travels/202602-thailand-phuket/gallery/photo-002.jpeg',
    absolutePath: '/tmp/photo-002.jpeg',
    altText: '另一張邁考海灘飛機',
    tags: [],
    ownerType: 'travel',
    ownerSlug: '202602-thailand-phuket',
    usage: 'itinerary',
    sectionId: 'mai-khao-flight-viewing',
  },
  {
    sourcePath: 'content-source/assets/travels/202602-thailand-phuket/gallery/photo-003.jpeg',
    absolutePath: '/tmp/photo-003.jpeg',
    altText: '找不到 media id 的照片',
    tags: [],
    ownerType: 'travel',
    ownerSlug: '202602-thailand-phuket',
    usage: 'itinerary',
    sectionId: 'free-day',
  },
  {
    sourcePath: 'content-source/assets/travels/202308-east-australia/gallery/photo-004.jpeg',
    absolutePath: '/tmp/photo-004.jpeg',
    altText: '其他旅程照片',
    tags: [],
    ownerType: 'travel',
    ownerSlug: '202308-east-australia',
    usage: 'itinerary',
    sectionId: 'mai-khao-flight-viewing',
  },
]

const result = attachSourceSectionMediaIds({
  mediaBySourcePath: new Map([
    ['content-source/assets/travels/202602-thailand-phuket/gallery/photo-001.jpeg', 101],
    ['content-source/assets/travels/202602-thailand-phuket/gallery/photo-002.jpeg', 102],
    ['content-source/assets/travels/202308-east-australia/gallery/photo-004.jpeg', 999],
  ]),
  mediaItems,
  travel,
})

const flightViewing = result.sourceSections?.find(
  (section) => section.anchor === 'mai-khao-flight-viewing',
)
const freeDay = result.sourceSections?.find((section) => section.anchor === 'free-day')

assert.deepEqual(flightViewing?.mediaItems, [101, 102])
assert.equal(freeDay && 'mediaItems' in freeDay, false)
