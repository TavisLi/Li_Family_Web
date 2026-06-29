import assert from 'node:assert/strict'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import type { TravelProject } from '@/payload/payload-types'
import { TravelIndexPage } from './travel-index-page'

const projects: TravelProject[] = [
  {
    id: 3,
    title: '重慶長江三峽前期規劃',
    slug: '202607-chongqing-yangtze-river',
    status: 'planning',
    isPrivate: false,
    startDate: '2026-07-01T00:00:00.000Z',
    endDate: '2026-07-08T00:00:00.000Z',
    summary: '已過期但保留討論脈絡',
    coverImage: null,
    galleryImages: [],
    itineraryImages: [],
    createdAt: '2026-06-21T00:00:00.000Z',
    updatedAt: '2026-06-21T00:00:00.000Z',
  },
  {
    id: 1,
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
    createdAt: '2026-06-21T00:00:00.000Z',
    updatedAt: '2026-06-21T00:00:00.000Z',
  },
  {
    id: 2,
    title: '東澳全覽9日',
    slug: '202308-east-australia',
    status: 'completed',
    isPrivate: false,
    startDate: '2023-08-01T00:00:00.000Z',
    endDate: '2023-08-09T00:00:00.000Z',
    summary: '墨爾本與悉尼',
    coverImage: null,
    galleryImages: [],
    itineraryImages: [],
    createdAt: '2026-06-21T00:00:00.000Z',
    updatedAt: '2026-06-21T00:00:00.000Z',
  },
]

const html = renderToStaticMarkup(
  createElement(TravelIndexPage, {
    currentDate: '2026-08-01T00:00:00.000Z',
    projects,
  }),
)

assert.match(html, /前期規劃/)
assert.match(html, /規劃中/)
assert.match(html, /已完成/)
assert.match(html, /href="#travel-group-planning"/)
assert.match(html, /href="#travel-group-completed"/)
assert.match(html, /href="#travel-group-preliminary"/)
assert.match(html, /id="travel-group-planning"/)
assert.match(html, /id="travel-group-completed"/)
assert.match(html, /id="travel-group-preliminary"/)
assert.match(html, />1<\/span>/)
assert.match(html, /\/travel\/202702-thailand-phuket/)
assert.match(html, /\/travel\/202308-east-australia/)
assert.match(html, /\/travel\/202607-chongqing-yangtze-river/)
assert.match(html, /規劃中但日期已過的行程會先收在這裡/)
assert.doesNotMatch(html, /<p class="text-3xl font-semibold tracking-normal">2<\/p>/)
assert.doesNotMatch(html, /媒體關聯/)
assert.doesNotMatch(html, /缺圖時統一落到正式 ImageFallback/)
