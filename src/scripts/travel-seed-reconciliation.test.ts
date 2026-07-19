import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import {
  buildTravelProjection,
  classifyTravelField,
  reconciliationModeFromArgs,
  reconcileTravelSeed,
  travelProjectionHash,
  writePayloadTravelDraft,
} from './travel-seed-reconciliation'

const plan = reconcileTravelSeed({
  slug: '202607-chongqing-yangtze-river',
  base: { summary: '舊版摘要' },
  source: { summary: '來源新版摘要' },
  current: { summary: '舊版摘要' },
  mode: 'safe',
})

assert.equal(plan.action, 'apply-source')
assert.deepEqual(plan.patch, { summary: '來源新版摘要' })
assert.deepEqual(plan.conflicts, [])

const adminEditPlan = reconcileTravelSeed({
  slug: '202702-thailand-phuket',
  base: { summary: '來源摘要' },
  source: { summary: '來源摘要' },
  current: { summary: 'Admin 修正版摘要' },
})

assert.equal(adminEditPlan.action, 'preserve-current')
assert.deepEqual(adminEditPlan.patch, {})

const conflictPlan = reconcileTravelSeed({
  slug: '202702-thailand-phuket',
  base: { sourceSections: [{ anchor: 'day-1', body: '原行程' }] },
  source: { sourceSections: [{ anchor: 'day-1', body: '來源改版行程' }] },
  current: { sourceSections: [{ anchor: 'day-1', body: 'Admin 改版行程' }] },
})

assert.equal(conflictPlan.action, 'conflict')
assert.equal(conflictPlan.conflicts[0]?.field, 'sourceSections[day-1].body')
assert.equal(conflictPlan.conflicts[0]?.category, 'faithful-source-projection')
assert.deepEqual(conflictPlan.patch, {})

const partialSafePlan = reconcileTravelSeed({
  slug: '202702-thailand-phuket',
  base: { summary: 'Base', status: 'planning' },
  source: { summary: 'Source', status: 'completed' },
  current: { summary: 'Payload', status: 'planning' },
})

assert.equal(partialSafePlan.action, 'conflict')
assert.deepEqual(partialSafePlan.patch, { status: 'completed' })

const itemLevelFlightPlan = reconcileTravelSeed({
  slug: '202607-chongqing-yangtze-river',
  base: {
    flights: [
      { date: '7/1', flightNumber: 'MU3539', route: 'WUH→CKG', terminal: 'T3' },
    ],
  },
  source: {
    flights: [
      { date: '7/1', flightNumber: 'MU3539', route: 'WUH→CKG', terminal: 'T2' },
    ],
  },
  current: {
    flights: [
      {
        date: '7/1',
        flightNumber: 'MU3539',
        route: 'WUH→CKG',
        terminal: 'T3',
        notes: 'Admin 補充轉機提醒',
      },
    ],
  },
})

assert.equal(itemLevelFlightPlan.action, 'apply-source')
assert.deepEqual(itemLevelFlightPlan.patch, {
  flights: [
    {
      date: '7/1',
      flightNumber: 'MU3539',
      route: 'WUH→CKG',
      terminal: 'T2',
      notes: 'Admin 補充轉機提醒',
    },
  ],
})

const itemLevelDayPlan = reconcileTravelSeed({
  slug: '202702-thailand-phuket',
  base: { dailyItinerary: [{ day: 1, title: '抵達日', theme: 'Base' }] },
  source: { dailyItinerary: [{ day: 1, title: '抵達日', theme: 'Source 主題' }] },
  current: {
    dailyItinerary: [{ day: 1, title: 'Admin 修正標題', theme: 'Base' }],
  },
})

assert.equal(itemLevelDayPlan.action, 'apply-source')
assert.deepEqual(itemLevelDayPlan.patch, {
  dailyItinerary: [{ day: 1, title: 'Admin 修正標題', theme: 'Source 主題' }],
})

const itemLevelSectionPlan = reconcileTravelSeed({
  slug: '202702-thailand-phuket',
  base: { sourceSections: [{ anchor: 'day-1', title: 'Day 1', body: 'Base' }] },
  source: { sourceSections: [{ anchor: 'day-1', title: 'Day 1', body: 'Source body' }] },
  current: {
    sourceSections: [
      { anchor: 'day-1', title: 'Admin title', body: 'Base', enableComments: false },
    ],
  },
})

assert.equal(itemLevelSectionPlan.action, 'apply-source')
assert.deepEqual(itemLevelSectionPlan.patch, {
  sourceSections: [
    { anchor: 'day-1', title: 'Admin title', body: 'Source body', enableComments: false },
  ],
})

const itemLevelPlanningSectionPlan = reconcileTravelSeed({
  slug: '202702-thailand-phuket',
  base: { planningSections: [{ anchor: 'hotel', title: '住宿', body: 'Base' }] },
  source: { planningSections: [{ anchor: 'hotel', title: '住宿', body: 'Source body' }] },
  current: {
    planningSections: [{ anchor: 'hotel', title: 'Admin 住宿標題', body: 'Base' }],
  },
})

assert.equal(itemLevelPlanningSectionPlan.action, 'apply-source')
assert.deepEqual(itemLevelPlanningSectionPlan.patch, {
  planningSections: [{ anchor: 'hotel', title: 'Admin 住宿標題', body: 'Source body' }],
})
assert.equal(classifyTravelField('planningSections[hotel].body'), 'faithful-source-projection')

const itemLevelLodgingPlan = reconcileTravelSeed({
  slug: '202702-thailand-phuket',
  base: {
    lodgings: [{ dateRange: '2/2-2/5', hotel: 'Anantara', city: 'Phuket' }],
  },
  source: {
    lodgings: [
      { dateRange: '2/2-2/5', hotel: 'Anantara', city: 'Phuket', roomType: 'Villa' },
    ],
  },
  current: {
    lodgings: [
      { dateRange: '2/2-2/5', hotel: 'Anantara', city: 'Phuket', notes: 'Admin note' },
    ],
  },
})

assert.equal(itemLevelLodgingPlan.action, 'apply-source')

const unmatchedArrayPlan = reconcileTravelSeed({
  slug: '202702-thailand-phuket',
  base: { flights: [{ flightNumber: 'TBD', route: 'TPE→HKT' }] },
  source: { flights: [{ flightNumber: 'BR1', route: 'TPE→HKT' }] },
  current: { flights: [{ flightNumber: 'TBD', route: 'TPE→HKT', notes: 'Admin note' }] },
})

assert.equal(unmatchedArrayPlan.action, 'conflict')
assert.equal(unmatchedArrayPlan.conflicts[0]?.field, 'flights')

const matchedArrayConflictPlan = reconcileTravelSeed({
  slug: '202607-chongqing-yangtze-river',
  base: {
    flights: [{ date: '7/1', flightNumber: 'MU3539', route: 'WUH→CKG', terminal: 'T3' }],
  },
  source: {
    flights: [{ date: '7/1', flightNumber: 'MU3539', route: 'WUH→CKG', terminal: 'T2' }],
  },
  current: {
    flights: [{ date: '7/1', flightNumber: 'MU3539', route: 'WUH→CKG', terminal: 'T1' }],
  },
})

assert.equal(matchedArrayConflictPlan.action, 'conflict')
assert.equal(
  matchedArrayConflictPlan.conflicts[0]?.field,
  'flights[MU3539|7/1|WUH→CKG].terminal',
)
assert.deepEqual(matchedArrayConflictPlan.patch, {})

const duplicateAnchorPlan = reconcileTravelSeed({
  slug: '202702-thailand-phuket',
  base: {
    sourceSections: [
      { anchor: 'duplicate', body: 'Base A' },
      { anchor: 'duplicate', body: 'Base B' },
    ],
  },
  source: {
    sourceSections: [
      { anchor: 'duplicate', body: 'Source A' },
      { anchor: 'duplicate', body: 'Source B' },
    ],
  },
  current: {
    sourceSections: [
      { anchor: 'duplicate', body: 'Current A' },
      { anchor: 'duplicate', body: 'Current B' },
    ],
  },
})

assert.equal(duplicateAnchorPlan.action, 'conflict')
assert.equal(duplicateAnchorPlan.conflicts.length, 1)
assert.equal(duplicateAnchorPlan.conflicts[0]?.field, 'sourceSections')

const sourceWinsPlan = reconcileTravelSeed({
  slug: '202702-thailand-phuket',
  base: { summary: 'Base' },
  source: { summary: 'Source' },
  current: { summary: 'Payload' },
  mode: 'source-wins',
})

assert.equal(sourceWinsPlan.action, 'apply-source')
assert.deepEqual(sourceWinsPlan.patch, { summary: 'Source' })

const payloadWinsPlan = reconcileTravelSeed({
  slug: '202702-thailand-phuket',
  base: { summary: 'Base' },
  source: { summary: 'Source' },
  current: { summary: 'Payload' },
  mode: 'payload-wins',
})

assert.equal(payloadWinsPlan.action, 'preserve-current')

assert.equal(
  reconcileTravelSeed({
    slug: '202702-thailand-phuket',
    base: { summary: 'Base' },
    source: { summary: '共同新版' },
    current: { summary: '共同新版' },
  }).action,
  'already-converged',
)

assert.equal(
  reconcileTravelSeed({
    slug: 'new-planning-travel',
    source: { status: 'planning' },
  }).action,
  'create',
)

const legacyPlan = reconcileTravelSeed({
  slug: '202607-chongqing-yangtze-river',
  source: { summary: 'Source' },
  current: { summary: 'Payload Admin' },
})

assert.equal(legacyPlan.action, 'preserve-current')

const normalized = buildTravelProjection({
  id: 42,
  slug: '202702-thailand-phuket',
  startDate: '2027-02-02T00:00:00.000Z',
  coverImage: { id: 7, altText: 'cover' },
  sourceSections: [{ id: 'row-id', anchor: 'day-1', body: '行程' }],
  sourceMetadata: { parserVersion: 'old' },
})

assert.deepEqual(normalized, {
  slug: '202702-thailand-phuket',
  startDate: '2027-02-02',
  coverImage: 7,
  sourceSections: [{ anchor: 'day-1', body: '行程' }],
})
assert.equal(travelProjectionHash(normalized), travelProjectionHash({ ...normalized }))

assert.deepEqual(
  buildTravelProjection({
    flights: [{ airline: null, flightNumber: 'BR1' }],
  }),
  buildTravelProjection({
    flights: [{ flightNumber: 'BR1' }],
  }),
)

const adminLinkLabelPlan = reconcileTravelSeed({
  slug: '202702-thailand-phuket',
  base: {
    sourceSections: [
      { anchor: 'item-1c51hpg', links: [{ label: 'https://example.com', url: 'https://example.com' }] },
    ],
  },
  source: {
    sourceSections: [
      { anchor: 'item-1c51hpg', links: [{ label: 'https://example.com', url: 'https://example.com' }] },
    ],
  },
  current: {
    sourceSections: [
      { anchor: 'item-1c51hpg', links: [{ label: 'Admin 編輯標籤', url: 'https://example.com' }] },
    ],
  },
})

assert.equal(adminLinkLabelPlan.action, 'preserve-current')
assert.deepEqual(adminLinkLabelPlan.patch, {})
assert.equal(reconciliationModeFromArgs(['node', 'seed.ts']), 'safe')
assert.equal(reconciliationModeFromArgs(['node', 'seed.ts', '--source-wins']), 'source-wins')
assert.throws(
  () => reconciliationModeFromArgs(['node', 'seed.ts', '--source-wins', '--payload-wins']),
  /only one travel reconciliation mode/i,
)

const artifactRoot = await mkdtemp(path.join(tmpdir(), 'phase-16-export-'))
const draftPath = await writePayloadTravelDraft({
  artifactRoot,
  slug: '202702-thailand-phuket',
  sourceFile: 'content-source/travels/202702泰國普吉島7日.md',
  current: { summary: 'Payload Admin 修正版' },
})
const draft = await readFile(draftPath, 'utf8')

assert.match(draftPath, /\.payload-draft\.md$/)
assert.match(draft, /Payload Admin 修正版/)
assert.doesNotMatch(draftPath, /content-source\/travels/)
assert.equal(classifyTravelField('galleryImages'), 'media-projection')
assert.equal(classifyTravelField('dailyItinerary'), 'structured-display-projection')
