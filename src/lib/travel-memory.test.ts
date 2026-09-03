import assert from 'node:assert/strict'

import {
  presentationStyleForSlug,
  resolveTravelMemoryPresentationStyle,
  travelMemoryPresentationStyles,
  toTravelMemoryDayView,
  toTravelMemoryGallery,
} from './travel-memory'
import type { Media, TravelMemory, TravelMemoryDay } from '@/payload/payload-types'

assert.deepEqual(travelMemoryPresentationStyles, [
  'editorial-journal',
  'cinematic-timeline',
  'family-scrapbook',
])
assert.equal(resolveTravelMemoryPresentationStyle(null), 'editorial-journal')
assert.equal(resolveTravelMemoryPresentationStyle(undefined), 'editorial-journal')
assert.equal(resolveTravelMemoryPresentationStyle('unknown'), 'editorial-journal')
assert.equal(resolveTravelMemoryPresentationStyle('family-scrapbook'), 'family-scrapbook')

assert.equal(presentationStyleForSlug('201307-hainan'), 'family-scrapbook')
assert.equal(presentationStyleForSlug('202308-east-australia'), 'cinematic-timeline')
assert.equal(presentationStyleForSlug('202602-thailand-phuket'), 'editorial-journal')
assert.equal(presentationStyleForSlug('unconfigured-memory'), null)

const media: Media = {
  id: 7,
  type: 'photo',
  altText: '海上觀音替代文字',
  url: '/media/guanyin.jpeg',
  updatedAt: '2026-08-02T00:00:00.000Z',
  createdAt: '2026-08-02T00:00:00.000Z',
}
const memory = {
  id: 1,
  title: '海南旅行回憶',
  slug: '201307-hainan',
  startDate: '2013-07-27T00:00:00.000Z',
  endDate: '2013-08-03T00:00:00.000Z',
  presentationStyle: 'family-scrapbook',
  updatedAt: '2026-08-02T00:00:00.000Z',
  createdAt: '2026-08-02T00:00:00.000Z',
} satisfies TravelMemory
const days = [
  {
    id: 3,
    memory: 1,
    dayIdentity: '1:day-03',
    dayKey: 'day-03',
    day: 3,
    title: '三亞市區觀光',
    moments: [{
      momentKey: 'nanshan-sea-guanyin',
      location: '南山文化旅遊區',
      title: '南山文化旅遊區',
      placements: [{
        placementKey: 'guanyin.jpeg',
        type: 'photo',
        media,
        caption: '南山文化旅遊區的海上觀音。',
      }],
    }],
    updatedAt: '2026-08-02T00:00:00.000Z',
    createdAt: '2026-08-02T00:00:00.000Z',
  },
  {
    id: 4,
    memory: 1,
    dayIdentity: '1:day-04',
    dayKey: 'day-04',
    day: 4,
    title: '亞龍灣',
    updatedAt: '2026-08-02T00:00:00.000Z',
    createdAt: '2026-08-02T00:00:00.000Z',
  },
] satisfies TravelMemoryDay[]

const dayView = toTravelMemoryDayView(memory, days[0], days)
assert.equal(dayView?.memory.presentationStyle, 'family-scrapbook')
assert.equal(dayView?.previousDay, null)
assert.equal(dayView?.nextDay?.dayKey, 'day-04')
assert.equal(toTravelMemoryDayView(memory, { ...days[0], dayKey: 'day-08' }, days), null)

const gallery = toTravelMemoryGallery(memory, days)
assert.equal(gallery.items.length, 1)
assert.equal(gallery.items[0]?.caption, '南山文化旅遊區的海上觀音。')
assert.equal(gallery.items[0]?.type, 'photo')
assert.equal(gallery.items[0]?.type === 'photo' && gallery.items[0].media.altText, '海上觀音替代文字')
assert.equal(toTravelMemoryGallery(memory, days, { dayKey: 'day-04' }).items.length, 0)
const duplicateAssetGallery = toTravelMemoryGallery(memory, [
  days[0],
  {
    ...days[1],
    moments: [{
      momentKey: 'same-asset-second-placement',
      title: '同一資產的重複 placement',
      placements: [{
        placementKey: 'duplicate-guanyin.jpeg',
        type: 'photo',
        media,
        caption: '不應在 Photos 重複顯示。',
      }],
    }],
  },
])
assert.equal(duplicateAssetGallery.items.length, 1)

const galleryOnlyMedia: Media = {
  id: 999,
  type: 'photo',
  altText: '未分類家庭合照',
  url: '/media/unclassified.jpeg',
  updatedAt: '2026-08-02T00:00:00.000Z',
  createdAt: '2026-08-02T00:00:00.000Z',
}
const galleryWithLegacy = toTravelMemoryGallery(
  { ...memory, galleryImages: [galleryOnlyMedia] },
  days,
)
assert.ok(galleryWithLegacy.items.some((item) => item.unclassified))
assert.equal(galleryWithLegacy.items.find((item) => item.unclassified)?.caption, undefined)

const locationPage = toTravelMemoryGallery(
  { ...memory, galleryImages: [galleryOnlyMedia] },
  days,
  { location: '南山文化旅遊區', page: 1, pageSize: 1 },
)
assert.equal(locationPage.selectedLocation, '南山文化旅遊區')
assert.equal(locationPage.pageSize, 1)
assert.equal(locationPage.items.length, 1)
assert.ok(locationPage.locations.includes('南山文化旅遊區'))

const mixedDay: TravelMemoryDay = {
  ...days[0],
  moments: [{
    ...days[0].moments![0],
    placements: [
      ...days[0].moments![0]!.placements,
      { placementKey: 'daily-film', type: 'youtube', youtubeUrl: 'https://youtu.be/lYP3m2N8yvs', caption: '每日影片' },
    ],
  }],
}
const mixedGallery = toTravelMemoryGallery({
  ...memory,
  externalVideos: [{ title: '全旅程影片', url: 'https://www.youtube.com/watch?v=abcdefghijk' }],
}, [mixedDay])
assert.equal(mixedGallery.totalItems, 3, 'Photos includes the photo, daily film and global film')
assert.deepEqual(mixedGallery.items.map((item) => item.caption), ['南山文化旅遊區的海上觀音。', '每日影片', '全旅程影片'])
const videoPage = toTravelMemoryGallery({ ...memory, externalVideos: [{ url: 'https://youtu.be/abcdefghijk' }] }, [mixedDay], { type: 'youtube', pageSize: 1, page: 2 })
assert.equal(videoPage.totalItems, 2, 'type filtering happens before pagination')
assert.equal(videoPage.selectedType, 'youtube')
assert.equal(videoPage.items[0]?.type, 'youtube')
assert.equal(videoPage.items[0]?.dayKey, null)
const dayVideos = toTravelMemoryGallery({ ...memory, externalVideos: [{ url: 'https://youtu.be/abcdefghijk' }] }, [mixedDay], { type: 'youtube', dayKey: 'day-03' })
assert.equal(dayVideos.totalItems, 1)
assert.equal(dayVideos.items[0]?.caption, '每日影片')
assert.equal(toTravelMemoryGallery(memory, [mixedDay], { type: 'photo' }).totalItems, 1)
assert.equal(toTravelMemoryGallery(memory, [mixedDay], { type: 'unknown' }).selectedType, null)
const repeatedDay: TravelMemoryDay = { ...mixedDay, ...days[1], moments: mixedDay.moments }
const repeatedGalleryMemory = {
  ...memory,
  galleryImages: [media, galleryOnlyMedia, galleryOnlyMedia],
  externalVideos: [
    { title: '重複每日影片', url: 'https://www.youtube.com/watch?v=lYP3m2N8yvs&si=tracking' },
    { title: '全旅程影片', url: 'https://youtu.be/abcdefghijk' },
    { title: '重複全旅程影片', url: 'https://youtube.com/shorts/abcdefghijk' },
  ],
}
assert.equal(toTravelMemoryGallery(repeatedGalleryMemory, [mixedDay, repeatedDay]).totalItems, 4, 'deduplicate photos and canonical YouTube identities across owners')
assert.equal(toTravelMemoryGallery(repeatedGalleryMemory, [mixedDay, repeatedDay], { dayKey: 'day-03', type: 'youtube' }).items[0]?.dayKey, 'day-03', 'deduplication must not hide a selected day usage')
assert.equal(toTravelMemoryGallery(repeatedGalleryMemory, [mixedDay, repeatedDay], { dayKey: 'day-04', type: 'photo' }).items[0]?.dayKey, 'day-04')

const videoAliases = toTravelMemoryGallery({ ...memory, externalVideos: [
  { url: 'https://youtube.com/live/lYP3m2N8yvs?si=tracking' },
  { url: 'https://youtube.com/watch?v=lYP3m2N8yvs' },
] }, [])
assert.equal(videoAliases.totalItems, 1, 'live and watch URLs identify the same video even without Days')
const unsafeVideos = toTravelMemoryGallery({ ...memory, externalVideos: [
  { url: 'javascript:alert(1)' }, { url: 'https://youtube.com.evil.test/watch?v=abcdefghijk' },
] }, [{ ...mixedDay, moments: [{ momentKey: 'unsafe', title: 'Unsafe', placements: [
  { placementKey: 'unsafe', type: 'youtube', youtubeUrl: 'http://youtube.com/watch?v=abcdefghijk' },
  { placementKey: 'missing', type: 'youtube' },
] }] }])
assert.equal(unsafeVideos.totalItems, 0, 'unsafe or missing videos do not create gallery frames')

console.log('travel memory domain tests passed')
