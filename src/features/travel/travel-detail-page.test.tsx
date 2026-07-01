import assert from 'node:assert/strict'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import type { Media, TravelProject } from '@/payload/payload-types'
import { CompletedTravelLedger } from './completed-travel-ledger'
import { TravelPhotoGalleryPreview } from './travel-photo-gallery'
import { TravelPlanningExtras } from './travel-planning-extras'
import { TravelSourceSections } from './travel-source-sections'
import { PayloadImage } from '@/components/ui/payload-image'

const completedProject: TravelProject = {
  id: 1,
  title: '初探泰國普吉島',
  slug: '202602-thailand-phuket',
  status: 'completed',
  isPrivate: false,
  startDate: '2026-02-10T00:00:00.000Z',
  endDate: '2026-02-17T00:00:00.000Z',
  summary: '從曼谷轉機到普吉的家庭旅行。',
  coverImage: null,
  galleryImages: [],
  itineraryImages: [],
  flights: [
    {
      id: 'flight-1',
      flightNumber: 'BR211',
      route: '台北 → 曼谷',
      departureTime: '08:25',
      arrivalTime: '11:30',
    },
  ],
  lodgings: [
    {
      id: 'lodging-1',
      dateRange: '2/10 – 2/11',
      hotel: 'Splash Beach Resort',
      roomType: '三臥住宅',
    },
  ],
  dailyItinerary: [
    {
      id: 'day-1',
      day: 1,
      title: '抵達普吉',
      segments: [
        {
          id: 'segment-1',
          time: '上午',
          activity: '前往機場',
          transport: '飛機',
        },
      ],
    },
  ],
  externalVideos: [
    {
      id: 'video-1',
      title: '普吉家庭旅行',
      youtubeUrl: 'https://youtu.be/lYP3m2N8yvs',
    },
  ],
  createdAt: '2026-06-21T00:00:00.000Z',
  updatedAt: '2026-06-21T00:00:00.000Z',
}

const html = renderToStaticMarkup(createElement(CompletedTravelLedger, { project: completedProject }))

assert.match(html, /旅程資料簿/)
assert.match(html, /BR211/)
assert.match(html, /Splash Beach Resort/)

const planningProject: TravelProject = {
  id: 2,
  title: '泰國普吉島度假二刷',
  slug: '202702-thailand-phuket',
  status: 'planning',
  isPrivate: false,
  startDate: '2027-02-02T00:00:00.000Z',
  endDate: '2027-02-08T00:00:00.000Z',
  summary: '雙度假會體驗',
  coverImage: null,
  galleryImages: [],
  itineraryImages: [],
  party: [{ id: 'party-1', name: 'Tavis' }],
  flights: [
    {
      id: 'flight-1',
      flightNumber: 'TBD',
      route: '台北 → 普吉島',
      notes: '出發前60天提供航班信息',
    },
  ],
  lodgings: [
    {
      id: 'lodging-1',
      dateRange: '2/2 – 2/5',
      hotel: 'Anantara Vacation Club Mai Khao Phuket',
    },
  ],
  dailyItinerary: [
    {
      id: 'day-1',
      day: 1,
      title: '台北 → 普吉島 · 安納塔拉入住',
      segments: [{ id: 'segment-1', activity: '抵達普吉島' }],
    },
  ],
  reminders: [
    {
      id: 'reminder-1',
      category: '補充細節',
      items: [{ id: 'reminder-item-1', text: '萬豪推介會出席提醒' }],
    },
  ],
  foodRecommendations: [
    {
      id: 'food-1',
      category: '酸湯兔',
      name: '老來福酸湯兔',
      description: '完全不辣',
      suitableFor: '小孩最愛',
    },
  ],
  costItems: [
    {
      id: 'cost-1',
      category: '費用',
      item: '《烽煙三國》演出',
      unitPrice: '290元/人',
      quantity: '6人',
      subtotal: '1,740元',
    },
  ],
  optionalActivities: [
    {
      id: 'option-1',
      name: '白帝城',
      price: '252元/人',
      notes: '自費項目',
    },
  ],
  sourceSections: [
    {
      id: 'source-1',
      level: 1,
      title: '旅行戰情室',
      anchor: 'war-room',
      body: '',
    },
    {
      id: 'source-2',
      level: 2,
      title: '度假村官方網站',
      anchor: 'resort-sites',
      body: '安納塔拉度假會：https://www.anantara.com/en/vacation-club-phuket',
      links: [
        {
          id: 'source-link-1',
          label: 'https://www.anantara.com/en/vacation-club-phuket',
          url: 'https://www.anantara.com/en/vacation-club-phuket',
        },
      ],
    },
    {
      id: 'source-3',
      level: 1,
      title: '每日節點與決策討論',
      anchor: 'daily-decisions',
      body: '',
    },
    {
      id: 'source-4',
      level: 2,
      title: 'Day 1 · 2/2（二）— 台北 → 普吉島 · 安納塔拉入住',
      anchor: 'day-1',
      body: '| 時段 | 行程 | 備註 |\n| --- | --- | --- |\n| 上午 | 抵達普吉島 | 入住安納塔拉 |',
    },
    {
      id: 'source-5',
      level: 1,
      title: '注意事項',
      anchor: 'notes',
      body: '',
    },
    {
      id: 'source-6',
      level: 2,
      title: '補充細節',
      anchor: 'details',
      body: '萬豪推介會出席提醒：否則需支付套餐全額零售價（最高$1,500）。',
    },
  ],
  createdAt: '2026-06-21T00:00:00.000Z',
  updatedAt: '2026-06-21T00:00:00.000Z',
}

const sectionPhoto: Media = {
  id: 301,
  type: 'photo',
  altText: '安納塔拉泳池照片',
  url: 'https://cdn.example.com/anantara-pool.jpg',
  width: 1600,
  height: 1200,
  createdAt: '2026-06-21T00:00:00.000Z',
  updatedAt: '2026-06-21T00:00:00.000Z',
}

const sectionVideo: Media = {
  id: 302,
  type: 'video',
  altText: '度假村介紹影片',
  youtubeUrl: 'https://youtu.be/lYP3m2N8yvs',
  createdAt: '2026-06-21T00:00:00.000Z',
  updatedAt: '2026-06-21T00:00:00.000Z',
}

const galleryPhotos: Media[] = Array.from({ length: 6 }).map((_, index) => ({
  id: 400 + index,
  type: 'photo',
  altText: `普吉相簿照片 ${index + 1}`,
  url: `https://cdn.example.com/phuket-${index + 1}.jpg`,
  createdAt: '2026-06-21T00:00:00.000Z',
  updatedAt: '2026-06-21T00:00:00.000Z',
}))

planningProject.sourceSections?.push(
  {
    id: 'source-7',
    level: 2,
    title: '安納塔拉媒體選集',
    anchor: 'anantara-media',
    body: '這段可以選擇照片與 YouTube 影片。',
    mediaItems: [sectionPhoto, sectionVideo],
  },
  {
    id: 'source-8',
    level: 3,
    title: '泳池角度',
    anchor: 'pool-angle',
    body: 'Level 3 內容嵌入在 Level 2 卡片內。',
    enableComments: false,
    enableThumbsUp: false,
    enableThumbsDown: false,
  },
)

const planningHtml = renderToStaticMarkup(
  createElement(TravelSourceSections, {
    project: planningProject,
    renderInteraction: ({ associatedId, label }) =>
      createElement('div', {
        'data-associated-id': associatedId,
        'data-label': label,
      }, 'interaction slot'),
  }),
)

assert.doesNotMatch(planningHtml, /完整來源內容/)
assert.doesNotMatch(planningHtml, /來源章節已整理成正式行程地圖/)
assert.doesNotMatch(planningHtml, /行程章節/)
assert.doesNotMatch(planningHtml, /Markdown H1/)
assert.doesNotMatch(planningHtml, /子章節/)
assert.match(planningHtml, /旅行戰情室/)
assert.match(planningHtml, /每日節點與決策討論/)
assert.match(planningHtml, /注意事項/)
assert.match(planningHtml, /Reminders/)
assert.match(planningHtml, /Day 1/)
assert.match(planningHtml, /度假村官方網站/)
assert.match(planningHtml, /https:\/\/www\.anantara\.com\/en\/vacation-club-phuket/)
assert.match(planningHtml, /最高\$1,500/)
assert.match(planningHtml, /travel:202702-thailand-phuket:source:resort-sites/)
assert.match(planningHtml, /travel:202702-thailand-phuket:source:details/)
assert.match(planningHtml, /入住安納塔拉/)
assert.match(planningHtml, /data-source-level="1"/)
assert.match(planningHtml, /data-source-level="2"/)
assert.match(planningHtml, /data-source-level="3"/)
assert.match(planningHtml, /from-slate-950 via-sky-800 to-cyan-500 bg-clip-text/)
assert.doesNotMatch(planningHtml, /from-cyan-900 via-slate-900 to-amber-800/)
assert.doesNotMatch(planningHtml, /rounded-lg bg-gradient-to-r/)
assert.match(planningHtml, /data-daily-title-row="day"/)
assert.match(planningHtml, /data-daily-title-row="date"/)
assert.match(planningHtml, /data-daily-title-row="subtitle"/)
assert.match(planningHtml, /安納塔拉媒體選集/)
assert.match(planningHtml, /安納塔拉泳池照片/)
assert.match(planningHtml, /youtube-nocookie\.com\/embed\/lYP3m2N8yvs/)
assert.match(planningHtml, /泳池角度/)
assert.doesNotMatch(planningHtml, /travel:202702-thailand-phuket:source:pool-angle/)
assert.doesNotMatch(planningHtml, /anantara-media photo 1/)

const extrasHtml = renderToStaticMarkup(createElement(TravelPlanningExtras, { project: planningProject }))

assert.match(extrasHtml, /費用、餐食與可選項目/)
assert.match(extrasHtml, /老來福酸湯兔/)
assert.match(extrasHtml, /《烽煙三國》演出/)
assert.match(extrasHtml, /白帝城/)

const mediaHtml = renderToStaticMarkup(
  createElement(PayloadImage, {
    fallbackLabel: '原比例照片',
    media: sectionPhoto,
    sizes: '100vw',
  }),
)

assert.match(mediaHtml, /object-contain/)
assert.match(mediaHtml, /data-image-layout="fill"/)
assert.doesNotMatch(mediaHtml, /object-cover/)
assert.match(planningHtml, /data-image-layout="intrinsic"/)

const completedGalleryHtml = renderToStaticMarkup(
  createElement(TravelPhotoGalleryPreview, {
    project: {
      ...completedProject,
      galleryImages: galleryPhotos,
    } as TravelProject,
  }),
)

assert.match(completedGalleryHtml, /Show all photos/)
assert.match(completedGalleryHtml, /\/travel\/202602-thailand-phuket\/photos/)
