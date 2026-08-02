import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import type { Media, TravelMemoryDay } from '@/payload/payload-types'
import type {
  TravelMemoryDayView,
  TravelMemoryGallery,
  TravelMemoryOverview,
  TravelMemoryPresentationStyle,
} from '@/lib/travel-memory'
import {
  TravelMemoryDayPage,
  TravelMemoryGalleryPage,
  TravelMemoryOverviewPage,
} from './travel-memory-pages'

const styles: TravelMemoryPresentationStyle[] = [
  'editorial-journal',
  'cinematic-timeline',
  'family-scrapbook',
]

for (const style of styles) {
  const html = renderToStaticMarkup(
    <TravelMemoryOverviewPage memory={overview(style)} />,
  )
  assert.match(html, new RegExp(`data-travel-memory-style="${style}"`))
  assert.match(html, /href="\/travel\/201307-hainan\/day\/day-08"/)
  assert.match(html, /完整相簿/)
}

const photo: Media = {
  id: 31,
  type: 'photo',
  altText: '海上觀音的無障礙替代文字',
  url: '/media/guanyin.jpeg',
  width: 1200,
  height: 800,
  updatedAt: '2026-08-02T00:00:00.000Z',
  createdAt: '2026-08-02T00:00:00.000Z',
}

const day: TravelMemoryDay = {
  id: 3,
  memory: 1,
  dayIdentity: '1:day-03',
  dayKey: 'day-03',
  day: 3,
  title: '三亞市區觀光',
  moments: [
    {
      momentKey: 'nanshan-sea-guanyin',
      time: '11:00',
      location: '南山文化旅遊區',
      title: '海上觀音',
      placements: [
        {
          placementKey: 'guanyin-photo',
          type: 'photo',
          media: photo,
          caption: '南山文化旅遊區的海上觀音。',
        },
        {
          placementKey: 'guanyin-video',
          type: 'youtube',
          youtubeUrl: 'https://youtu.be/lYP3m2N8yvs',
          caption: '當日旅行影片',
        },
        {
          placementKey: 'unsupported-video',
          type: 'youtube',
          youtubeUrl: 'https://youtube.com/live/example123',
          caption: '直播紀錄',
        },
      ],
    },
  ],
  updatedAt: '2026-08-02T00:00:00.000Z',
  createdAt: '2026-08-02T00:00:00.000Z',
}

const dayView: TravelMemoryDayView = {
  memory: overview('family-scrapbook'),
  day,
  previousDay: { dayKey: 'day-02', title: '亞龍灣' },
  nextDay: { dayKey: 'day-04', title: '鳥巢度假村' },
}
const dayHtml = renderToStaticMarkup(<TravelMemoryDayPage view={dayView} />)
assert.match(dayHtml, /南山文化旅遊區的海上觀音。/)
assert.match(dayHtml, /alt="海上觀音的無障礙替代文字"/)
assert.match(dayHtml, /youtube-nocookie\.com\/embed\/lYP3m2N8yvs/)
assert.match(dayHtml, /loading="lazy"/)
assert.doesNotMatch(dayHtml, /autoplay=1/)
assert.match(dayHtml, /href="https:\/\/youtube\.com\/live\/example123"/)
assert.match(dayHtml, /href="\/travel\/201307-hainan\/day\/day-04"/)

const emptyDayHtml = renderToStaticMarkup(
  <TravelMemoryDayPage view={{ ...dayView, day: { ...day, moments: [] } }} />,
)
assert.match(emptyDayHtml, /這一天尚未配置照片或影片/)

const gallery: TravelMemoryGallery = {
  memory: overview('family-scrapbook'),
  selectedDayKey: null,
  items: [
    {
      placementKey: 'guanyin-photo',
      dayKey: 'day-03',
      day: 3,
      momentKey: 'nanshan-sea-guanyin',
      location: '南山文化旅遊區',
      time: '11:00',
      caption: '南山文化旅遊區的海上觀音。',
      media: photo,
    },
  ],
}
const galleryHtml = renderToStaticMarkup(<TravelMemoryGalleryPage gallery={gallery} />)
assert.match(galleryHtml, /href="\/travel\/201307-hainan\/photos\?day=day-03"/)
assert.match(
  galleryHtml,
  /href="\/travel\/201307-hainan\/day\/day-03#moment-nanshan-sea-guanyin"/,
)
assert.match(galleryHtml, /南山文化旅遊區的海上觀音。/)

console.log('travel memory page tests passed')

function overview(style: TravelMemoryPresentationStyle): TravelMemoryOverview {
  return {
    title: '海南旅行回憶',
    slug: '201307-hainan',
    startDate: '2013-07-27T00:00:00.000Z',
    endDate: '2013-08-03T00:00:00.000Z',
    presentationStyle: style,
    days: Array.from({ length: 8 }, (_, index) => ({
      dayKey: `day-${String(index + 1).padStart(2, '0')}`,
      day: index + 1,
      title: `第 ${index + 1} 日`,
    })),
  }
}
