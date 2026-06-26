import assert from 'node:assert/strict'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import type { TravelProject } from '@/payload/payload-types'
import { CompletedTravelLedger } from './completed-travel-ledger'
import { TravelPlanningExtras } from './travel-planning-extras'
import { TravelSourceSections } from './travel-source-sections'

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
      title: '外部網站',
      anchor: 'external-sites',
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
      id: 'source-2',
      level: 1,
      title: '補充細節',
      anchor: 'details',
      body: '萬豪推介會出席提醒：否則需支付套餐全額零售價（最高$1,500）。',
    },
  ],
  createdAt: '2026-06-21T00:00:00.000Z',
  updatedAt: '2026-06-21T00:00:00.000Z',
}

const planningHtml = renderToStaticMarkup(createElement(TravelSourceSections, { project: planningProject }))

assert.match(planningHtml, /完整來源內容/)
assert.match(planningHtml, /外部網站/)
assert.match(planningHtml, /https:\/\/www\.anantara\.com\/en\/vacation-club-phuket/)
assert.match(planningHtml, /最高\$1,500/)

const extrasHtml = renderToStaticMarkup(createElement(TravelPlanningExtras, { project: planningProject }))

assert.match(extrasHtml, /費用、餐食與可選項目/)
assert.match(extrasHtml, /老來福酸湯兔/)
assert.match(extrasHtml, /《烽煙三國》演出/)
assert.match(extrasHtml, /白帝城/)
