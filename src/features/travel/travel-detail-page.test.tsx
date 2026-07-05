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
      body: '集中整理航班、住宿、每日決策與待確認事項，讓行前討論有同一個入口。',
      enableComments: false,
      enableThumbsUp: false,
      enableThumbsDown: false,
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
      id: 'source-2b',
      level: 2,
      title: '三峽人家費用估算',
      anchor: 'three-gorges-estimate',
      body: '| 項目 | 估算 |\n| --- | --- |\n| 門票（按6人估算） | 約700-1,080元 |\n| 交通（打車往返） | 約200元 |\n| 小計 | 約1,260-1,640元 |',
    },
    {
      id: 'source-2c',
      level: 2,
      title: '宜昌段住宿與交通',
      anchor: 'yichang-lodging-transport',
      body: '| 項目 | 費用 |\n| --- | --- |\n| 宜昌1790梵居（2間房1晚） | 約800元 |\n| 宜昌東→武漢站高鐵（6人） | ¥666元 |\n| 小計 | 約1,466元 |',
    },
    {
      id: 'source-2d',
      level: 2,
      title: '🚕 機場→酒店交通',
      anchor: 'airport-hotel-transfer',
      body: '- 推薦方案：打車2輛，夜間價較穩\n- 備選方案：地鐵3號線→2號線至臨江門站',
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
      displayDay: 'Day 1',
      displayDate: '2027年2月2日（二）',
      displaySubtitle: '安納塔拉入住日',
      anchor: 'day-1',
      body: '| 時段 | 行程 | 備註 |\n| --- | --- | --- |\n| 上午 | 抵達普吉島 | 入住安納塔拉 |',
    },
    {
      id: 'source-5',
      level: 1,
      title: '注意事項',
      anchor: 'notes',
      body: '提醒、取消政策與待確認項目集中放在這裡，讓出發前需要注意的事情一眼可查。',
      enableComments: false,
      enableThumbsUp: false,
      enableThumbsDown: false,
    },
    {
      id: 'source-6',
      level: 2,
      title: '補充細節',
      anchor: 'details',
      body: '萬豪推介會出席提醒：否則需支付套餐全額零售價（最高$1,500）。',
    },
    {
      id: 'source-6a',
      level: 2,
      title: '防暑降溫（全程適用）',
      anchor: 'heat-prevention',
      body: '- 攜帶防曬霜、遮陽帽、便攜小風扇、藿香正氣水\n- 12:00-15:00避免戶外暴走，安排室內景點或午休\n- 隨時補充水分，便利店買水方便',
    },
    {
      id: 'source-6aa',
      level: 2,
      title: '老人小孩注意',
      anchor: 'senior-kids-notes',
      body: '- 洪崖洞內部人多擁擠，傍晚遠觀即可，不建議帶小孩進入\n- 山城步道從領事巷入口往下走，避免小孩爬坡太累',
    },
    {
      id: 'source-6b',
      level: 2,
      title: '三峽人家交通方案',
      anchor: 'three-gorges-transport',
      body: '💡 建議：方案A打車更靈活，適合6人家庭自主安排時間；方案B套票省心但需配合固定班次。可提前在攜程對比套票價格是否划算（單獨買門票180元/人+打車200元 vs 套票210元/人含車）',
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
assert.doesNotMatch(planningHtml, /travel:202702-thailand-phuket:source:war-room/)
assert.match(planningHtml, /每日節點與決策討論/)
assert.match(planningHtml, /注意事項/)
assert.match(planningHtml, /Reminders/)
assert.match(planningHtml, /提醒、取消政策與待確認項目集中放在這裡/)
assert.match(planningHtml, /Day 1/)
assert.match(planningHtml, /度假村官方網站/)
assert.match(planningHtml, /https:\/\/www\.anantara\.com\/en\/vacation-club-phuket/)
assert.match(planningHtml, /最高\$1,500/)
assert.match(planningHtml, /travel:202702-thailand-phuket:source:resort-sites/)
assert.match(planningHtml, /travel:202702-thailand-phuket:source:details/)
assert.match(planningHtml, /防暑降溫（全程適用）/)
assert.match(planningHtml, /藿香正氣水/)
assert.match(planningHtml, /老人小孩注意/)
assert.match(planningHtml, /山城步道從領事巷入口/)
assert.match(planningHtml, /三峽人家費用估算/)
assert.match(planningHtml, /約1,260-1,640元/)
assert.match(planningHtml, /宜昌段住宿與交通/)
assert.match(planningHtml, /約1,466元/)
assert.match(planningHtml, /機場→酒店交通/)
assert.match(planningHtml, /地鐵3號線→2號線/)
assert.match(planningHtml, /三峽人家交通方案/)
assert.match(planningHtml, /套票210元\/人含車/)
assert.doesNotMatch(planningHtml, /travel:202702-thailand-phuket:source:notes/)
assert.match(planningHtml, /入住安納塔拉/)
assert.match(planningHtml, /data-source-level="1"/)
assert.match(planningHtml, /data-source-level="2"/)
assert.match(planningHtml, /data-source-level="3"/)
assert.match(planningHtml, /from-slate-950 via-cyan-700 to-amber-500 bg-clip-text/)
assert.doesNotMatch(planningHtml, /from-slate-950 via-sky-800 to-cyan-500 bg-clip-text/)
assert.doesNotMatch(planningHtml, /from-cyan-900 via-slate-900 to-amber-800/)
assert.doesNotMatch(planningHtml, /rounded-lg bg-gradient-to-r/)
assert.match(planningHtml, /data-daily-title-row="day"/)
assert.match(planningHtml, /data-daily-title-row="date"/)
assert.match(planningHtml, /data-daily-title-row="subtitle"/)
assert.match(planningHtml, /text-lg font-semibold uppercase tracking-\[0\.18em\] text-\[#65808b\] md:text-xl/)
assert.match(planningHtml, /text-base font-medium text-slate-500 md:text-lg/)
assert.match(planningHtml, /2027年2月2日（二）/)
assert.match(planningHtml, /安納塔拉入住日/)
assert.doesNotMatch(planningHtml, /data-daily-title-row="subtitle">台北 → 普吉島 · 安納塔拉入住/)
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
assert.match(planningHtml, /https:\/\/cdn\.example\.com\/anantara-pool\.jpg/)
assert.match(planningHtml, /min-\[560px\]:grid-cols-2/)
assert.match(planningHtml, /min-\[560px\]:col-span-2/)
assert.match(planningHtml, /grid gap-6 lg:grid-cols-2/)
assert.match(planningHtml, /mt-5 grid gap-4 lg:grid-cols-2/)
assert.match(planningHtml, /id="three-gorges-estimate"><h4/)
assert.match(planningHtml, /id="yichang-lodging-transport"><h4/)
assert.match(planningHtml, /py-5 md:py-7 lg:col-span-2" data-source-level="2" id="airport-hotel-transfer"/)
assert.match(planningHtml, /py-5 md:py-7 lg:col-span-2" data-source-level="2" id="details"/)
assert.match(planningHtml, /py-5 md:py-7 " data-source-level="2" id="heat-prevention"/)
assert.match(planningHtml, /py-5 md:py-7 " data-source-level="2" id="senior-kids-notes"/)
assert.doesNotMatch(planningHtml, /id="heat-prevention"[\s\S]*?min-\[560px\]:grid-cols-2[\s\S]*?id="senior-kids-notes"/)
assert.match(planningHtml, /id="three-gorges-transport"><h4 class="text-\[22px\] font-semibold tracking-normal text-white"/)
assert.match(planningHtml, /py-5 md:py-7 lg:col-span-2" data-source-level="2" id="three-gorges-transport"/)
assert.match(planningHtml, /max-w-5xl border-l border-cyan-100\/20 pl-5/)
assert.match(planningHtml, /max-w-5xl border-l border-cyan-800\/25 pl-5/)
assert.match(planningHtml, /mx-auto mt-5 grid w-full gap-3 sm:grid-cols-2/)
assert.match(planningHtml, /text-\[22px\] font-semibold tracking-normal text-slate-950/)
assert.doesNotMatch(planningHtml, /border-t border-white\/10 py-5/)

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
