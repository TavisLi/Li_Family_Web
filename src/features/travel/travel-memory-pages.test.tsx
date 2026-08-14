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

for (const [slug, style] of [
  ['201307-hainan', styles[2]],
  ['202308-east-australia', styles[1]],
  ['202602-thailand-phuket', styles[0]],
] as const) {
  const html = renderToStaticMarkup(
    <TravelMemoryOverviewPage memory={{ ...overview(style), slug }} />,
  )
  assert.match(html, new RegExp(`data-travel-memory-style="${style}"`))
  assert.match(html, new RegExp(`href="/travel/${slug}/day/day-08"`))
  assert.match(html, /完整相簿/)
  assert.match(html, /8 chapters/)
  assert.doesNotMatch(html, /Eight chapters/)
}

for (const [style, layout, landmark, structure] of [
  ['editorial-journal', 'editorial-overview', '旅行章節', /md:grid-cols-\[0\.7fr_1\.3fr\][\s\S]*<ol/],
  ['cinematic-timeline', 'cinematic-overview', '場次導覽', /場次導覽[\s\S]*overflow-x-auto/],
  ['family-scrapbook', 'scrapbook-overview', '打開哪一天', /rotate-\[-1\.5deg\][\s\S]*sm:grid-cols-2 lg:grid-cols-4/],
] as const) {
  const html = renderToStaticMarkup(<TravelMemoryOverviewPage memory={overview(style)} />)
  assert.match(html, new RegExp(`data-travel-memory-layout="${layout}"`))
  assert.match(html, new RegExp(landmark))
  assert.match(html, structure)
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
for (const [slug, style] of [
  ['201307-hainan', 'family-scrapbook'],
  ['202308-east-australia', 'cinematic-timeline'],
  ['202602-thailand-phuket', 'editorial-journal'],
] as const) {
  const configuredMemory = { ...overview(style), slug }
  const configuredDayHtml = renderToStaticMarkup(
    <TravelMemoryDayPage view={{ ...dayView, memory: configuredMemory }} />,
  )
  assert.match(configuredDayHtml, new RegExp(`data-travel-memory-style="${style}"`))
  assert.match(configuredDayHtml, /南山文化旅遊區的海上觀音。/)
}

for (const [style, layout, landmark, structure] of [
  ['editorial-journal', 'editorial-day', '今日札記', /md:grid-cols-\[0\.34fr_1fr\][\s\S]*<aside[\s\S]*今日札記/],
  ['cinematic-timeline', 'cinematic-day', '當日時間軸', /aria-label="當日時間軸"[\s\S]*href="#moment-nanshan-sea-guanyin"/],
  ['family-scrapbook', 'scrapbook-day', '家庭相簿', /家庭相簿[\s\S]*照片背記/],
] as const) {
  const html = renderToStaticMarkup(
    <TravelMemoryDayPage view={{ ...dayView, memory: overview(style) }} />,
  )
  assert.match(html, new RegExp(`data-travel-memory-layout="${layout}"`))
  assert.match(html, new RegExp(landmark))
  assert.match(html, structure)
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

const photoOnlyDay: TravelMemoryDay = {
  ...day,
  moments: day.moments?.map((moment) => ({
    ...moment,
    placements: moment.placements?.filter((placement) => placement.type === 'photo'),
  })),
}
for (const style of styles) {
  const html = renderToStaticMarkup(
    <TravelMemoryDayPage view={{ ...dayView, day: photoOnlyDay, memory: overview(style) }} />,
  )
  assert.match(html, /這一天沒有已配置的旅行影片/)
  assert.doesNotMatch(html, /youtube-nocookie\.com/)
}

const missingUrlDay: TravelMemoryDay = {
  ...day,
  moments: day.moments?.map((moment) => ({
    ...moment,
    placements: [
      ...(moment.placements?.filter((placement) => placement.type === 'photo') ?? []),
      { placementKey: 'missing-video-url', type: 'youtube' as const },
    ],
  })),
}
for (const style of styles) {
  const html = renderToStaticMarkup(
    <TravelMemoryDayPage view={{ ...dayView, day: missingUrlDay, memory: overview(style) }} />,
  )
  assert.match(html, /這一天沒有已配置的旅行影片/)
}

const day8: TravelMemoryDay = {
  ...day,
  id: 8,
  dayIdentity: '1:day-08',
  dayKey: 'day-08',
  day: 8,
  title: '石梅灣艾美純度假 → 返程',
  moments: [
    {
      momentKey: 'pool',
      title: '旅程最後一次下水',
      placements: [{ placementKey: 'pool-photo', type: 'photo', media: photo, caption: '旅程最後一天的度假亮點。' }],
    },
    {
      momentKey: 'beach',
      title: '在海邊替假期收尾',
      placements: [{ placementKey: 'beach-photo', type: 'photo', media: photo, caption: '為八日旅程留下安靜的尾聲。' }],
    },
  ],
}
const day8Html = renderToStaticMarkup(
  <TravelMemoryDayPage
    view={{ ...dayView, day: day8, memory: overview('family-scrapbook'), previousDay: { dayKey: 'day-07', title: '上一日' }, nextDay: null }}
  />,
)
assert.match(day8Html, /data-travel-memory-layout="scrapbook-day"/)
assert.match(day8Html, /旅程最後一天的度假亮點。/)
assert.match(day8Html, /為八日旅程留下安靜的尾聲。/)
assert.equal((day8Html.match(/<figcaption/g) ?? []).length, 2)
assert.match(day8Html, /href="\/travel\/201307-hainan\/day\/day-07"/)

const gallery: TravelMemoryGallery = {
  memory: overview('family-scrapbook'),
  selectedDayKey: null,
  selectedLocation: null,
  locations: ['南山文化旅遊區'],
  page: 1,
  pageSize: 24,
  totalItems: 1,
  totalPages: 1,
  items: [
    {
      placementKey: 'guanyin-photo',
      dayKey: 'day-03',
      day: 3,
      momentKey: 'nanshan-sea-guanyin',
      location: '南山文化旅遊區',
      time: '11:00',
      caption: '南山文化旅遊區的海上觀音。',
      unclassified: false,
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
assert.match(galleryHtml, /location=/)

for (const [slug, style] of [
  ['201307-hainan', 'family-scrapbook'],
  ['202308-east-australia', 'cinematic-timeline'],
  ['202602-thailand-phuket', 'editorial-journal'],
] as const) {
  const configuredGalleryHtml = renderToStaticMarkup(
    <TravelMemoryGalleryPage
      gallery={{ ...gallery, memory: { ...overview(style), slug } }}
    />,
  )
  assert.match(configuredGalleryHtml, new RegExp(`data-travel-memory-style="${style}"`))
  assert.match(configuredGalleryHtml, /回到每日故事/)
}

for (const [style, layout, landmark, structure] of [
  ['editorial-journal', 'editorial-gallery', '視覺檔案', /md:grid-cols-2[\s\S]*sm:grid-cols-\[7rem_1fr\]/],
  ['cinematic-timeline', 'cinematic-gallery', 'Contact sheet', /bg-white\/10 md:grid-cols-2[\s\S]*aspect-video/],
  ['family-scrapbook', 'scrapbook-gallery', '照片信封', /照片背面[\s\S]*sm:grid-cols-2 lg:grid-cols-3/],
] as const) {
  const html = renderToStaticMarkup(
    <TravelMemoryGalleryPage gallery={{ ...gallery, memory: overview(style) }} />,
  )
  assert.match(html, new RegExp(`data-travel-memory-layout="${layout}"`))
  assert.match(html, new RegExp(landmark))
  assert.match(html, structure)
}

for (const [style, emptyCaption] of [
  ['editorial-journal', '此影像未附敘事說明。'],
  ['cinematic-timeline', 'No scene note.'],
  ['family-scrapbook', '照片背面沒有留下文字。'],
] as const) {
  const html = renderToStaticMarkup(
    <TravelMemoryGalleryPage
      gallery={{ ...gallery, items: [{ ...gallery.items[0], caption: undefined }], memory: overview(style) }}
    />,
  )
  assert.match(html, new RegExp(emptyCaption.replace('.', '\\.')))
  assert.doesNotMatch(html, />海上觀音的無障礙替代文字</)
}

const duplicatePlacementGalleryHtml = renderToStaticMarkup(
  <TravelMemoryGalleryPage
    gallery={{
      ...gallery,
      items: [
        gallery.items[0],
        { ...gallery.items[0], momentKey: 'luhuitou-overlook' },
      ],
    }}
  />,
)
assert.equal((duplicatePlacementGalleryHtml.match(/南山文化旅遊區的海上觀音。/g) ?? []).length, 2)

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
