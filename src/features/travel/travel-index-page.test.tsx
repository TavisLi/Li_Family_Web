import assert from 'node:assert/strict'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import type { TravelProject } from '@/payload/payload-types'
import { TravelIndexPage } from './travel-index-page'

const projects: TravelProject[] = [
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

const html = renderToStaticMarkup(createElement(TravelIndexPage, { projects }))

assert.match(html, /規劃中旅程/)
assert.match(html, /已完成旅程/)
assert.match(html, /\/travel\/202702-thailand-phuket/)
assert.match(html, /\/travel\/202308-east-australia/)
assert.match(html, /缺圖時統一落到正式 ImageFallback/)
