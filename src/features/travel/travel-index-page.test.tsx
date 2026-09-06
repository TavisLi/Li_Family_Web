import assert from 'node:assert/strict'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import type { Media } from '@/payload/payload-types'
import type { TravelRuntimeRecord } from '@/lib/travel-runtime'
import { TravelIndexPage } from './travel-index-page'

const coverImage: Media = {
  id: 101,
  altText: 'Phuket coast cover image',
  type: 'photo',
  createdAt: '2026-06-21T00:00:00.000Z',
  updatedAt: '2026-06-21T00:00:00.000Z',
  filename: 'phuket-cover.jpeg',
  filesize: 1024,
  height: 900,
  mimeType: 'image/jpeg',
  url: '/media/phuket-cover.jpeg',
  width: 1600,
}

const projects: TravelRuntimeRecord[] = [
  {
    id: 'travel-plans:3',
    sourceId: 3,
    collection: 'travel-plans',
    kind: 'plan',
    title: '重慶長江三峽過往規劃',
    slug: '202607-chongqing-yangtze-river',
    status: 'planning',
    isPrivate: false,
    startDate: '2026-07-01T00:00:00.000Z',
    endDate: '2026-07-08T00:00:00.000Z',
    summary: '已過期但保留討論脈絡',
    coverImage,
    galleryImages: [],
  },
  {
    id: 'travel-plans:1',
    sourceId: 1,
    collection: 'travel-plans',
    kind: 'plan',
    title: '泰國普吉島度假二刷',
    slug: '202702-thailand-phuket',
    status: 'planning',
    isPrivate: false,
    startDate: '2027-02-02T00:00:00.000Z',
    endDate: '2027-02-08T00:00:00.000Z',
    summary: '雙度假會體驗',
    coverImage,
    galleryImages: [],
  },
  {
    id: 'travel-memories:2',
    sourceId: 2,
    collection: 'travel-memories',
    kind: 'memory',
    title: '東澳全覽9日',
    slug: '202308-east-australia',
    status: 'completed',
    isPrivate: false,
    startDate: '2023-08-01T00:00:00.000Z',
    endDate: '2023-08-09T00:00:00.000Z',
    summary: '墨爾本與悉尼',
    coverImage,
    galleryImages: [],
  },
]

const html = renderToStaticMarkup(
  createElement(TravelIndexPage, {
    currentDate: '2026-08-01T00:00:00.000Z',
    projects,
  }),
)

assert.match(html, /過往規劃/)
assert.match(html, /規劃中/)
assert.match(html, /旅行回憶/)
assert.match(html, /href="#travel-group-planning"/)
assert.match(html, /href="#travel-group-memories"/)
assert.match(html, /href="#travel-group-archived"/)
assert.match(html, /id="travel-group-planning"/)
assert.match(html, /id="travel-group-memories"/)
assert.match(html, /id="travel-group-archived"/)
assert.equal((html.match(/target:ring-2/g) ?? []).length, 3)
assert.match(html, />1<\/span>/)
assert.match(html, /text-4xl font-semibold leading-none tracking-normal text-slate-700\/75 md:text-5xl/)
assert.doesNotMatch(html, /rounded-full border border-slate-200 bg-white\/75/)
assert.match(html, /\/travel\/202702-thailand-phuket/)
assert.match(html, /\/travel\/202308-east-australia/)
assert.match(html, /\/travel\/202607-chongqing-yangtze-river/)
assert.match(html, /旅遊日期已過的計畫會歸檔在這裡/)
assert.doesNotMatch(html, /前期規劃|preliminary/i)
assert.match(html, /object-cover transition duration-500 group-hover:scale-105/)

assert.doesNotMatch(html, /object-contain transition duration-500 group-hover:scale-105/)
assert.match(html, /bg-gradient-to-r from-slate-950 via-sky-800 to-cyan-600 bg-clip-text/)
assert.doesNotMatch(html, /from-slate-950 via-cyan-950 to-amber-900 px-5 py-8 text-white/)
assert.doesNotMatch(html, /<p class="text-3xl font-semibold tracking-normal">2<\/p>/)
assert.doesNotMatch(html, /媒體關聯/)
assert.doesNotMatch(html, /缺圖時統一落到正式 ImageFallback/)
