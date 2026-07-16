import assert from 'node:assert/strict'

import type { TravelProject } from '@/payload/payload-types'
import type { TravelSeed } from './seed-content'
import { buildTravelMemoryCopyDraft } from './travel-memory-copy-transformer'
import {
  assessTravelProjectCopy,
  buildTravelPlanCopyDraft,
  buildTravelCollectionCopyReadiness,
  renderTravelCollectionCopyReadinessMarkdown,
} from './travel-collection-copy-readiness'

const archivedPlan: TravelProject = {
  id: 3,
  title: '重慶長江三峽過往規劃',
  slug: '202607-chongqing-yangtze-river',
  status: 'planning',
  isPrivate: true,
  startDate: '2026-07-01T00:00:00.000Z',
  endDate: '2026-07-08T00:00:00.000Z',
  flights: [
    {
      flightNumber: 'CA001',
      route: 'TPE-CKG',
    },
  ],
  lodgings: [
    {
      hotel: '首象酒店',
      city: '重慶',
      roomType: '霧隱大床房',
      dateRange: '7/1~7/3',
    },
  ],
  sourceSections: [
    {
      level: 2,
      title: '住宿安排',
      anchor: 'lodging',
      displayDay: 'Day 1',
      displayDate: '2026年7月1日（三）',
      displaySubtitle: '入住日',
      body: '| 日期 | 酒店 |\n| --- | --- |\n| 7/1~7/3 | 首象酒店 |',
      enableComments: true,
      enableThumbsUp: true,
      enableThumbsDown: false,
    },
  ],
  sourceMetadata: {
    sourceFile: 'content-source/travels/202607-chongqing-yangtze-river.md',
    sourceHash: 'legacy-hash',
    parserVersion: 'phase-16-v1',
    baseProjection: {
      title: '重慶長江三峽過往規劃',
      slug: '202607-chongqing-yangtze-river',
      status: 'planning',
      isPrivate: true,
      startDate: '2026-07-01',
      endDate: '2026-07-08',
      flights: [{ flightNumber: 'CA001', route: 'TPE-CKG' }],
      lodgings: [{ hotel: '首象酒店', dateRange: '7/1~7/3' }],
      sourceSections: [
        {
          level: 2,
          title: '住宿安排',
          anchor: 'lodging',
          displayDay: 'Day 1',
          displayDate: '2026年7月1日（三）',
          displaySubtitle: '入住日',
          body: '| 日期 | 酒店 |\n| --- | --- |\n| 7/1~7/3 | 首象酒店 |',
          enableComments: true,
          enableThumbsUp: true,
          enableThumbsDown: true,
        },
      ],
    },
  },
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
}

const archivedSource: TravelSeed = {
  slug: archivedPlan.slug,
  title: archivedPlan.title,
  status: 'planning',
  isPrivate: true,
  startDate: '2026-07-01',
  endDate: '2026-07-08',
  externalDocIdentifier: 'content-source/travels/202607-chongqing-yangtze-river.md',
  flights: [{ flightNumber: 'CA001', route: 'TPE-CKG' }],
  lodgings: [{ hotel: '首象酒店', dateRange: '7/1~7/3' }],
  sourceSections: [
    {
      level: 2,
      title: '住宿安排',
      anchor: 'lodging',
      displayDay: 'Day 1',
      displayDate: '2026年7月1日（三）',
      displaySubtitle: '入住日',
      body: '| 日期 | 酒店 |\n| --- | --- |\n| 7/1~7/3 | 首象酒店 |',
      enableComments: true,
      enableThumbsUp: true,
      enableThumbsDown: true,
    },
  ],
}

const assessment = assessTravelProjectCopy(
  archivedPlan,
  new Date('2026-08-01T00:00:00.000Z'),
  archivedSource,
)

assert.equal(assessment.targetCollection, 'travel-plans')
assert.equal(assessment.planPresentation, 'archived')
assert.equal(assessment.readiness, 'ready')
assert.ok(!assessment.blockers.some((blocker) => blocker.sourcePath === 'lodgings'))
assert.ok(
  assessment.warnings.some(
    (warning) => warning.sourcePath === 'lodgings' && /已批准的冗餘/.test(warning.reason),
  ),
)

const archivedDraft = buildTravelPlanCopyDraft(archivedPlan, archivedSource)
assert.equal(archivedDraft.data.slug, '202607-chongqing-yangtze-river')
assert.equal(archivedDraft.data.planningSections?.[0]?.displayDay, 'Day 1')
assert.equal(archivedDraft.data.planningSections?.[0]?.displayDate, '2026年7月1日（三）')
assert.equal(archivedDraft.data.planningSections?.[0]?.displaySubtitle, '入住日')
assert.deepEqual(archivedDraft.data.planningSections?.[0]?.interactions, {
  commentsEnabled: true,
  thumbsUpEnabled: true,
  thumbsDownEnabled: false,
})
assert.ok(!('lodgings' in archivedDraft.data))
assert.ok(!('flights' in archivedDraft.data))
assert.ok(!('status' in archivedDraft.data))
assert.equal(archivedDraft.data.sourceMetadata.parserVersion, 'phase-17-plan-v1')
assert.equal(
  archivedDraft.data.sourceMetadata.sourceHash,
  archivedDraft.expectedSourceHash,
)
assert.ok(!('lodgings' in archivedDraft.baseProjection))

assert.doesNotThrow(() => buildTravelPlanCopyDraft(archivedPlan, archivedSource))
assert.throws(
  () =>
    buildTravelPlanCopyDraft(archivedPlan, {
      ...archivedSource,
      sourceSections: archivedSource.sourceSections?.map((section) => ({
        ...section,
        body: `${section.body}\nSource changed`,
      })),
    }),
  /必須先重新執行 reconciliation/,
)

const interactionMismatchPlan: TravelProject = {
  ...archivedPlan,
  id: 7,
  slug: '202702-thailand-phuket',
  flights: [],
  sourceSections: [
    {
      level: 2,
      title: '航班選擇',
      anchor: 'flight-options',
      body: '比較兩個航班方案。',
      enableComments: true,
      enableThumbsUp: true,
      enableThumbsDown: false,
    },
  ],
}

const interactionAssessment = assessTravelProjectCopy(interactionMismatchPlan)
assert.equal(interactionAssessment.readiness, 'blocked')
assert.ok(
  interactionAssessment.mappings.some(
    (mapping) =>
      mapping.sourcePath === 'sourceSections' && mapping.targetPath === 'planningSections',
  ),
)
assert.ok(
  interactionAssessment.blockers.some(
    (blocker) => blocker.sourcePath === 'sourceMetadata' && /Source/.test(blocker.reason),
  ),
)

const phuketPlan: TravelProject = {
  ...interactionMismatchPlan,
  sourceSections: [
    {
      level: 2,
      title: '度假村官方網站',
      anchor: 'item-1c51hpg',
      body: '住宿官網',
      links: [
        {
          label: '安納塔拉度假會',
          url: 'https://www.anantara.com/en/vacation-club-phuket',
        },
      ],
      enableComments: true,
      enableThumbsUp: true,
      enableThumbsDown: true,
    },
  ],
  sourceMetadata: {
    ...interactionMismatchPlan.sourceMetadata,
    sourceFile: '202702泰國普吉島7日.md',
    baseProjection: {
      title: interactionMismatchPlan.title,
      slug: interactionMismatchPlan.slug,
      isPrivate: true,
      startDate: interactionMismatchPlan.startDate,
      endDate: interactionMismatchPlan.endDate,
      sourceSections: [
        {
          level: 2,
          title: '度假村官方網站',
          anchor: 'item-1c51hpg',
          body: '住宿官網',
          links: [
            {
              label: 'https://www.anantara.com/en/vacation-club-phuket',
              url: 'https://www.anantara.com/en/vacation-club-phuket',
            },
          ],
          enableComments: true,
          enableThumbsUp: true,
          enableThumbsDown: true,
        },
      ],
    },
  },
}
const phuketSource: TravelSeed = {
  slug: phuketPlan.slug,
  title: phuketPlan.title,
  status: 'planning',
  isPrivate: true,
  startDate: phuketPlan.startDate,
  endDate: phuketPlan.endDate,
  externalDocIdentifier: '202702泰國普吉島7日.md',
  sourceSections: [
    {
      level: 2,
      title: '度假村官方網站',
      anchor: 'item-1c51hpg',
      body: '住宿官網',
      links: [
        {
          label: 'https://www.anantara.com/en/vacation-club-phuket',
          url: 'https://www.anantara.com/en/vacation-club-phuket',
        },
      ],
      enableComments: true,
      enableThumbsUp: true,
      enableThumbsDown: true,
    },
  ],
}
const phuketDraft = buildTravelPlanCopyDraft(phuketPlan, phuketSource)
assert.equal(
  phuketDraft.data.planningSections?.[0]?.links?.[0]?.label,
  '安納塔拉度假會',
)
assert.equal(
  phuketDraft.baseProjection.planningSections?.[0]?.links?.[0]?.label,
  'https://www.anantara.com/en/vacation-club-phuket',
)

const completedMemory: TravelProject = {
  id: 2,
  title: '東澳全覽9日',
  slug: '202308-east-australia',
  status: 'completed',
  startDate: '2023-08-01T00:00:00.000Z',
  endDate: '2023-08-09T00:00:00.000Z',
  members: [11],
  party: [{ name: '家人' }],
  galleryImages: [101],
  itineraryImages: [102],
  flights: [
    {
      date: '2023年8月1日',
      airline: '中華航空',
      flightNumber: 'CI057',
      route: 'TPE-MEL',
      passengers: '全家',
      terminal: 'T2',
    },
  ],
  lodgings: [
    {
      dateRange: '8/1~8/3',
      hotel: '墨爾本酒店',
      city: '墨爾本',
      roomType: '家庭房',
    },
  ],
  dailyItinerary: [
    {
      day: 1,
      date: '2023年8月1日',
      title: '抵達墨爾本',
      theme: '城市初見',
      segments: [{ time: '09:00', activity: '抵達機場', transport: '接駁車' }],
      meals: { dinner: '市區晚餐' },
      lodging: '墨爾本酒店',
    },
  ],
  reminders: [{ category: '返程', items: [{ text: '確認行李' }] }],
  externalVideos: [{ title: '旅行影片', youtubeUrl: 'https://youtu.be/example' }],
  sourceSections: [
    {
      level: 2,
      title: '第一天',
      anchor: 'day-1',
      displayDay: 'Day 1',
      displayDate: '2023年8月1日（二）',
      displaySubtitle: '抵達日',
      body: '抵達墨爾本。',
      enableComments: true,
      enableThumbsUp: true,
      enableThumbsDown: false,
    },
  ],
  sourceMetadata: {
    sourceFile: 'content-source/travels/202308-east-australia.md',
    sourceHash: 'legacy-hash',
    parserVersion: 'phase-16-v1',
    baseProjection: {
      title: '東澳全覽9日',
      slug: '202308-east-australia',
      status: 'completed',
      isPrivate: false,
      startDate: '2023-08-01',
      endDate: '2023-08-09',
      flights: [
        {
          date: '2023年8月1日',
          flightNumber: 'CI057',
          route: 'TPE-MEL',
          passengers: '全家',
          terminal: 'T2',
        },
      ],
      lodgings: [
        {
          dateRange: '8/1~8/3',
          hotel: '墨爾本酒店',
          city: '墨爾本',
          roomType: '家庭房',
        },
      ],
      dailyItinerary: [
        {
          day: 1,
          date: '2023年8月1日',
          title: '抵達墨爾本',
          theme: '城市初見',
          segments: [{ time: '09:00', activity: '抵達機場', transport: '接駁車' }],
          meals: { dinner: '市區晚餐' },
          lodging: '墨爾本酒店',
        },
      ],
      reminders: [{ category: '返程', items: [{ text: '確認行李' }] }],
      sourceSections: [
        {
          level: 2,
          title: '第一天',
          anchor: 'day-1',
          displayDay: 'Day 1',
          displayDate: '2023年8月1日（二）',
          displaySubtitle: '抵達日',
          body: '抵達墨爾本。',
          enableComments: true,
          enableThumbsUp: true,
          enableThumbsDown: false,
        },
      ],
      externalVideos: [{ title: '旅行影片', youtubeUrl: 'https://youtu.be/example' }],
    },
  },
  createdAt: '2023-07-01T00:00:00.000Z',
  updatedAt: '2023-08-20T00:00:00.000Z',
}

const completedSource: TravelSeed = {
  slug: completedMemory.slug,
  title: completedMemory.title,
  status: 'completed',
  isPrivate: false,
  startDate: '2023-08-01',
  endDate: '2023-08-09',
  externalDocIdentifier: 'content-source/travels/202308-east-australia.md',
  flights: [
    {
      date: '2023年8月1日',
      flightNumber: 'CI057',
      route: 'TPE-MEL',
      passengers: '全家',
      terminal: 'T2',
    },
  ],
  lodgings: [{ dateRange: '8/1~8/3', hotel: '墨爾本酒店', city: '墨爾本', roomType: '家庭房' }],
  dailyItinerary: [
    {
      day: 1,
      date: '2023年8月1日',
      title: '抵達墨爾本',
      theme: '城市初見',
      segments: [{ time: '09:00', activity: '抵達機場', transport: '接駁車' }],
      meals: { dinner: '市區晚餐' },
      lodging: '墨爾本酒店',
    },
  ],
  reminders: [{ category: '返程', items: [{ text: '確認行李' }] }],
  sourceSections: [
    {
      level: 2,
      title: '第一天',
      anchor: 'day-1',
      displayDay: 'Day 1',
      displayDate: '2023年8月1日（二）',
      displaySubtitle: '抵達日',
      body: '抵達墨爾本。',
      enableComments: true,
      enableThumbsUp: true,
      enableThumbsDown: false,
    },
  ],
  externalVideos: [{ title: '旅行影片', youtubeUrl: 'https://youtu.be/example' }],
}

const memoryAssessment = assessTravelProjectCopy(completedMemory)
assert.equal(memoryAssessment.targetCollection, 'travel-memories')
assert.equal(memoryAssessment.planPresentation, undefined)
assert.ok(
  memoryAssessment.mappings.some(
    (mapping) => mapping.sourcePath === 'members' && mapping.targetPath === 'participants',
  ),
)

const readyMemoryAssessment = assessTravelProjectCopy(
  completedMemory,
  new Date(),
  completedSource,
)
assert.equal(readyMemoryAssessment.readiness, 'ready')
assert.equal(readyMemoryAssessment.blockers.length, 0)
assert.ok(
  readyMemoryAssessment.mappings.some(
    (mapping) =>
      mapping.sourcePath === 'sourceSections' && mapping.targetPath === 'storySections',
  ),
)

const memoryDraft = buildTravelMemoryCopyDraft(completedMemory, completedSource)
assert.equal(memoryDraft.data.travelLedger?.flights?.[0]?.dateLabel, '2023年8月1日')
assert.equal(memoryDraft.data.travelLedger?.flights?.[0]?.airline, '中華航空')
assert.equal(memoryDraft.data.travelLedger?.flights?.[0]?.terminal, 'T2')
assert.equal(memoryDraft.data.travelLedger?.lodgings?.[0]?.dateRange, '8/1~8/3')
assert.equal(memoryDraft.data.dailyHighlights?.[0]?.theme, '城市初見')
assert.equal(memoryDraft.data.dailyHighlights?.[0]?.segments?.[0]?.transport, '接駁車')
assert.equal(memoryDraft.data.storySections?.[0]?.displaySubtitle, '抵達日')
assert.deepEqual(memoryDraft.data.storySections?.[0]?.interactions, {
  commentsEnabled: true,
  thumbsUpEnabled: true,
  thumbsDownEnabled: false,
})
assert.equal(memoryDraft.data.externalVideos?.[0]?.url, 'https://youtu.be/example')
assert.equal(memoryDraft.data.sourceMetadata.parserVersion, 'phase-17-memory-v1')
assert.ok(!('status' in memoryDraft.data))
assert.throws(
  () =>
    buildTravelMemoryCopyDraft(completedMemory, {
      ...completedSource,
      sourceSections: completedSource.sourceSections?.map((section) => ({
        ...section,
        body: `${section.body}\nSource changed`,
      })),
    }),
  /必須先重新執行 reconciliation/,
)

const localizedMemory: TravelProject = {
  ...completedMemory,
  party: [
    {
      name: { 'zh-TW': '家人', en: 'Family' } as unknown as string,
      note: { 'zh-TW': '同行者', en: null } as unknown as string,
    },
  ],
  dailyItinerary: [
    {
      ...completedMemory.dailyItinerary![0]!,
      title: { 'zh-TW': '抵達墨爾本', en: null } as unknown as string,
      segments: [
        {
          activity: { 'zh-TW': '抵達機場', en: null } as unknown as string,
        },
      ],
    },
  ],
  reminders: [
    {
      category: { 'zh-TW': '返程', en: null } as unknown as string,
      items: [{ text: { 'zh-TW': '確認行李', en: null } as unknown as string }],
    },
  ],
}
const localizedMemoryDraft = buildTravelMemoryCopyDraft(localizedMemory, completedSource)
assert.deepEqual(localizedMemoryDraft.data.dailyHighlights?.[0]?.title, {
  'zh-TW': '抵達墨爾本',
  en: null,
})
assert.deepEqual(localizedMemoryDraft.data.reminders, [
  {
    category: { 'zh-TW': '返程', en: null },
    items: [{ text: { 'zh-TW': '確認行李', en: null } }],
  },
])
assert.deepEqual(localizedMemoryDraft.data.guestParticipants, [
  {
    name: { 'zh-TW': '家人', en: 'Family' },
    note: { 'zh-TW': '同行者', en: null },
  },
])
assert.throws(
  () =>
    buildTravelMemoryCopyDraft(completedMemory, {
      ...completedSource,
      optionalActivities: [{ name: '尚未承接的活動' }],
    }),
  /尚未承接的欄位：optionalActivities/,
)
assert.throws(
  () =>
    buildTravelMemoryCopyDraft(
      {
        ...completedMemory,
        sourceSections: [
          completedMemory.sourceSections![0]!,
          { ...completedMemory.sourceSections![0]!, title: '重複段落' },
        ],
      },
      completedSource,
    ),
  /重複 anchor：day-1/,
)
assert.ok(
  memoryAssessment.mappings.some(
    (mapping) => mapping.sourcePath === 'externalVideos' && mapping.targetPath === 'externalVideos',
  ),
)
assert.equal(memoryAssessment.readiness, 'blocked')
assert.ok(memoryAssessment.blockers.some((blocker) => blocker.sourcePath === 'sourceMetadata'))
assert.ok(
  memoryAssessment.mappings.some(
    (mapping) =>
      mapping.sourcePath === 'flights[].terminal' &&
      mapping.targetPath === 'travelLedger.flights[].terminal',
  ),
)

const report = buildTravelCollectionCopyReadiness(
  [archivedPlan, phuketPlan, completedMemory],
  {
    migrationApplied: false,
    targetRows: {
      travelMemories: 0,
      travelPlans: 0,
      travelRouteIdentities: 0,
    },
    references: {
      featuredTravel: 1,
      media: 12,
      timelineEvents: 2,
    },
    referenceOwners: [
      {
        slug: '202308-east-australia',
        featuredTravel: 1,
        media: 12,
        timelineEvents: 2,
      },
    ],
  },
  new Date('2026-08-01T00:00:00.000Z'),
  new Map([
    [archivedSource.slug, archivedSource],
    [phuketSource.slug, phuketSource],
    [completedSource.slug, completedSource],
  ]),
)

assert.deepEqual(report.summary, {
  total: 3,
  plans: 2,
  activePlans: 0,
  archivedPlans: 2,
  memories: 1,
  ready: 3,
  blocked: 0,
})
assert.ok(report.globalBlockers.some((blocker) => blocker.code === 'migration-not-applied'))
assert.ok(report.globalBlockers.some((blocker) => blocker.code === 'legacy-references'))
assert.equal(report.fieldUsage.flights, 2)
assert.equal(report.fieldUsage.sourceSections, 3)
assert.equal(report.fieldUsage.galleryImages, 1)

const markdown = renderTravelCollectionCopyReadinessMarkdown(report)
assert.match(markdown, /# Phase 17 Travel Collection Copy Readiness/)
assert.match(markdown, /202607-chongqing-yangtze-river/)
assert.match(markdown, /migration-not-applied/)
assert.match(markdown, /`flights`/)
assert.match(markdown, /`sourceSections` → `storySections`/)
assert.doesNotMatch(markdown, /比較兩個航班方案/)
assert.match(markdown, /202308-east-australia.*12.*2.*1/)

const allLocalesNullPlan: TravelProject = {
  ...archivedPlan,
  sourceMetadata: {
    sourceFile: 'content-source/travels/test.md',
    baseProjection: {
      title: '測試',
      slug: '202607-chongqing-yangtze-river',
      isPrivate: true,
      startDate: '2026-07-01',
      endDate: '2026-07-08',
    },
  },
  flights: [],
  sourceSections: [
    {
      level: 2,
      title: '測試',
      anchor: 'test',
      body: '測試',
      displayDay: { 'zh-TW': null, en: null } as unknown as string,
      displayDate: { 'zh-TW': null, en: null } as unknown as string,
      displaySubtitle: { 'zh-TW': null, en: null } as unknown as string,
    },
  ],
}
const allLocalesNullAssessment = assessTravelProjectCopy(
  allLocalesNullPlan,
  new Date(),
  {
    slug: allLocalesNullPlan.slug,
    title: '測試',
    status: 'planning',
    isPrivate: true,
    startDate: '2026-07-01',
    endDate: '2026-07-08',
    externalDocIdentifier: 'content-source/travels/test.md',
  },
)
assert.equal(allLocalesNullAssessment.readiness, 'ready')
