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

const dayView = toTravelMemoryDayView(memory, days, 'day-03')
assert.equal(dayView?.memory.presentationStyle, 'family-scrapbook')
assert.equal(dayView?.previousDay, null)
assert.equal(dayView?.nextDay?.dayKey, 'day-04')
assert.equal(toTravelMemoryDayView(memory, days, 'day-08'), null)

const gallery = toTravelMemoryGallery(memory, days)
assert.equal(gallery.items.length, 1)
assert.equal(gallery.items[0]?.caption, '南山文化旅遊區的海上觀音。')
assert.equal(gallery.items[0]?.media.altText, '海上觀音替代文字')
assert.equal(toTravelMemoryGallery(memory, days, 'day-04').items.length, 0)

console.log('travel memory domain tests passed')
