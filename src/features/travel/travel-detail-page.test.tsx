import assert from 'node:assert/strict'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import type { TravelProject } from '@/payload/payload-types'
import { CompletedTravelLedger } from './completed-travel-ledger'

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
