import assert from 'node:assert/strict'

import type { TravelProject } from '@/payload/payload-types'
import {
  assessTravelProjectCopy,
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
  sourceMetadata: {
    sourceFile: 'content-source/travels/202607-chongqing-yangtze-river.md',
    sourceHash: 'legacy-hash',
    parserVersion: 'phase-16-v1',
    baseProjection: { slug: '202607-chongqing-yangtze-river' },
  },
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
}

const assessment = assessTravelProjectCopy(
  archivedPlan,
  new Date('2026-08-01T00:00:00.000Z'),
)

assert.equal(assessment.targetCollection, 'travel-plans')
assert.equal(assessment.planPresentation, 'archived')
assert.equal(assessment.readiness, 'blocked')
assert.ok(assessment.blockers.some((blocker) => blocker.sourcePath === 'flights'))
assert.ok(assessment.blockers.some((blocker) => blocker.sourcePath === 'sourceMetadata'))

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
    (blocker) => blocker.sourcePath === 'sourceSections[0].interactions',
  ),
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
  flights: [
    {
      flightNumber: 'CI057',
      route: 'TPE-MEL',
      terminal: 'T2',
    },
  ],
  externalVideos: [{ title: '旅行影片', youtubeUrl: 'https://youtu.be/example' }],
  sourceSections: [
    {
      level: 2,
      title: '第一天',
      anchor: 'day-1',
      body: '抵達墨爾本。',
      enableComments: true,
      enableThumbsUp: true,
      enableThumbsDown: true,
    },
  ],
  sourceMetadata: {
    sourceFile: 'content-source/travels/202308-east-australia.md',
    sourceHash: 'legacy-hash',
    parserVersion: 'phase-16-v1',
    baseProjection: { slug: '202308-east-australia' },
  },
  createdAt: '2023-07-01T00:00:00.000Z',
  updatedAt: '2023-08-20T00:00:00.000Z',
}

const memoryAssessment = assessTravelProjectCopy(completedMemory)
assert.equal(memoryAssessment.targetCollection, 'travel-memories')
assert.equal(memoryAssessment.planPresentation, undefined)
assert.ok(
  memoryAssessment.mappings.some(
    (mapping) => mapping.sourcePath === 'members' && mapping.targetPath === 'participants',
  ),
)
assert.ok(
  memoryAssessment.mappings.some(
    (mapping) => mapping.sourcePath === 'externalVideos' && mapping.targetPath === 'externalVideos',
  ),
)
assert.equal(memoryAssessment.readiness, 'blocked')
assert.ok(
  memoryAssessment.blockers.some(
    (blocker) => blocker.sourcePath === 'sourceSections',
  ),
)
assert.ok(memoryAssessment.blockers.some((blocker) => blocker.sourcePath === 'sourceMetadata'))
assert.ok(
  memoryAssessment.mappings.some(
    (mapping) =>
      mapping.sourcePath === 'flights[].terminal' &&
      mapping.targetPath === 'travelLedger.flights[].terminal',
  ),
)

const report = buildTravelCollectionCopyReadiness(
  [archivedPlan, interactionMismatchPlan, completedMemory],
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
)

assert.deepEqual(report.summary, {
  total: 3,
  plans: 2,
  activePlans: 0,
  archivedPlans: 2,
  memories: 1,
  ready: 0,
  blocked: 3,
})
assert.ok(report.globalBlockers.some((blocker) => blocker.code === 'migration-not-applied'))
assert.ok(report.globalBlockers.some((blocker) => blocker.code === 'legacy-references'))
assert.equal(report.fieldUsage.flights, 2)
assert.equal(report.fieldUsage.sourceSections, 2)
assert.equal(report.fieldUsage.galleryImages, 1)

const markdown = renderTravelCollectionCopyReadinessMarkdown(report)
assert.match(markdown, /# Phase 17 Travel Collection Copy Readiness/)
assert.match(markdown, /202607-chongqing-yangtze-river/)
assert.match(markdown, /migration-not-applied/)
assert.match(markdown, /`flights`/)
assert.doesNotMatch(markdown, /比較兩個航班方案/)
assert.match(markdown, /202308-east-australia.*12.*2.*1/)

const allLocalesNullPlan: TravelProject = {
  ...archivedPlan,
  sourceMetadata: undefined,
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
const allLocalesNullAssessment = assessTravelProjectCopy(allLocalesNullPlan)
assert.equal(allLocalesNullAssessment.readiness, 'ready')
