import assert from 'node:assert/strict'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import type { Media, User } from '@/payload/payload-types'
import { MemberProfilePage } from './member-profile-page'

function media(id: number, altText: string): Media {
  return {
    id,
    type: 'photo',
    altText,
    filename: `${id}.jpeg`,
    filesize: 1,
    mimeType: 'image/jpeg',
    url: `https://media.web-li.test/${id}.jpeg`,
    width: 1200,
    height: 900,
    createdAt: '2026-06-28T00:00:00.000Z',
    updatedAt: '2026-06-28T00:00:00.000Z',
  }
}

function baseMember(overrides: Partial<User>): User {
  return {
    id: 1,
    role: 'family',
    displayName: 'Member',
    slug: 'member',
    familyRole: 'family',
    profileVisibility: 'public',
    theme: {
      persona: 'neutral',
    },
    createdAt: '2026-06-28T00:00:00.000Z',
    updatedAt: '2026-06-28T00:00:00.000Z',
    email: 'family+member@web-li.local',
    collection: 'users',
    ...overrides,
  }
}

const tavis = baseMember({
  id: 10,
  displayName: 'Tavis Li',
  slug: 'tavis',
  familyRole: 'father',
  theme: {
    persona: 'tavis',
  },
  heroImage: media(101, 'Tavis portrait'),
  resumeMilestoneImages: [media(201, 'SOI Micro office'), media(202, 'Yangtze Memory milestone')],
  typewriter: {
    prefix: '兒子、丈夫、父親，以及近30年半導體產業經驗的',
    rotatingWords: [{ word: '工廠自動化' }, { word: '數字化轉型' }],
    suffix: '專業工作者。',
  },
  bio: '28年半導體行業數字化轉型、智能製造與IT戰略管理經驗。',
  beliefs: [{ text: '天行健，君子以自強不息' }],
  education: [
    {
      school: '台灣大學',
      degree: '碩士',
      major: '機械工程研究所',
      year: '1996',
    },
  ],
  interests: [{ name: '閱讀' }, { name: '旅行', description: '讀萬卷書行萬里路' }],
  skillRadar: [
    { skill: '數字化轉型戰略', score: 96, evidence: 'IT戰略規劃與高管顧問服務導入' },
    { skill: '智能製造與自動化', score: 95, evidence: 'CIM、MES、AMHS、Full Auto' },
  ],
  careerTimeline: [
    {
      organization: '銳立平芯微電子',
      role: 'IT中心助理副總裁',
      start: '2023/6',
      end: '至今',
      summary: '從零開始組建IT中心。',
      highlights: [{ text: '完成部門職責梳理與核心管理層招募' }],
    },
    {
      organization: '長江存儲',
      role: 'IT資深總監',
      start: '2019/11',
      end: '2021/4',
      summary: '領導288人IT團隊推動數字化轉型。',
      highlights: [{ text: '建立 FAB IT 產品發展路線圖' }],
    },
    {
      organization: '南亞科技',
      role: '資深工程師',
      start: '1998/7',
      end: '2003/7',
      summary: '參與200mm Fab自動化系統建置。',
    },
  ],
})

const lynn = baseMember({
  id: 11,
  displayName: 'Lynn Chien',
  slug: 'lynn',
  familyRole: 'mother',
  theme: {
    persona: 'lynn',
  },
  heroImage: media(301, 'Lynn portrait'),
  resumeMilestoneImages: [media(302, 'HTC milestone')],
  typewriter: {
    prefix: '女兒、妻子、母親，以及熱情溫暖的',
    rotatingWords: [{ word: '生活美學家' }, { word: '旅行探索者' }],
    suffix: '優雅生活家。',
  },
  bio: '台大會計系畢業，擁有審計、財務與內控管理經驗。',
  beliefs: [{ text: '把專業、秩序與美感，安放在生活的細節裡。' }],
  education: [{ school: '台灣大學', degree: '學士', major: '會計系', year: '1996' }],
  interests: [{ name: '閱讀' }, { name: '旅行' }],
  skillRadar: [
    { skill: '財務會計', score: 94, evidence: '合併報表、預算規劃與財務管理' },
    { skill: '內部稽核', score: 93, evidence: '公司治理與法令遵循' },
  ],
  careerTimeline: [
    {
      organization: '宏達國際電子股份有限公司',
      role: '稽核處資深總監',
      start: '2020/10',
      end: '現在',
      summary: '啟動稽核業務優化。',
    },
    {
      organization: '勤業眾信會計師事務所',
      role: '經理',
      start: '1997/6',
      end: '2005/1',
      summary: '帶領審計團隊服務上市櫃電子製造業。',
    },
  ],
})

const tavisHtml = renderToStaticMarkup(createElement(MemberProfilePage, { member: tavis }))

assert.match(tavisHtml, /DIGITAL TRANSFORMATION TECHNOLOGY LEADERSHIP/)
assert.match(tavisHtml, /工廠自動化 \/ 數字化轉型/)
assert.match(tavisHtml, /數字化轉型戰略/)
assert.match(tavisHtml, /智能製造與自動化/)
assert.match(tavisHtml, /銳立平芯微電子/)
assert.match(tavisHtml, /長江存儲/)
assert.match(tavisHtml, /南亞科技/)
assert.match(tavisHtml, /SOI Micro office/)
assert.match(tavisHtml, /Yangtze Memory milestone/)
assert.match(tavisHtml, /南亞科技 milestone media/)
assert.match(tavisHtml, /txli@icloud\.com/)
assert.doesNotMatch(tavisHtml, /Payload/)
assert.doesNotMatch(tavisHtml, /父親<\/p>/)

const lynnHtml = renderToStaticMarkup(createElement(MemberProfilePage, { member: lynn }))

assert.match(lynnHtml, /生活美學家 \/ 旅行探索者/)
assert.match(lynnHtml, /台灣大學 · 學士 · 會計系 · 1996/)
assert.match(lynnHtml, /財務會計/)
assert.match(lynnHtml, /內部稽核/)
assert.match(lynnHtml, /宏達國際電子股份有限公司/)
assert.match(lynnHtml, /勤業眾信會計師事務所/)
assert.match(lynnHtml, /HTC milestone/)
assert.match(lynnHtml, /勤業眾信會計師事務所 milestone media/)
